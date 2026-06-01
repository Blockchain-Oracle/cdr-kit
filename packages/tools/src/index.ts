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

/* ============================================================ */
/* 0.5.0 advanced-condition schemas                              */
/* ============================================================ */

const createTimeWindowSchema = z.object({
  startTs: z.string().describe("Start timestamp (or block) as a decimal string. Use 0 for 'always-on from genesis'."),
  endTs: z.string().describe("End timestamp (or block) as a decimal string. Use 0 for 'open-ended after startTs'."),
  blockBased: z.boolean().default(false).describe("Interpret startTs/endTs as block numbers instead of unix timestamps"),
  licenseTermsId: z.string().optional().describe("Story PIL license terms ID (decimal string)"),
  valueWei: z.string().optional().describe("Native IP to send in wei (decimal). Defaults to 0."),
});

const createDeadManSchema = z.object({
  duration: z.string().describe("Heartbeat window in seconds (or blocks) as a decimal string"),
  heirs: z.array(z.string()).describe("Heir wallet addresses; allowed to read post-unlock if publicAfterUnlock=false"),
  blockBased: z.boolean().default(false).describe("Interpret duration as blocks instead of seconds"),
  creatorCanReadWhileLocked: z.boolean().default(true).describe("Creator can read their own vault pre-unlock"),
  publicAfterUnlock: z.boolean().default(false).describe("If true, ANYONE reads post-unlock; if false, only `heirs`"),
  licenseTermsId: z.string().optional(),
  valueWei: z.string().optional(),
});

const createEscrowSchema = z.object({
  seller: z.string().optional().describe("Seller address (default: this agent's wallet)"),
  price: z.string().describe("Listing price in wei (decimal string)"),
  timeoutSecs: z.string().describe("Seconds after buyer's pay before seller can unilaterally claim"),
  arbiter: z.string().optional().describe("Arbiter address; can refund buyer. Omit for no-arbiter mode."),
  licenseTermsId: z.string().optional(),
  valueWei: z.string().optional(),
});

const createMultiSigSchema = z.object({
  signers: z.array(z.string()).min(1).describe("Signer wallet addresses (auto-sorted by the helper)"),
  threshold: z.number().int().min(1).describe("Minimum sigs required to read (N-of-M)"),
  licenseTermsId: z.string().optional(),
  valueWei: z.string().optional(),
});

/* ============================================================ */
/* 0.5.0 Story IP integration schemas                            */
/* ============================================================ */

const registerIpAssetSchema = z.object({
  spgNftContract: z.string().describe("SPG NFT contract address for fresh mints"),
  recipient: z.string().optional().describe("NFT recipient address (default: the agent's wallet)"),
  ipMetadataURI: z.string().optional().describe("Off-chain JSON metadata URI for the IP"),
  ipMetadataHash: z.string().optional().describe("0x-hex keccak256 of the IP metadata"),
  nftMetadataURI: z.string().optional().describe("Off-chain JSON metadata URI for the NFT"),
  nftMetadataHash: z.string().optional().describe("0x-hex keccak256 of the NFT metadata"),
});

const attachLicenseTermsSchema = z.object({
  ipId: z.string().describe("IP asset address (0x...) to attach terms to"),
  licenseTermsId: z.string().describe("PIL license terms id (decimal string)"),
  licenseTemplate: z.string().optional().describe("PIL template address (default: aeneid.pilTemplate)"),
});

const mintLicenseTokenSchema = z.object({
  licensorIpId: z.string().describe("Licensor IP address (the seller's IP asset)"),
  licenseTermsId: z.string().describe("PIL license terms id (decimal string)"),
  amount: z.string().default("1").describe("Number of tokens to mint (decimal string)"),
  receiver: z.string().optional().describe("Token recipient (default: the agent's wallet)"),
  maxMintingFee: z.string().default("0").describe("Max minting fee in wei (decimal string)"),
});

