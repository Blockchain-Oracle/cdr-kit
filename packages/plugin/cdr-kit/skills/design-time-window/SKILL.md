---
name: design-time-window
description: Design a Story CDR TimeWindowCondition vault — read access gated by an absolute time (or block) window. Use this skill whenever the user mentions release-on-date, scheduled publication, embargoed data, time-locked content, NDA expiry, conference-talk slides released after the keynote, election results sealed until the polls close, earnings reports gated until market open, or asks how to make a CDR vault that auto-opens at timestamp X, how to schedule data drops, how to bound a read window to event hours, or how to encode a release-after-block-number deadline.
license: MIT
---

# Design a CDR time-window vault

`TimeWindowCondition` (Aeneid `0x67911435F262e7e4EC4F7FEB4e868a67b9dd90b1`) gates reads to a `[startTs, endTs]` window. Use it for release-on-date drops, embargoed data, NDA expiry, time-bound previews, and any "auto-unlock at T" pattern. The contract is stateless on participants — no per-buyer config, no payments. Time is the only key.

## When to use

- "Auto-publish this data after April 1"
- "Sealed bid that opens at the auction close"
- "Time-bound preview window for a paid product"
- "Embargoed press release lifted at 9am EST"
- "Token-gated content that becomes public after 30 days"
- "Conference talk slides released after the keynote"

## Three preset shapes

The agent helper accepts three intuitive configurations:

| Pattern | `startTs` | `endTs` | `blockBased` |
|---|---|---|---|
| **Release on date** (open-ended after T) | T | `0` | `false` |
| **Limited window** (T1 → T2) | T1 | T2 | `false` |
| **Release after block N** | `0` | N | `true` |

Set `endTs = 0` to mean "no upper bound" — the contract treats it as open-ended. Setting `startTs = 0` means "always-open from genesis" — almost certainly a bug; use `OpenCondition` instead if you want public-anytime reads.

## Creator: configure the vault

```ts
// Release-on-date: open after April 1 2026
const txHash = await agent.createTimeWindowVault({
  startTs: 1_743_465_600n,   // unix timestamp
  endTs: 0n,                  // open-ended
  blockBased: false,
});

// Limited window: 1-hour preview
await agent.createTimeWindowVault({
  startTs: BigInt(Math.floor(Date.now() / 1000)),
  endTs:   BigInt(Math.floor(Date.now() / 1000) + 3600),
  blockBased: false,
});

// Block-based: release at block 19_500_000
await agent.createTimeWindowVault({
  startTs: 0n,
  endTs: 19_500_000n,
  blockBased: true,
});
```

## Block-based vs timestamp-based

- **Timestamps** are wall-clock-friendly and survive block-time drift. Use for windows > 24h.
- **Block numbers** are predictable for short horizons (< 7d on Story's ~12s block time) and immune to validator timestamp manipulation. Use for trustless precise releases (auctions, bonding curves).
- `block.timestamp` is miner-influenced ±12s on Story Aeneid. Document.

## Reader side

There's no setup — anyone can `access(uuid)` and the contract returns true if the current time is within the window:

```ts
const bytes = await agent.access(uuid);  // reverts cleanly before startTs or after endTs
```

The dashboard reads `useTimeWindowState(uuid)` which returns `{ startTs, endTs, blockBased, isOpen, opensInMs, closesInMs }` and ticks every second locally. Wrap with `<TimeWindowBadge uuid={u} />` for "opens in 3d 4h" / "closes in 59m" / "closed" rendering.

## Common failure modes

- **`BadWindow` on configure** — `endTs != 0 && endTs <= startTs`. The contract rejects empty / inverted windows.
- **Reader sees "closed" before the window opens** — that's correct; the badge falls through to "opens in …" if `opensInMs > 0`, otherwise "closed".
- **Block-based mode countdown shows 0** — the React hook intentionally doesn't poll `block.number` every second. Render the raw block bound from the state object instead.
- **Read seems to lapse instantly** — `block.timestamp > endTs` by even one second closes the window. Set a generous buffer if downstream consumers might be slow.

## Composition with other conditions

Pair with `ComposableCondition` to get "license-gated PLUS time-windowed" or "subscription PLUS embargo": the parent composable evaluates `licenseRead AND timeWindow`, so a buyer needs both the license AND the window to be open. See `design-condition` for the composable pattern.

## Don't

- Don't use `block.timestamp` precision for high-value cryptoeconomic windows (< 1 minute). Validators can nudge it ±12s; use block numbers if accuracy matters.
- Don't set `startTs = 0` — that's "always open" which is what `OpenCondition` exists for; using `TimeWindow` for it just burns extra SLOAD per read.
- Don't expect to "extend the window" after configuration. The contract is immutable per uuid; create a new vault if the schedule changes.
