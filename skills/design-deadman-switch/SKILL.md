<!-- Source-of-truth lives at packages/plugin/cdr-kit/skills/design-deadman-switch/SKILL.md — keep these synchronized when editing. -->
---
name: design-deadman-switch
description: Design a Story CDR DeadManSwitchCondition vault (auto-unlock to heirs or public after creator stops poke()-ing). Use this skill when (1) the user mentions dead man switch / deadman / heartbeat / leak-on-disappearance / wallet recovery / estate planning / journalist trapdoor / posthumous unlock; (2) the user asks "what happens if I stop responding" or "auto-publish after N days of silence"; (3) the user wants to design heir lists, public-after-unlock semantics, or block-vs-timestamp countdowns; (4) the user is wiring useDeadManTimer / HeartbeatTimer in the React layer.
license: MIT
---

# Design a CDR dead-man-switch vault

`DeadManSwitchCondition` (deployed Aeneid `0x37226f97e184843aB0b8d4f08A55969801B97766`) auto-unlocks to a heir set (or public) if the creator stops `poke()`-ing within `duration`. Two phases:

- **Locked** (`now < unlockAt`): only the creator can read, and only if `creatorCanReadWhileLocked = true`.
- **Unlocked** (`now >= unlockAt`): either public (`publicAfterUnlock = true`) or restricted to `heirs`.

The trapdoor is **one-way** — once unlocked + read, plaintext is out forever.

## When to use

- "Encrypt-and-deadman a wallet's recovery phrase"
- "Auto-publish my data dump if I don't check in for 90 days"
- "Journalist source — leak if I'm arrested"
- "Estate planning — heirs get my password manager after 30 days of silence"
- "Founder runs the company, but if they're hit by a bus, the board unlocks the strategy doc"

## Creator: register the vault

```ts
const txHash = await agent.createDeadManVault({
  duration: 90n * 86400n, // 90 days in seconds
  heirs: ["0xHeir1...", "0xHeir2..."],
  blockBased: false,                  // use timestamps, not block.number
  creatorCanReadWhileLocked: true,    // creator reads their own vault pre-unlock
  publicAfterUnlock: false,           // restrict to heirs (NOT global public)
  licenseTermsId: undefined,          // not a license-gated vault
});
```

Constraints:
- `duration > 0` (rejected at config)
- If `heirs.length == 0`, the contract forces `publicAfterUnlock = true` (no heirs + private = unreadable forever, which is never intent)

Read the `uuid` from the `VaultCreated` event in the receipt.

## Creator: keep poking

```ts
await agent.pokeDeadMan(uuid);
// → resets unlockAt to now + duration
```

Constraints:
- Only the original creator can poke (`NotCreator` revert otherwise)
- Cannot poke after `unlockAt` has passed (`AlreadyUnlocked` revert — the trapdoor is one-way; reviving would let a creator block heirs forever by re-poking late)

**The biggest operational risk is forgetting to poke.** Mitigations:

1. **Manual + calendar reminder** — fine for short durations (days), risky for long (months).
2. **Self-hosted cron** — `cdr access … && cdr poke …` in a periodic job. Simple. Free. Requires uptime.
3. **Gelato Automate** — schedule on-chain poke via Gelato. Costs ~$5/mo per vault. Robust.
4. **In the React layer** — `useDeadManTimer(uuid)` returns `{ remainingMs, isCritical, poke }`; `isCritical = true` once <25% of duration remains so the UI can prompt the creator. `<HeartbeatTimer uuid />` is the headless component.

## Post-unlock semantics — the trapdoor

After `unlockAt`, the creator gets NO special treatment. If `publicAfterUnlock = false` AND the creator is not in `heirs`, **the creator loses read access permanently** at unlock. This is intentional — the entire point of a dead-man-switch is that "alive creator" and "dead creator" produce different access rules.

UX best practice: agent helper defaults `creatorCanReadWhileLocked = true`. Encourage callers to also add themselves to `heirs` if they want post-unlock access. The `createDeadManVault` JSDoc has the callout.

## Block-based vs timestamp-based

- **Timestamps (`blockBased = false`)** are the default. Wall-clock-friendly; `block.timestamp` is miner-influenced ±12s on Story but doesn't matter for durations >> 12s.
- **Block-based (`blockBased = true`)** uses `block.number`. More predictable for short horizons (<7 days) since Story's block production is rarely irregular at that scale. Less safe for long horizons because block time isn't constitutionally fixed.

Rule of thumb: use timestamps for >24h durations, blocks for <24h.

## Heir variants

- **No heir set + public unlock** — global leak. Use for "publish this data publicly if I'm gone."
- **Heir set + private unlock** — restricted leak. Use for "only my lawyer / co-founder / spouse can read post-unlock."
- **Heir set + public unlock** — `pubAfter = true` overrides — heirs are documented but everyone else also reads. Confusing combo; avoid unless you want it explicit.

## Common failure modes

- **"AlreadyUnlocked" on poke.** The window already lapsed. The vault is now in unlocked mode permanently — no revival path.
- **Creator can't read post-unlock.** Add yourself to `heirs` at config time, or accept the trapdoor.
- **Heir reads return `false`.** Check `_configured(uuid)` (vault must be factory-configured) AND `now >= unlockAt`. The view returns false on either failure rather than reverting (per D-series rule).
- **Block-based countdown looks wrong in UI.** The React hook `useDeadManTimer` doesn't tick block.number client-side — `remainingMs` returns 0 for block-based vaults. Surface "block: X" raw in the UI instead.
- **Heirs leak after unlock and the creator wants to revoke.** Impossible — once any heir reads, they hold plaintext forever. Document this loudly.

## Don't

- Don't use a dead-man switch for "subscription-style" recurring access — use `SubscriptionCondition` instead. The dead-man pattern is a one-shot trapdoor.
- Don't set `duration` so short that you can't realistically poke it (e.g. 1 day) unless you have automated heartbeats.
- Don't store the only copy of a critical secret in a dead-man vault without testing the heir read path on a separate test vault first. The "I'm dead now" UX has no rollback.
