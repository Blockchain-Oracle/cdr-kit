import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { CdrAgent } from "@cdr-kit/agent";

/**
 * A framework-agnostic CDR tool. This shape is the single source of truth: the MCP server and
 * every framework adapter (Vercel AI / LangChain / OpenAI / AgentKit / GOAT) map from it.
 * Descriptions are written FOR THE MODEL — they're how an LLM decides whether/how to call us.
 */
export interface CdrTool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  invoke: (input: unknown) => Promise<unknown>;
}

const decode = (b: Uint8Array) => new TextDecoder().decode(b);

/** Base64 → Uint8Array using only standard browser/Node atob (no Node Buffer dep). */
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* ============================================================ */
/* Reader-side schemas (consumer subset)                         */
/* ============================================================ */

const discoverSchema = z.object({
  fromBlock: z.number().int().nonnegative().optional().describe("Optional start block for the event scan"),
});
const subscribeSchema = z.object({
  uuid: z.number().int().describe("The vault UUID to subscribe to"),
  periods: z.number().int().min(1).default(1).describe("Number of subscription periods to pay for"),
  maxPricePerPeriodWei: z.string().describe("Max price per period, in wei, as a decimal string"),
});
const accessSchema = z.object({
  uuid: z.number().int().describe("The vault UUID to read"),
  accessAuxData: z
    .string()
    .optional()
    .describe("Optional 0x-hex aux data (e.g. ABI-encoded license tokenId for tier-gated vaults)"),
});
const accessLicenseSchema = z.object({
  uuid: z.number().int().describe("The vault UUID to read"),
  licenseTokenId: z.string().describe("Story license token ID (decimal string) the agent holds"),
});

/* ============================================================ */
/* Introspection schemas                                         */
/* ============================================================ */

const vaultInfoSchema = z.object({
  uuid: z.number().int().describe("The vault UUID"),
});
const creatorVaultsSchema = z.object({
  creator: z.string().describe("EOA address (0x...) of the vault creator"),
});
const entitlementSchema = z.object({
  uuid: z.number().int().describe("The vault UUID"),
  subscriber: z.string().optional().describe("Address to check (default: the agent's own address)"),
});
const estimateCostSchema = z.object({
  uuid: z.number().int().describe("The vault UUID"),
});
const listSubscriptionsSchema = z.object({
  fromBlock: z.number().int().nonnegative().optional().describe("Optional start block for the vault scan"),
});
const feesSchema = z.object({}).describe("Fetch CDR operation fees + operational threshold");

/* ============================================================ */
/* Author-side schemas                                           */
/* ============================================================ */

const createVaultSchema = z.object({
  readConditionAddr: z.string().describe("Address of the condition contract for read access"),
  readConfig: z.string().describe("ABI-encoded condition config (0x-hex)"),
  childConditions: z.array(z.string()).optional().describe("Optional child condition addresses (ComposableCondition)"),
  childConfigs: z.array(z.string()).optional().describe("Optional child condition configs (0x-hex)"),
  licenseTermsId: z.string().optional().describe("Story license terms ID (decimal string), if license-gated"),
  valueWei: z.string().optional().describe("Native value to send in wei (decimal string), default 0"),
});
const writeDataSchema = z.object({
  uuid: z.number().int().describe("Vault UUID to write into"),
  dataKey: z.string().describe("UTF-8 string to encrypt (<1KB after TDH2 overhead)"),
});
const uploadFileSchema = z.object({
  contentBase64: z.string().describe("Base64-encoded file contents (>1KB ok; goes to IPFS)"),
  addUrl: z.string().describe("IPFS pinning POST endpoint (e.g. https://api.web3.storage/upload)"),
  gatewayUrl: z.string().describe("IPFS read gateway (e.g. https://w3s.link)"),
  authHeader: z.string().optional().describe("Authorization header for the pinning service"),
  readConditionAddr: z.string().optional().describe("Override read condition (default: openCondition)"),
  readConditionData: z.string().optional().describe("ABI-encoded read-condition config (0x-hex)"),
});

