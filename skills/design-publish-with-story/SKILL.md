<!-- Source-of-truth lives at packages/plugin/cdr-kit/skills/design-publish-with-story/SKILL.md — keep these synchronized when editing. -->
---
name: design-publish-with-story
description: Use the cdr-kit agent-as-publisher one-shot (agent.publish) to ship a Story-IP-registered, license-gated CDR vault in a single call. Use this skill when (1) the user wants to monetize encrypted data via Story PIL license tokens; (2) the user asks how to register IP + attach PIL terms + create vault + write data in one tx-bundle; (3) the user is picking between commercial-use, commercial-remix, non-commercial-social-remixing, or creative-commons PIL flavors; (4) the user is combining @cdr-kit/story with @cdr-kit/agent or wiring an SPG NFT contract.
license: MIT
---

# Publish data with Story IP — the agent-as-publisher one-shot

`agent.publish({ data, spgNftContract, pilTerms })` collapses 4 normally-separate Story Protocol calls into a single agent method: register a fresh IP asset, attach PIL license terms, allocate a license-gated CDR vault, and write the encrypted payload. The output is everything a buyer needs to subscribe and read: `{ ipId, tokenId, licenseTermsId, vaultUuid, vaultTxHash, ipRegisterTxHash, writeTxHash }`. This is the highest-DX win in `@cdr-kit/agent` — the wedge for autonomous data sellers.

## When to use

- "Sell my encrypted dataset on Story Protocol"
- "Register an IP asset and gate the CDR vault to license-token holders"
- "PIL commercial-remix flow with CDR access"
- "Agent publishes original data and prices it via Story license-mint fee"
- "I want one call that does register + attach terms + create vault + write"
- "How does PIL pricing flow through to CDR reads?"

## The 4-step flow this one-shot encapsulates

```
1. registerIpAsset({ nft: { type: "mint", spgNftContract }, licenseTermsData: [{ terms }] })
   → { ipId, tokenId, licenseTermsIds[0] }
2. createVault({ readConditionAddr: licenseReadCondition, readConfig: encode(ipId, licenseTermsId) })
   → vaultTxHash → extract uuid from VaultCreated event
3. writeVaultData({ uuid, dataKey: data })
   → writeTxHash
4. (return everything; buyers use ipId + licenseTermsId to mintLicenseTokens + access)
```

The buyer-side counterpart is `agent.accessLicenseGated({ uuid, licenseTokenId })` once they've minted a license token via Story.

## Pre-requisites the publish() flow assumes

- **An SPG NFT collection.** Story's Story Protocol Gateway (SPG) lets you mint into a collection without deploying your own ERC-721. Create one once at https://story.foundation/apps/spg — you get back an `spgNftContract` address that you reuse for every IP you register. Per-IP cost: just gas + mint fee.
- **PIL terms.** Use `PILFlavor.commercialUse({ ... })` / `commercialRemix({ ... })` / `nonCommercialSocialRemixing()` / `creativeCommonsAttribution()` from `@cdr-kit/story` to build the terms struct. Don't hand-construct `PILTerms` — the SDK validators are strict and the 17-field shape changes between Story versions.
- **`@cdr-kit/story` installed.** It's a peer dep — `pnpm add @cdr-kit/story @story-protocol/core-sdk`. The agent lazy-loads it; basic users who don't publish never pay the install cost.

## Minimal example

```ts
import { CdrAgent } from "@cdr-kit/agent";
import { PILFlavor } from "@cdr-kit/story";

const agent = new CdrAgent({ privateKey: process.env.CDR_PRIVATE_KEY!, network: "aeneid" });

const result = await agent.publish({
  data: new TextEncoder().encode("the actual secret data"),
  spgNftContract: "0xYourSpgNftCollection",
  pilTerms: PILFlavor.commercialUse({
    defaultMintingFee: 1_000_000_000_000_000_000n,  // 1 WIP per license
    commercialRevShare: 5,                            // 5% of derivative revenue back to original
  }),
  ipMetadata: { ipMetadataURI: "ipfs://Qm..." },     // optional
});

// → { ipId, tokenId, licenseTermsId, vaultUuid, vaultTxHash, ipRegisterTxHash, writeTxHash }
```

