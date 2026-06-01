---
name: wire-allocate-pay-read
description: Wire the standard CDR allocate → encrypt-and-write → pay → read flow correctly. Use when implementing a CDR vault end-to-end (creator side OR consumer side).
license: MIT
---

# Wire the CDR allocate → pay → read flow

Every CDR vault follows the same 4-step lifecycle. This skill walks the canonical wiring for both the **creator** (allocate + write encrypted) and the **consumer** (pay + read decrypted) sides, with the exact gotchas the official docs and the cdr-kit decision log warn about.

## When to use

- "How do I create a vault and write an encrypted secret?"
- "How do I subscribe and read?"
- "How do I read a vault I've already subscribed to?"
- "What's the difference between `agent.access()` and `agent.subscribeAndAccess()`?"
- "Why is my read returning empty bytes / hanging / failing partial collection?"

## Two-side overview

```
CREATOR                                            CONSUMER
───────                                            ────────
1. agent.createVault({ readConditionAddr,        ┐
                       readConfig, ... })        ├─ One on-chain tx; uuid lives in the
                                                 │  VaultCreated event of the receipt
2. agent.writeVaultData({ uuid, dataKey })       ┘  (TDH2-encrypt + write inline)
   OR
   agent.uploadFile({ content, addUrl,
                     gatewayUrl, ... })             (encrypt + IPFS-pin + allocate + write)
                                                    
                                                    3. agent.subscribeAndAccess({           ← if not yet entitled
                                                          uuid, periods, maxPricePerPeriod,
                                                          value })
                                                       OR
                                                       agent.access(uuid)                   ← if already entitled
                                                       OR
                                                       agent.accessLicenseGated({           ← Story-native (license-token)
                                                          uuid, licenseTokenId })
```

**Total tx count:** creator = 1 (`createVault`) + 1 (`writeVaultData`); consumer = 1 (`subscribe`) + 1 (`read`) = 4 chain txs end-to-end. Read partial-collection happens off-chain and is bounded by `timeoutMs` (default `120_000`, server-side ceiling 200 blocks ≈ 7 min).

## Creator-side wiring (idiomatic)

```ts
import { CdrAgent } from "@cdr-kit/agent";
import { aeneid } from "@cdr-kit/contracts";
import { encodeAbiParameters, parseEther } from "viem";

const agent = new CdrAgent({ privateKey, network: "aeneid" });

// 1. allocate + configure the read condition (subscription example)
const readConfig = encodeAbiParameters(
  [{ type: "uint256" }, { type: "uint256" }, { type: "address" }, { type: "uint8" }, { type: "address" }],
  [parseEther("5"), 30n * 86400n, payee, 0, ipId],
);
const allocateTx = await agent.createVault({
  readConditionAddr: aeneid.subscriptionCondition,
  readConfig,
  licenseTermsId,
});
// Pull uuid from the VaultCreated event in the receipt — do NOT predict it.
const receipt = await agent.client.publicClient.waitForTransactionReceipt({ hash: allocateTx });
const uuid = pullUuidFromLogs(receipt.logs);

// 2. encrypt + write (small payload)
await agent.writeVaultData({ uuid, dataKey: new TextEncoder().encode("BUY ETH @ 4200") });
```

## Consumer-side wiring

```ts
// If unsure whether you're already entitled, check first (no gas):
const ent = await agent.getEntitlement(uuid);
if (ent.isEntitled) {
  const data = await agent.access(uuid);
  console.log(new TextDecoder().decode(data));
} else {
  const plan = await agent.getSubscriptionPlan(uuid);
  // budget check
  if (plan.pricePerPeriodWei > MY_BUDGET_WEI) throw new Error("too expensive");
  const data = await agent.subscribeAndAccess({
    uuid,
    periods: 1n,
    maxPricePerPeriod: plan.pricePerPeriodWei,
    value: plan.pricePerPeriodWei,
  });
}
```

## CLI alternative

The same flow as one-shot commands:
- `cdr vault create --read <addr> --read-config <hex>` (creator: allocate + configure)
- `cdr vault upload <file> --pin-url <url> --gateway <url>` (creator: encrypt + IPFS + allocate + write a file)
- `cdr vault info <uuid>` (consumer: pre-flight — info + plan + entitlement in one call)
- `cdr subscribe <uuid> --periods 1 --max-price <wei>` (consumer: pay + read)
- `cdr access <uuid>` (consumer: already-entitled read)
- `cdr access-license <uuid> --license-token-id <id>` (consumer: Story-native license-gated)

## Pitfalls (from `context/research/cdr-protocol-truth.md`)

1. **CDR precompile calls OOG under `eth_estimateGas`** — `@cdr-kit/core`'s `createVault` sets `gas: 3M` for you. If you call the raw CdrKitVault contract from forge/cast, set a 2M+ explicit gas limit yourself (see `CDR_GAS_LIMIT` exported from `@cdr-kit/contracts`).
2. **`initWasm()` is required before any encrypt/decrypt.** `@cdr-kit/core`'s flows call `ensureWasm()` for you. If you reach into `@piplabs/cdr-sdk` directly, call `initWasm()` once at startup.
3. **`uuid` is a global counter — read it from the receipt.** Do not predict the next uuid (the SDK's `allocate()` simulates with one value but the live tx may settle on another).
4. **Read latency is variable.** Default `timeoutMs: 120_000` (was `600_000` pre-0.4 — corrected to match docs). Server cap is 200 blocks ≈ 7 min. Plan UIs for "tens of seconds typical, up to 7 min worst case".
5. **`access()` is for "already entitled".** It will revert on-chain if the read condition isn't satisfied. Check `agent.getEntitlement(uuid)` first if you don't know.
6. **`subscribeAndAccess()`'s `value` must equal `maxPricePerPeriod * periods` exactly.** Underpaying reverts; overpaying does not refund.

## See also

- `design-condition` — picking the right condition before you create the vault
- `debug-cdr-precompile` — what to do when `allocate` / `read` reverts or hangs
- `references/timeoutMs-tuning.md` — when to override the default
- `https://docs.story.foundation/developers/cdr-sdk/encrypt-and-decrypt` — official walkthrough
