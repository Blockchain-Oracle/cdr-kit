import type { CdrAgent } from "@cdr-kit/agent";
import type { CdrTool } from "./types.js";
import { accessLicenseSchema, accessSchema, discoverSchema, subscribeSchema } from "./schemas.js";

const decode = (b: Uint8Array) => new TextDecoder().decode(b);

/** Discover + read tools — the consumer-side subset of the CDR surface. */
export function readTools(agent: CdrAgent): CdrTool[] {
  return [
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
  ];
}
