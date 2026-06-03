<!-- Source-of-truth lives at packages/plugin/cdr-kit/skills/audit-vault-config/SKILL.md — keep these synchronized when editing. -->
---
name: audit-vault-config
description: Audit an existing CDR vault's on-chain config — verify read/write conditions, condition data, owner, license terms, and subscription plan match the intended design. Use this skill when (1) the user wants to vet someone else's vault before subscribing to it; (2) the user wants to verify their own deployment matches their intent; (3) the user asks "is vault X subscription-gated / what's the price / who owns it / what IP does it gate"; (4) the user pastes a uuid and asks "should I trust this".
license: MIT
---

# Audit a CDR vault's on-chain config

You can't decrypt a vault's content without paying / qualifying, but you can verify every aspect of its access control + economics for free. This skill is for "should I subscribe to this?" or "did my deployment configure correctly?" questions.

## When to use

- "Is vault X subscription-gated? What's the price?"
- "Who owns vault X? What IP asset is it tied to?"
- "Does vault X's read condition do what its README claims?"
- "I deployed a vault — verify the on-chain state matches my intent."
- "What's the difference between this vault's licenseTermsId and another?"

## The 4-call audit (all view-only)

```ts
import { CdrAgent } from "@cdr-kit/agent";
const agent = new CdrAgent({ privateKey: anyTestnetKey, network: "aeneid" });
// (privateKey unused for view-only reads, but agent requires one for typing — use a throwaway)

// 1. Factory metadata: tokenId, ipId, creator, licenseTermsId
const info = await agent.getVaultInfo(uuid);
// → { uuid, tokenId, ipId, creator, licenseTermsId }

// 2. Subscription plan (if subscription-gated)
const plan = await agent.getSubscriptionPlan(uuid).catch(() => null);
// → { pricePerPeriodWei, periodSeconds, payee, mode (0=IP, 1=WIP), licensorIpId }

// 3. Your own entitlement against this vault
const ent = await agent.getEntitlement(uuid);
// → { paidUntilUnix, isEntitled }

// 4. Raw vault record (encryptedData hex, write tx, etc.)
const raw = await agent.getVaultRecord(uuid);
```

**One-shot:** `cdr vault info <uuid>` runs calls 1+2+3 and prints them as one JSON object.

## What each field tells you

| Field | Audit signal |
|---|---|
| `info.creator` | The original minter — must match what the listing claims. Cross-check against a known-good profile. |
| `info.ipId` | The Story IP asset — verify it's registered on `IPAssetRegistry` (call `IPAssetRegistry.isRegistered(ipId)`) and look up its license terms. |
| `info.licenseTermsId` | The PIL terms attached — pull from `LicenseRegistry` to inspect commercial use, revenue share, royalty policy. |
| `plan.payee` | Where subscription fees flow — should be the vault creator OR a known royalty-vault address. Anything else is a red flag. |
| `plan.pricePerPeriodWei` | Convert to IP (`formatEther`) — does the headline price match? |
| `plan.periodSeconds` | 86400=daily, 604800=weekly, 2592000≈monthly. Unusual values are suspicious. |
| `plan.mode` | `0` = native IP, `1` = WIP (wrapped IP ERC20). WIP means the reader needs `wipClient.deposit + approve` first. |
| `ent.paidUntilUnix` | If `> now`, you're already entitled — call `access` not `subscribeAndAccess`. |

## Audit checks (red flags)

1. **`plan.payee` is NOT `info.creator` or a known royalty contract** — payments leak to a third party.
2. **`plan.pricePerPeriodWei` ≪ headline price** — pricing was misconfigured during deployment; reader pays less than advertised. (Not a security issue, but the seller will be surprised.)
3. **`info.licenseTermsId === 0`** — no PIL terms attached. The vault is decoupled from Story IP licensing; reader gets data but not licensed rights.
4. **`plan.periodSeconds === 0`** — subscription never expires. Almost certainly a misconfig.
5. **`info.ipId` registered to a different creator than `info.creator`** — possible front-run / squatter. Verify ipId ownership in `IPAssetRegistry`.

## CLI alternative

```bash
cdr vault info <uuid> --json | jq '{creator: .info.creator, price_ip: (.plan.pricePerPeriodWei | tonumber / 1e18), period_days: (.plan.periodSeconds | tonumber / 86400), payee: .plan.payee}'
```

## What this skill does NOT do

- It doesn't decrypt content. Decryption requires the read condition to pass (subscription, license, etc.).
- It doesn't audit the condition contract's source code. The deployed addresses in `@cdr-kit/contracts.aeneid` are the canonical ones; if a vault uses a different `readConditionAddr`, that's a flag — but you'd need to verify the source out-of-band.
- It doesn't simulate "will my access call succeed?" — the read condition's `checkReadCondition` view is the closest, but it's read-only and free; the protocol calls it at read time.

## See also

- `design-condition` — what conditions the audit can encounter
- `wire-allocate-pay-read` — how to actually consume after the audit passes
- `references/conditions-cheatsheet.md` — interpret `readConditionData` for each condition
