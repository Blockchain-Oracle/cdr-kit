import type { CdrAgent } from "@cdr-kit/agent";
import type { CdrTool } from "./types.js";
import {
  attachLicenseTermsSchema,
  mintLicenseTokenSchema,
  publishDataSchema,
  registerIpAssetSchema,
} from "./schemas.js";

/** 0.5.0 Story IP integration tools — requires @cdr-kit/story (peer dep, lazy-loaded). */
export function storyTools(agent: CdrAgent): CdrTool[] {
  return [
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
