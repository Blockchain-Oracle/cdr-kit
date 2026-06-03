<p align="center">
  <a href="https://cdrkit.xyz">
    <img src="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/icon.svg" alt="cdr-kit" width="80">
  </a>
</p>

# @cdr-kit/story

Thin TypeScript wrappers over [`@story-protocol/core-sdk`](https://docs.story.foundation/) for the **Story Protocol IP creator surface**: register an IP asset, attach PIL license terms, mint license tokens, register derivatives, wrap IP into WIP. The companion to [`@cdr-kit/agent`](../agent), which adds the headline `agent.publish()` one-shot that collapses IP-register + PIL-attach + create-license-gated-vault + write-encrypted-data into a single call.

```bash
npm install @cdr-kit/story @story-protocol/core-sdk viem
```

```ts
import { createStoryClient, registerIpAsset, registerPilTerms, attachLicenseTerms, PILFlavor } from "@cdr-kit/story";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const client = await createStoryClient({ account, chainId: 1315 /* Aeneid */ });

// 1. Register an IP asset (from an existing SPG NFT collection)
const ip = await registerIpAsset(client, {
  nft: { type: "mint", spgNftContract: "0xYourSpgCollection" },
  ipMetadata: { ipMetadataURI: "ipfs://..." },
});
// → { ipId, tokenId, txHash }

// 2. Register PIL terms (commercialUse, 1 WIP per license, 5% derivative rev share)
const terms = await registerPilTerms(client, {
  flavor: PILFlavor.commercialUse({
    defaultMintingFee: 1_000_000_000_000_000_000n,
    commercialRevShare: 5,
  }),
});
// → { licenseTermsId, txHash }

// 3. Attach the PIL terms to the IP
await attachLicenseTerms(client, { ipId: ip.ipId, licenseTermsId: terms.licenseTermsId });
```

## Why this package exists

`@story-protocol/core-sdk` is the canonical SDK but ships a maximalist surface with several footguns: every method returns a different shape, PIL flavor params have no decision tree, `wrapIp` vs `approveWip` ordering matters, and chaining the "register IP → attach terms → mint license tokens" flow takes 50+ lines of glue. `@cdr-kit/story` normalizes the return shapes, exposes the canonical 9 calls, and pairs with `@cdr-kit/agent`'s `publish()` for the one-shot author flow.

## Exports

| Function | Purpose | Returns |
|---|---|---|
| `createStoryClient(opts)` | Memoized SDK client bound to a wagmi/viem account | `StoryClient` |
| `registerIpAsset(client, req)` | Register an existing NFT as a Story IP asset | `{ ipId, tokenId, txHash }` |
| `mintAndRegisterIp(client, req)` | Mint a fresh NFT in your SPG collection + register it as IP in one tx | `{ ipId, tokenId, txHash }` |
| `registerPilTerms(client, { flavor })` | Register a PIL license terms entry (idempotent by content hash) | `{ licenseTermsId, txHash }` |
| `attachLicenseTerms(client, { ipId, licenseTermsId, licenseTemplate? })` | Attach PIL terms to an IP — required before any license can be minted | `{ txHash }` |
| `mintLicenseTokens(client, { licensorIpId, licenseTermsId, amount, receiver?, maxMintingFee? })` | Buyer mints license token(s) — the **payment** for commercial flavors | `{ licenseTokenIds: bigint[], txHash }` |
| `registerDerivative(client, { childIpId, parentIpIds, licenseTermsIds, licenseTokenIds? })` | Register a child IP as a derivative of one or more parents | `{ txHash }` |
| `wrapIp(client, { amountWei })` | Wrap native IP → WIP (ERC-20) for use as the royalty token | `{ txHash }` |
| `approveWip(client, { spender, amountWei })` | Approve the RoyaltyModule (or any spender) to pull WIP from your wallet | `{ txHash }` |

Re-exported from `@story-protocol/core-sdk`: `PILFlavor` (the 4 flavor builders), `StoryClient` type.

## PIL flavor decision tree

| Flavor | Mints license tokens? | Allows derivatives? | Charges per mint? | Use when… |
|---|---|---|---|---|
| `PILFlavor.nonCommercialSocialRemixing()` | yes (free) | yes | no (0 fee) | open-source IP, public good, attribution-only |
| `PILFlavor.creativeCommonsAttribution()` | yes (free) | yes | no (0 fee) | CC-BY shape — attribution required, no commercial restriction |
| `PILFlavor.commercialUse({ defaultMintingFee, commercialRevShare })` | yes (paid) | **no** | yes | paid one-off use, you don't want others remixing your work commercially |
| `PILFlavor.commercialRemix({ defaultMintingFee, commercialRevShare })` | yes (paid) | yes (rev flows back) | yes | paid use + derivatives allowed; revenue from derivatives flows back to you via the royalty graph |

**Picking guidance.** If you want the buyer to pay → `commercial*`. If you want derivatives → `*Remix` or `nonCommercialSocialRemixing`. If you want both → `commercialRemix`. If you just want to release IP openly → `nonCommercialSocialRemixing` or `creativeCommonsAttribution`.

**Required params for commercial flavors.** `defaultMintingFee` is wei-denominated WIP charged per `mintLicenseTokens()` call (× amount). `commercialRevShare` is a `uint16` percentage (1–100). The fee goes to the licensor; rev share applies to all downstream derivatives.

## The one-shot: `agent.publish()`

[`@cdr-kit/agent`](../agent) ships `agent.publish({ data, spgNftContract, pilTerms })` which collapses 4 normally-separate calls into one:

```ts
import { CdrAgent } from "@cdr-kit/agent";
import { PILFlavor } from "@cdr-kit/story";

const agent = new CdrAgent({ privateKey: process.env.PRIVATE_KEY!, network: "aeneid" });

const result = await agent.publish({
  data: new TextEncoder().encode("the secret data"),
  spgNftContract: "0xYourSpgCollection",
  pilTerms: PILFlavor.commercialUse({
    defaultMintingFee: 1_000_000_000_000_000_000n,
    commercialRevShare: 5,
  }),
});
// → { ipId, tokenId, licenseTermsId, vaultUuid, vaultTxHash, ipRegisterTxHash, writeTxHash }
```

Behind the scenes: `mintAndRegisterIp` → `registerPilTerms` → `attachLicenseTerms` → `createVault(LicenseReadCondition, licenseTermsId)` → `writeVaultData(encryptedSecret)`. The buyer flow is then: `wrapIp` → `approveWip` → `mintLicenseTokens` → `accessLicenseGated`.

## React hooks

[`@cdr-kit/react`](../react) exposes the corresponding hooks (`@cdr-kit/story` is an optional peer dep on the React package — pay only when you publish):

- `useStoryClient(chainId?)` — memoized StoryClient bound to the connected wallet
- `useRegisterIp(client)` — `{ registerIp, isLoading, error }`
- `useMintLicenseToken(client)` — `{ mint, isLoading, error }`
- `useAttachLicenseTerms(client)` — `{ attach, isLoading, error }`
- `usePublish()` — `{ publish, isLoading, error, result }` — render-side wrapper for `agent.publish()`

See [`/docs/hooks/use-story-client`](https://cdrkit.xyz/docs/hooks/use-story-client) etc.

## Skill

The [`design-publish-with-story`](../plugin/cdr-kit/skills/design-publish-with-story/SKILL.md) Claude Code skill walks through PIL flavor selection, the SPG NFT collection prerequisite, common failure modes (forgot to wrap IP, forgot to approve WIP, missing royalty whitelist), and when to use `publish()` vs the individual wrappers.

## Live on Aeneid

All Story IP modules are deployed at canonical addresses on Aeneid (chain 1315) — see [`@cdr-kit/contracts`](../contracts/src/addresses.ts) for the live registry. Mainnet not yet deployed.