## PIL flavors — picking the right one

| Flavor | Mint fee | Derivative rev share | Use when |
|---|---|---|---|
| `nonCommercialSocialRemixing` | 0 | 0% | Open-source datasets, free public IP |
| `commercialUse` | per-license fee | 0% | One-off data sales; buyer can use commercially, no derivatives |
| `commercialRemix` | per-license fee | configurable % | Buyer can build derivative works; revenue flows back |
| `creativeCommonsAttribution` | 0 | 0% | Attribution-required free use (CC-BY) |

For CDR-published data, **`commercialUse`** is the default — the data is paid-for and the buyer reads it, but you don't want derivative works without a separate license discussion. **`commercialRemix`** when you want analytics/derivative IP downstream and a cut of that revenue.

## The buyer flow

Once `publish()` returns, share `{ ipId, licenseTermsId, vaultUuid }` (e.g., as a URL or QR). Buyer flow:

```ts
// 1. (optional) wrap IP → WIP for license mint fee:
await agent.wrapIp({ amountWei: 1_000_000_000_000_000_000n });
await agent.approveWip({ spender: royaltyModuleAddress, amountWei: 1_000_000_000_000_000_000n });

// 2. mint a license token:
const { licenseTokenIds, txHash } = await agent.mintLicenseTokens({
  licensorIpId: ipId,
  licenseTermsId,
  amount: 1n,
  maxMintingFee: 1_000_000_000_000_000_000n,
});

// 3. read the vault:
const bytes = await agent.accessLicenseGated({ uuid: vaultUuid, licenseTokenId: licenseTokenIds[0]! });
```

This is the same pattern `jacob-tucker/cdr-ai-negotiate` uses end-to-end — agent-to-agent commerce where the license-mint IS the payment.

## Composing with derivatives

Once a buyer mints a license, they can register their derivative IP:

```ts
await agent.registerDerivative({
  childIpId: derivIpId,
  parentIpIds: [originalIpId],
  licenseTermsIds: [licenseTermsId],
  licenseTokenIds: [boughtLicenseTokenId],  // optional — consume the token at register time
});
```

Royalty flows back to the original IP per the PIL terms' `commercialRevShare`. The CDR vault doesn't participate — only Story's royalty graph does.

## Common failure modes

- **`SPG_INVALID_PUBLIC_MINT`** — your SPG contract isn't configured for public mints. Configure via Story's SPG factory UI, or use a non-SPG `register({ nft: { type: "minted", nftContract, tokenId } })` flow.
- **`licenseTermsIds missing from registerIpAsset response`** — `publish()` throws this; means the SDK returned ok but didn't include the terms ID, usually because you passed empty `licenseTermsData`. Always pass at least one terms entry.
- **`InvalidConditionContract` on vault create** — your network's `licenseReadCondition` address is wrong or stale. Check `@cdr-kit/contracts.aeneid.licenseReadCondition`.
- **Buyer gets `UnauthorizedRead` despite holding a license** — they're passing a token from a different `licenseTermsId` than the vault is gated on. The token ID and the vault's gating terms must match.

## Don't

- Don't construct `PILTerms` by hand — the SDK shape changes; use `PILFlavor.<flavor>(params)`.
- Don't reuse SPG NFT collections across unrelated products without thinking about brand attribution; an SPG can host many IPs but they all share the collection metadata.
- Don't gate a low-stakes preview vault behind `LicenseReadCondition` — minting a license costs gas. For free previews, use `OpenCondition` or `TimeWindow`.
- Don't store the only copy of mission-critical data via `publish()` without dry-running the buyer flow first. CDR reads have ~7-min latency ceiling; verify end-to-end before going live.