/** Build the CDR tool set over an agent (its own wallet). Each tool validates its own input. */
export function createCdrTools(agent: CdrAgent): CdrTool[] {
  return [
    /* ---------- Discover + read ---------- */
    {
      name: "cdr_discover_vaults",
      description:
        "Discover Story CDR data vaults (returns each vault's uuid, ipId, creator). Call this first to find a vault to read or subscribe to.",
      inputSchema: discoverSchema,
      invoke: async (raw) => {
        const { fromBlock } = discoverSchema.parse(raw);
        const vaults = await agent.discover(fromBlock !== undefined ? { fromBlock: BigInt(fromBlock) } : undefined);
        return vaults.map((v) => ({ uuid: v.uuid, ipId: v.ipId, creator: v.creator, tokenId: v.tokenId.toString() }));
      },
    },
    {
      name: "cdr_subscribe_and_access",
      description:
        "Subscribe to (pay for) a subscription-gated Story CDR vault from the agent's own wallet, then read and decrypt it. Returns the decrypted text. Use when the agent is not yet subscribed.",
      inputSchema: subscribeSchema,
      invoke: async (raw) => {
        const { uuid, periods, maxPricePerPeriodWei } = subscribeSchema.parse(raw);
        const price = BigInt(maxPricePerPeriodWei);
        const data = await agent.subscribeAndAccess({
          uuid,
          periods: BigInt(periods),
          maxPricePerPeriod: price,
          value: price * BigInt(periods),
        });
        return { uuid, text: decode(data) };
      },
    },
    {
      name: "cdr_access_vault",
      description:
        "Read and decrypt a Story CDR vault the agent is already entitled to (subscribed, or holds the required license). Returns the decrypted text.",
      inputSchema: accessSchema,
      invoke: async (raw) => {
        const { uuid, accessAuxData } = accessSchema.parse(raw);
        const data = await agent.access(uuid, accessAuxData as `0x${string}` | undefined);
        return { uuid, text: decode(data) };
      },
    },
    {
      name: "cdr_access_license_gated",
      description:
        "Read and decrypt a license-gated Story CDR vault by presenting a Story license token ID the agent already owns. Encodes the license tokenId as accessAuxData per the deployed LicenseReadCondition.",
      inputSchema: accessLicenseSchema,
      invoke: async (raw) => {
        const { uuid, licenseTokenId } = accessLicenseSchema.parse(raw);
        const data = await agent.accessLicenseGated({ uuid, licenseTokenId: BigInt(licenseTokenId) });
        return { uuid, text: decode(data) };
      },
    },

    /* ---------- Introspection (view-only) ---------- */
    {
      name: "cdr_get_vault_info",
      description:
        "Read on-chain metadata for a CDR vault (tokenId, ipId, creator, licenseTermsId). Call this BEFORE subscribing to learn about a vault. View-only, no gas.",
      inputSchema: vaultInfoSchema,
      invoke: async (raw) => {
        const { uuid } = vaultInfoSchema.parse(raw);
        const info = await agent.getVaultInfo(uuid);
        if (!info) return { uuid, found: false };
        return {
          uuid: info.uuid,
          tokenId: info.tokenId.toString(),
          ipId: info.ipId,
          creator: info.creator,
          licenseTermsId: info.licenseTermsId.toString(),
        };
      },
    },
    {
      name: "cdr_creator_vaults",
      description:
        "List every vault a given creator has minted. Returns uuid + ipId + licenseTermsId per vault. Use to browse one author's catalog.",
      inputSchema: creatorVaultsSchema,
      invoke: async (raw) => {
        const { creator } = creatorVaultsSchema.parse(raw);
        const vaults = await agent.getCreatorVaults(creator as `0x${string}`);
        return vaults.map((v) => ({
          uuid: v.uuid,
          tokenId: v.tokenId.toString(),
          ipId: v.ipId,
          creator: v.creator,
          licenseTermsId: v.licenseTermsId.toString(),
        }));
      },
    },
    {
      name: "cdr_check_entitlement",
      description:
        "Check whether an address is currently subscribed to a vault — returns paidUntil unix timestamp + isEntitled bool. Use to avoid paying twice or to decide between subscribe vs access.",
      inputSchema: entitlementSchema,
      invoke: async (raw) => {
        const { uuid, subscriber } = entitlementSchema.parse(raw);
        return agent.getEntitlement(uuid, subscriber ? { subscriber: subscriber as `0x${string}` } : undefined);
      },
    },
    {
      name: "cdr_estimate_cost",
      description:
        "Look up a subscription-gated vault's plan (pricePerPeriod wei, period seconds, payee, mode). View-only. Use to budget before subscribing.",
      inputSchema: estimateCostSchema,
      invoke: async (raw) => {
        const { uuid } = estimateCostSchema.parse(raw);
        const plan = await agent.getSubscriptionPlan(uuid);
        return {
          uuid: plan.uuid,
          pricePerPeriodWei: plan.pricePerPeriodWei.toString(),
          periodSeconds: plan.periodSeconds.toString(),
          payee: plan.payee,
          mode: plan.mode,
          licensorIpId: plan.licensorIpId,
        };
      },
    },
    {
      name: "cdr_list_subscriptions",
      description:
        "List all vaults the agent is currently subscribed to (filters recent VaultCreated events by paidUntil > now). Use for budget tracking and renewal decisions.",
      inputSchema: listSubscriptionsSchema,
      invoke: async (raw) => {
        const { fromBlock } = listSubscriptionsSchema.parse(raw);
        const subs = await agent.listMySubscriptions(fromBlock !== undefined ? { fromBlock: BigInt(fromBlock) } : undefined);
        return subs.map((s) => ({
          uuid: s.uuid,
          ipId: s.ipId,
          creator: s.creator,
          paidUntilUnix: s.paidUntilUnix,
          expiresInSeconds: s.expiresInSeconds,
        }));
      },
    },
    {
      name: "cdr_get_fees",
      description:
        "Fetch the current CDR operation fees (allocate / write / read in wei) and the operational decryption threshold. View-only, no wallet needed.",
      inputSchema: feesSchema,
      invoke: async () => {
        const f = await agent.getFees();
        return {
          allocateWei: f.allocateWei.toString(),
          writeWei: f.writeWei.toString(),
          readWei: f.readWei.toString(),
          threshold: f.threshold,
        };
      },
    },

    /* ---------- Author / publish ---------- */
    {
      name: "cdr_create_vault",
      description:
        "Mint an NFT, register the IP, allocate a CDR slot, and configure the read condition — one transaction. Returns the tx hash; read your uuid from the VaultCreated event in the receipt.",
      inputSchema: createVaultSchema,
      invoke: async (raw) => {
        const p = createVaultSchema.parse(raw);
        const txHash = await agent.createVault({
          readConditionAddr: p.readConditionAddr as `0x${string}`,
          readConfig: p.readConfig as `0x${string}`,
          childConditions: p.childConditions as `0x${string}`[] | undefined,
          childConfigs: p.childConfigs as `0x${string}`[] | undefined,
          licenseTermsId: p.licenseTermsId ? BigInt(p.licenseTermsId) : undefined,
          valueWei: p.valueWei ? BigInt(p.valueWei) : undefined,
        });
        return { txHash };
      },
    },
    {
      name: "cdr_write_vault_data",
      description:
        "Encrypt a small (<1KB after TDH2 overhead) UTF-8 string and write it to an existing CDR vault. Returns the write tx hash.",
      inputSchema: writeDataSchema,
      invoke: async (raw) => {
        const { uuid, dataKey } = writeDataSchema.parse(raw);
        const txHash = await agent.writeVaultData({ uuid, dataKey: new TextEncoder().encode(dataKey) });
        return { uuid, txHash };
      },
    },
    {
      name: "cdr_upload_file",
      description:
        "Encrypt a file, pin the ciphertext to IPFS, allocate a CDR vault, write the CID+key reference — one composite operation for any >1KB payload. Returns uuid + cid + tx hashes.",
      inputSchema: uploadFileSchema,
      invoke: async (raw) => {
        const p = uploadFileSchema.parse(raw);
        const content = base64ToBytes(p.contentBase64);
        const res = await agent.uploadFile({
          content,
          addUrl: p.addUrl,
          gatewayUrl: p.gatewayUrl,
          authHeader: p.authHeader,
          readConditionAddr: p.readConditionAddr as `0x${string}` | undefined,
          readConditionData: p.readConditionData as `0x${string}` | undefined,
        });
        return { uuid: res.uuid, cid: res.cid, txHashes: res.txHashes };
      },
    },
  ];
}

/** JSON Schema for a tool's input — feeds the OpenAI/Anthropic/MCP adapters. */
export function toJsonSchema(tool: CdrTool): Record<string, unknown> {
  return zodToJsonSchema(tool.inputSchema, { target: "openApi3" }) as Record<string, unknown>;
}
