import type { CdrAgent } from "@cdr-kit/agent";
import type { CdrTool } from "./types.js";
import { createVaultSchema, uploadFileSchema, writeDataSchema } from "./schemas.js";

/** Base64 → Uint8Array using only standard browser/Node atob (no Node Buffer dep). */
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Original author/publish tools (raw createVault + small/large payload writes). */
export function authorTools(agent: CdrAgent): CdrTool[] {
  return [
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
