---
name: design-multisig-condition
description: Design a Story CDR MultiSigCondition vault — N-of-M EIP-712 threshold reads, signer rotation, off-chain signature collection UX. Use this skill whenever the user mentions multi-sig, multisig, N-of-M, threshold signatures, board approval, Safe-as-CDR-gate, off-chain signing, EIP-712 for CDR access, or asks "how do I gate a CDR vault behind multiple signers" / "can we require 3 board members to unlock this" / "how does the approval flow work without on-chain approve()".
license: MIT
---

# Design a CDR multi-sig vault

`MultiSigCondition` (deployed Aeneid `0xb22EBF0481950A3c0e528A5902C4c5C69184fB78` as of 2026-06-01) gates reads behind N-of-M EIP-712 signatures collected off-chain. **First-of-kind in the CDR ecosystem** — no on-chain `approve()` tx per signer. Buyer collects threshold-many sigs, submits them as `accessAuxData = abi.encode(deadline, sigs[])`, the contract recovers + dedupes + counts.

## When to use

- "Board / DAO / 3 of 5 founders need to approve each read"
- "We don't want signers to pay gas for approvals"
- "Sigs should be revocable if a signer leaves"
- "How do I integrate Safe / Gnosis as a signer?"
- "Why is my multi-sig read returning false?"
- "How does epoch invalidation work?"

## The 2-step flow

1. **Creator** registers signers + threshold once (`createMultiSigVault`). Vault is gated; reads return false until threshold met.
2. **Buyer** collects threshold-many EIP-712 sigs from configured signers via off-chain UI / RPC / messaging. Each sig binds `(uuid, callerAddress, epoch, deadline)`.
3. **Buyer** submits all sigs as `accessAuxData` to `agent.access(uuid, aux)` or `agent.accessMultiSig({ uuid, deadline, sigs })`.

No `approve()` on-chain. No per-signer tx fee. Buyer pays one read fee, period.

## Creator: register the vault

```ts
const txHash = await agent.createMultiSigVault({
  signers: ["0xAlice...", "0xBob...", "0xCarol..."], // auto-sorted ascending
  threshold: 2,
  licenseTermsId: 1n, // optional PIL terms to attach
});
// uuid lives in the VaultCreated event of the receipt
```

Constraints:
- `signers.length >= 1`
- `1 <= threshold <= signers.length`
- Signers must be sorted strictly ascending in `_store` (helper sorts automatically).
- 0 ≤ threshold ≤ ~10 in practice — each sig recovery is ~6k gas, so `threshold = 10` adds ~60k to the read.

## Signer: produce a signed approval

```ts
import { signTypedData } from "viem/accounts";
const signature = await signTypedData(account, {
  domain: {
    name: "cdr-kit:MultiSigCondition",
    version: "1",
    chainId: 1315,
    verifyingContract: "0xb22EBF...",
  },
  types: {
    Approval: [
      { name: "uuid", type: "uint32" },
      { name: "caller", type: "address" },
      { name: "epoch", type: "uint64" },
      { name: "deadline", type: "uint64" },
    ],
  },
  primaryType: "Approval",
  message: { uuid, caller, epoch, deadline },
});
```

Or use the agent helper: `agent.signMultiSigApproval({ uuid, caller, deadline })` — pulls the current `epoch` from chain and signs against the right domain.

## Buyer: read the vault

```ts
const data = await agent.accessMultiSig({
  uuid,
  deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
  sigs: [aliceSig, bobSig], // any threshold-many; the contract dedupes
});
```

Sig submission order doesn't strictly matter — the contract sorts on the recovered address and rejects duplicates / out-of-order. But sending sigs already sorted ascending by recovered address is fastest (no out-of-order rejection on first scan).

## Epoch invalidation

Each rotation bumps `epoch`. Old sigs (signed against the previous epoch) are rejected. Use this to:
- Remove a compromised signer immediately
- Add a new signer to the set
- Increase or decrease threshold

```ts
await agent.client.walletClient!.writeContract({
  address: multiSigAddr,
  abi: multiSigConditionAbi,
  functionName: "rotateSigners",
  args: [uuid, [...newSignersSorted], newThreshold],
});
// All in-flight sigs against old epoch are now invalid; buyers must re-collect
```

The React hook `useMultiSigStatus(uuid)` exposes `{ signers, threshold, epoch }` so dashboards can show "X of Y · epoch N".

## Caller binding (replay protection)

Sigs bind to `caller` (the address that will submit the read tx). A sig signed for `0xBuyer1` cannot be replayed by `0xBuyer2`. The buyer MUST tell each signer their own address when requesting a sig. UIs should default to "sign for the connected wallet" to make this idiomatic.

## Deadline (sig expiry)

`deadline` is a unix timestamp. The contract rejects sigs where `block.timestamp > deadline`. Pick deadlines that comfortably outlast your collection flow (e.g. 1 hour for in-meeting board approvals; 24 hours for async multi-day signing).

## EIP-1271 (Safe-as-signer) — not in 0.5

The contract uses `ecrecover` only — EOA signatures. Safe / contract wallets cannot directly act as signers in 0.5.0. Workaround: have a Safe-owned EOA sign on behalf, treat that EOA as the registered signer.

## ECDSA malleability

Both `(r, s, v)` and `(r, n-s, v^1)` recover the SAME address. The contract dedupes by recovered address with strict-ascending order, so a malicious double-sig from the same signer is automatically rejected. No `s ≤ n/2` check needed.

## Defensive eval

Malformed `accessAuxData` returns `false` (not revert) — the contract wraps decode + recover in a try/catch via `this.evaluate(...)`. This means a malformed sig blob fails closed (no read), it doesn't bubble a revert into the CDR precompile.

## Common failure modes

- **Read returns false with valid sigs.** Check `epoch` — was the vault rotated after sigs were produced? Re-collect against the new epoch.
- **Read returns false, sigs look right.** Check `caller` binding — did each signer sign for the actual reader's address?
- **"NoSigners" / "BadThreshold" on register.** Threshold must be ≥1 and ≤ `signers.length`. Empty signer arrays are rejected.
- **"SignersNotSorted" on register.** Pass signers in strictly-ascending order — the agent helper does this automatically; raw `createVault` callers must sort themselves.

## Don't

- Don't store sigs on-chain — the contract is stateless on approvals. Storing them defeats the gas-savings premise.
- Don't reuse sigs across uuids — they bind to `(uuid, caller, epoch, deadline)` and the contract rejects mismatch.
- Don't use multi-sig for high-frequency reads — collecting threshold-many sigs per read has UX cost. For frequent access, use a subscription or license-gated vault instead.