const publishDataSchema = z.object({
  dataKey: z.string().describe("UTF-8 string to encrypt (<1KB after TDH2 overhead) + publish as an IP"),
  spgNftContract: z.string().describe("SPG NFT contract address (your own — register via SPG factory)"),
  /** PILTerms struct is rich + flavor-specific. Pass a flavor name + minimal params; the tool
   *  constructs the PILTerms via PILFlavor.<flavor>(params). */
  flavor: z
    .enum(["nonCommercialSocialRemixing", "commercialUse", "commercialRemix", "creativeCommonsAttribution"])
    .describe("PIL flavor — picks the right preset"),
  defaultMintingFee: z.string().default("0").describe("PIL: default minting fee in wei (decimal string)"),
  commercialRevShare: z.number().int().min(0).max(100).default(0).describe("PIL: commercial rev share %, 0-100"),
  ipMetadataURI: z.string().optional(),
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

    /* ---------- 0.5.0 advanced conditions ---------- */
    {
      name: "cdr_create_time_window_vault",
      description:
        "Create a Story CDR vault gated by an absolute time (or block) window. Read access is only allowed during [startTs, endTs]. Use endTs=0 for 'open-ended after startTs' (release-on-date pattern). Returns the tx hash; read the uuid from the VaultCreated event in the receipt.",
      inputSchema: createTimeWindowSchema,
      invoke: async (raw) => {
        const p = createTimeWindowSchema.parse(raw);
        const txHash = await agent.createTimeWindowVault({
          startTs: BigInt(p.startTs),
          endTs: BigInt(p.endTs),
          blockBased: p.blockBased,
          licenseTermsId: p.licenseTermsId ? BigInt(p.licenseTermsId) : undefined,
          valueWei: p.valueWei ? BigInt(p.valueWei) : undefined,
        });
        return { txHash };
      },
    },
    {
      name: "cdr_create_dead_man_vault",
      description:
        "Create a dead-man-switch Story CDR vault. The creator must call cdr_poke_dead_man before each `duration` window elapses, or read access flips to `heirs` (or public). The canonical wallet-recovery / leak-on-disappearance pattern.",
      inputSchema: createDeadManSchema,
      invoke: async (raw) => {
        const p = createDeadManSchema.parse(raw);
        const txHash = await agent.createDeadManVault({
          duration: BigInt(p.duration),
          heirs: p.heirs as `0x${string}`[],
          blockBased: p.blockBased,
          creatorCanReadWhileLocked: p.creatorCanReadWhileLocked,
          publicAfterUnlock: p.publicAfterUnlock,
          licenseTermsId: p.licenseTermsId ? BigInt(p.licenseTermsId) : undefined,
          valueWei: p.valueWei ? BigInt(p.valueWei) : undefined,
        });
        return { txHash };
      },
    },
    {
      name: "cdr_create_escrow_vault",
      description:
        "Create a Story CDR vault released to a buyer only after they pay + confirm delivery. Optional arbiter can refund disputed deals. Seller can also unilaterally claim after `timeoutSecs` of buyer silence.",
      inputSchema: createEscrowSchema,
      invoke: async (raw) => {
        const p = createEscrowSchema.parse(raw);
        const txHash = await agent.createEscrowVault({
          seller: p.seller as `0x${string}` | undefined,
          price: BigInt(p.price),
          timeoutSecs: BigInt(p.timeoutSecs),
          arbiter: p.arbiter as `0x${string}` | undefined,
          licenseTermsId: p.licenseTermsId ? BigInt(p.licenseTermsId) : undefined,
          valueWei: p.valueWei ? BigInt(p.valueWei) : undefined,
        });
        return { txHash };
      },
    },
    {
      name: "cdr_create_multi_sig_vault",
      description:
        "Create an N-of-M multi-sig Story CDR vault. Read access requires `threshold`-many EIP-712 signatures from configured signers, collected off-chain. First-of-kind in the CDR ecosystem — no on-chain approval txs per signer.",
      inputSchema: createMultiSigSchema,
      invoke: async (raw) => {
        const p = createMultiSigSchema.parse(raw);
        const txHash = await agent.createMultiSigVault({
          signers: p.signers as `0x${string}`[],
          threshold: p.threshold,
          licenseTermsId: p.licenseTermsId ? BigInt(p.licenseTermsId) : undefined,
          valueWei: p.valueWei ? BigInt(p.valueWei) : undefined,
        });
        return { txHash };
      },
    },

    /* ---------- 0.5.0 Story IP integration (requires @cdr-kit/story) ---------- */
    {
      name: "cdr_register_ip",
      description:
        "Register an NFT as a Story IP asset. Fresh-mint mode (spgNftContract → mint a new NFT in that collection and register it). Returns the IP id + tokenId + tx hash.",
      inputSchema: registerIpAssetSchema,
      invoke: async (raw) => {
        const p = registerIpAssetSchema.parse(raw);
        const res = await agent.registerIpAsset({
          nft: {
            type: "mint",
            spgNftContract: p.spgNftContract as `0x${string}`,
            recipient: p.recipient as `0x${string}` | undefined,
          },
          ipMetadata: {
            ipMetadataURI: p.ipMetadataURI,
            ipMetadataHash: p.ipMetadataHash as `0x${string}` | undefined,
            nftMetadataURI: p.nftMetadataURI,
            nftMetadataHash: p.nftMetadataHash as `0x${string}` | undefined,
          },
        });
        return {
          ipId: res.ipId,
          tokenId: res.tokenId.toString(),
          licenseTermsIds: res.licenseTermsIds?.map((t) => t.toString()),
          txHash: res.txHash,
        };
      },
    },
    {
      name: "cdr_attach_license_terms",
      description:
        "Attach PIL license terms to a Story IP asset. Required before minting license tokens — the terms define the price + downstream rights buyers receive.",
      inputSchema: attachLicenseTermsSchema,
      invoke: async (raw) => {
        const p = attachLicenseTermsSchema.parse(raw);
        const res = await agent.attachLicenseTerms({
          ipId: p.ipId as `0x${string}`,
          licenseTermsId: BigInt(p.licenseTermsId),
          licenseTemplate: p.licenseTemplate as `0x${string}` | undefined,
        });
        return { txHash: res.txHash };
      },
    },
    {
      name: "cdr_mint_license_token",
      description:
        "Mint Story license tokens against an IP asset's licenseTermsId. The minting fee (if any) is paid in WIP per the PIL terms. Buyers use the resulting license token id to unlock license-gated CDR vaults.",
      inputSchema: mintLicenseTokenSchema,
      invoke: async (raw) => {
        const p = mintLicenseTokenSchema.parse(raw);
        const res = await agent.mintLicenseTokens({
          licensorIpId: p.licensorIpId as `0x${string}`,
          licenseTermsId: BigInt(p.licenseTermsId),
          amount: BigInt(p.amount),
          receiver: p.receiver as `0x${string}` | undefined,
          maxMintingFee: BigInt(p.maxMintingFee),
        });
        return {
          licenseTokenIds: res.licenseTokenIds.map((t) => t.toString()),
          txHash: res.txHash,
        };
      },
    },
    {
      name: "cdr_publish_data",
      description:
        "Agent-as-publisher one-shot: register a new Story IP + attach commercial PIL terms + create a license-gated CDR vault + write the encrypted secret — in one call. Returns ipId + licenseTermsId + vault uuid + all relevant tx hashes. The highest-value DX win for autonomous data sellers.",
      inputSchema: publishDataSchema,
      invoke: async (raw) => {
        const p = publishDataSchema.parse(raw);
        // PILFlavor is re-exported from @cdr-kit/story; lazy-import here so the basic agent path
        // doesn't pay the cost of resolving @story-protocol/core-sdk on every cold start.
        const { PILFlavor } = await import("@cdr-kit/story");
        const flavorBuilder = (PILFlavor as unknown as Record<string, (args?: unknown) => unknown>)[p.flavor];
        if (!flavorBuilder) throw new Error(`cdr-kit/tools: unknown PIL flavor "${p.flavor}"`);
        const pilTerms = flavorBuilder({
          defaultMintingFee: BigInt(p.defaultMintingFee),
          commercialRevShare: p.commercialRevShare,
        });
        const res = await agent.publish({
          data: new TextEncoder().encode(p.dataKey),
          spgNftContract: p.spgNftContract as `0x${string}`,
          pilTerms,
          ipMetadata: p.ipMetadataURI ? { ipMetadataURI: p.ipMetadataURI } : undefined,
        });
        return {
          ipId: res.ipId,
          tokenId: res.tokenId.toString(),
          licenseTermsId: res.licenseTermsId.toString(),
          vaultUuid: res.vaultUuid,
          vaultTxHash: res.vaultTxHash,
          ipRegisterTxHash: res.ipRegisterTxHash,
          writeTxHash: res.writeTxHash,
        };
      },
    },
  ];
}

/** JSON Schema for a tool's input — feeds the OpenAI/Anthropic/MCP adapters. */
export function toJsonSchema(tool: CdrTool): Record<string, unknown> {
  return zodToJsonSchema(tool.inputSchema, { target: "openApi3" }) as Record<string, unknown>;
}
