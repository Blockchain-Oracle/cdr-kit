<!-- Source-of-truth lives at packages/plugin/cdr-kit/skills/design-condition/SKILL.md — keep these synchronized when editing. -->
---
name: design-condition
description: Pick the right CDR access-control condition for a vault use case. Use this skill when (1) the user is designing a new CDR vault and asks "which condition should I use"; (2) the user wants to gate reads behind a paywall, license, NFT/token tier, or composite AND/OR rule; (3) the user asks how to encode readConditionData for a specific condition; (4) the user is choosing between subscription / tier-gate / composable / open / license-gated.
license: MIT
---

# Design a CDR access condition

CDR vaults gate decryption with two condition contracts: a **read condition** and a **write condition**. Picking the right one up-front beats refactoring once data is encrypted. This skill walks the decision tree.

## When to use

- "Which CDR condition should I use for X?"
- "I want to gate reads behind a paywall / a license / a tier / an EOA / a custom check."
- "What does composable condition give me?"
- "How do I encode `conditionData` for the X condition?"

## The 5 deployed conditions on Aeneid

| Condition | What it gates | Typical use |
|---|---|---|
| `openCondition` | Anyone can read (write is always condition-controlled) | Public hints; teasers; gated reveal where the gate is a different vault |
| `subscriptionCondition` | Caller must have an active `paidUntil[uuid][addr] > now` | Substack/Patreon paywall, periodic data feeds, intel reports |
| `tierGateCondition` | Caller must hold an NFT/ERC20 token at min balance | "Subscribers", "VIP" tiers, allowlist-by-NFT |
| `composableCondition` | Boolean OR/AND of N child conditions | "Hold token X **AND** subscribed to vault Y", "Subscribed **OR** holds license" |
| `licenseReadCondition` | Caller must own a Story PIL license token for the vault's IP | The Story-native pattern — license-as-payment, royalties via PIL terms |
| `creatorWriteCondition` | Only the creator (vault NFT owner) can write | Default write condition for almost every flow |
| `ownerWriteCondition` | Only a hardcoded EOA can write | Demo / one-shot vaults |

Address per condition: see `@cdr-kit/contracts`'s `aeneid` constant + `references/conditions-cheatsheet.md`.

## Decision tree

```
What gates the READ?
├─ Everyone   → openCondition (with readConditionData = "0x")
├─ Pay per period (recurring)  → subscriptionCondition (price + period encoded in setConfigFromFactory)
├─ Pay once for a Story license → licenseReadCondition (mint license token → use tokenId as accessAuxData)
├─ Hold a token (NFT/ERC20)    → tierGateCondition (token addr + min balance)
└─ Composite (AND/OR multiple) → composableCondition (children + AND/OR mask)

What gates the WRITE?
├─ Only the creator (default) → creatorWriteCondition
├─ Only one EOA              → ownerWriteCondition
└─ Custom                     → deploy your own condition impl
```

## Encoding `readConditionData` per condition

Done in code via `encodeAbiParameters`:

- **openCondition** → `"0x"` (no data)
- **subscriptionCondition** → factory's `setConfigFromFactory` writes `(pricePerPeriod, period, payee, mode, licensorIpId)` — handled inside `CdrKitVault.createVault`; you pass `readConditionData: encodeAbiParameters([...], [...])`. See `references/condition-encoding.md` for the field layout per condition.
- **tierGateCondition** → `encodeAbiParameters([{type:"address"}, {type:"uint256"}], [tokenAddr, minBalance])`
- **composableCondition** → encoded child conditions list + AND/OR mask
- **licenseReadCondition** → `encodeAbiParameters([{type:"address"},{type:"address"}], [licenseTokenAddr, ipId])`. Reader passes their license tokenId(s) at read-time via `accessAuxData: abi.encode(uint256[] licenseTokenIds)`.

`@cdr-kit/contracts` exports the deployed addresses; never hardcode.

## CLI alternative

- `cdr vault info <uuid>` — inspect the live condition + plan + your entitlement on an existing vault
- `cdr vault create --read <addr> --read-config <hex>` — create with the picked condition
- `cdr fees` — fetch allocate/write/read fees before you commit (useful for cost-modeling subscription pricing)

## Pitfalls (the load-bearing ones)

1. **EOA conditions need `skipConditionValidation: true`.** The CDR contract bypasses the check when `msg.sender === conditionAddr`, so setting your EOA as `readConditionAddr` makes a vault owner-only — but the SDK's high-level `uploadCDR()` rejects this. Use the low-level `allocate()` path or our `agent.access()` path.
2. **`writeConditionAddr` defaults to `creatorWriteCondition` if you don't pass one** in `agent.createVault()`. Don't override unless you know why.
3. **`composableCondition` configs are not symmetric.** The order of children matters for some AND/OR encodings; see `references/composable-encoding.md`.

## Examples

A subscription-gated trading signal vault (paid weekly):
```ts
import { aeneid } from "@cdr-kit/contracts";
import { encodeAbiParameters, parseEther } from "viem";

const readConfig = encodeAbiParameters(
  [{ type: "uint256" }, { type: "uint256" }, { type: "address" }, { type: "uint8" }, { type: "address" }],
  [parseEther("5"), 7n * 24n * 60n * 60n /* 7 days */, payee, 0 /* native IP */, ipId],
);
await agent.createVault({
  readConditionAddr: aeneid.subscriptionCondition,
  readConfig,
  licenseTermsId: ipLicenseTermsId,
});
```

A license-gated PDF (Story-native pattern):
```ts
const readConfig = encodeAbiParameters(
  [{ type: "address" }, { type: "address" }],
  [aeneid.licenseToken, ipId],
);
await agent.createVault({ readConditionAddr: aeneid.licenseReadCondition, readConfig });
// Then: agent.uploadFile({ content: pdfBytes, addUrl, gatewayUrl }) writes the file off-chain
// Reader: mintLicenseTokens (in 0.5) → agent.accessLicenseGated({ uuid, licenseTokenId })
```

## See also

- `wire-allocate-pay-read` — the 2-step pay→read pattern across all conditions
- `audit-vault-config` — verify an existing vault's condition + data on-chain
- `references/conditions-cheatsheet.md` — full ABI + encoding per condition
- `https://docs.story.foundation/developers/cdr-sdk/overview` — official CDR overview
