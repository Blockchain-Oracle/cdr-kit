<!-- Source-of-truth lives at packages/plugin/cdr-kit/skills/design-escrow/SKILL.md — keep these synchronized when editing. -->
---
name: design-escrow
description: Design a Story CDR ConditionalEscrowCondition vault (buyer pays, then confirms delivery, with arbiter dispute path and seller-side timeout claim). Use this skill when (1) the user wants to build a data marketplace with pay-per-read + delivery confirmation; (2) the user asks how to add a refund / arbiter / dispute path to a CDR vault; (3) the user asks "what happens if the buyer goes silent after paying" or wants timeoutSecs guidance; (4) the user is comparing escrow vs subscription vs multi-sig for monetizing one-off datasets.
license: MIT
---

# Design a CDR conditional-escrow vault

`ConditionalEscrowCondition` (Aeneid `0x7fcDe02DB7c14fD3587aB2fED064a1D8355b7584`) gates reads behind a 2-step payment flow: buyer escrows the listing price, then either (a) confirms delivery to release funds + unlock the read, (b) goes silent and the seller `claimAfterTimeout`s after `timeoutSecs`, or (c) disputes and the arbiter refunds via `arbiterRefund`. Seller can always read their own vault. The contract is the canonical data-marketplace primitive for cdr-kit.

## When to use

- "How do I sell a one-off dataset and only release it after the buyer confirms?"
- "Build a data marketplace where the seller waits for delivery confirmation"
- "Add an arbiter / dispute path to my CDR vault"
- "Buyer paid but went silent — how does the seller still get the money?"
- "Refund a buyer who paid but never got what they expected"
- "Compare escrow vs subscription for monetizing data"

## The 4 paths through one vault

```
1. happy path:  buyer.pay()      → buyer.confirmDelivery()  → seller paid + buyer reads
2. timeout:     buyer.pay()      → (silence)                → seller.claimAfterTimeout(buyer) → seller paid + buyer reads
3. dispute:     buyer.pay()      → arbiter.arbiterRefund()  → buyer refunded + NO read
4. seller-only: (seller always reads own vault, regardless of buyer state)
```

The "paths" share state — once `delivered[uuid][buyer] == true`, the read passes and the contract has paid out. Once `paidAt[uuid][buyer] == 0` (post-refund), the buyer can pay again from scratch.

## Creator: configure the vault

```ts
const txHash = await agent.createEscrowVault({
  // seller: defaults to agent's own wallet — omit unless the agent is acting as a broker
  price: 1_000_000_000_000_000n,  // 0.001 IP
  timeoutSecs: 86_400n,            // 24h before seller can claim unilaterally
  arbiter: arbiterAddress,         // omit for no-arbiter mode (no refund path)
  licenseTermsId: undefined,       // optional PIL terms to attach
});
// uuid lives in the VaultCreated event of the receipt
```

Three knobs worth thinking through:

- **`timeoutSecs`** — too short and a buyer with a slow content-delivery pipeline gets force-closed; too long and the seller's money sits idle. Default 24h is the right starting point.
- **`arbiter`** — `address(0)` means no refund path. Skip the arbiter only when both parties are fully trusted (the seller can never be wrong, the buyer can never dispute). Most real deals want one.
- **`price`** — denominated in native IP. `pay()` refunds excess; underpayment reverts.

## Buyer side: pay, then confirm

```ts
await agent.payEscrow({ uuid, price });           // step 1 — escrow funds
// (verify the data off-chain — agent.access(uuid) is gated until step 2)
await agent.confirmEscrowDelivery(uuid);          // step 2 — release + unlock
const bytes = await agent.access(uuid);           // now succeeds
```

The buyer holds plaintext after the read. Document this intrinsic CDR limitation in the buyer UX — there's no take-backsies after a confirmed read.

## Seller side: claim if buyer silent

```ts
// After `paidAt + timeoutSecs` has lapsed:
await agent.claimEscrowAfterTimeout({ uuid, buyer });
// Buyer can now read (the contract sets `delivered[uuid][buyer] = true`).
```

Why grant the buyer read access on a timeout claim? Otherwise the "I paid, seller went radio silent, I have neither funds nor data" failure mode exists — the buyer is strictly worse off than if they'd never paid. Granting read on timeout means the buyer at least gets the data they paid for.

## Arbiter: refund disputes

```ts
await agent.refundEscrow({ uuid, buyer });
// paidAt reset to 0 — the buyer can call pay() again later if they change their mind.
// `delivered` stays false — buyer cannot read after a refund.
```

Arbiter is fire-and-forget on refund: there's no on-chain mechanism to "appeal" the refund; the seller has to seek redress off-chain. Pick arbiters carefully.

## Dashboard / UI patterns

`<EscrowDeliveryConfirm uuid={u} buyer={connectedAddress} />` is the buyer-side button — it reads `useEscrowState(u, buyer)` and switches between `pay` / `confirm delivery` / `delivered ✓` based on chain state. Pair with a seller-side `<EscrowClaimButton>` (build using `agent.claimEscrowAfterTimeout` once `useEscrowState` returns `timeoutInMs === 0`).

## Common failure modes

- **`Underpaid` revert** — `msg.value < price`. The contract refunds excess automatically; do not require an exact match in the UI.
- **`AlreadyPaid` revert** — the buyer already paid; UI should reflect chain state and disable the `pay` button when `paidAt > 0`.
- **`TooEarly` on `claimAfterTimeout`** — `block.timestamp < paidAt + timeoutSecs`. Surface a countdown to the seller via `useEscrowState.timeoutInMs`.
- **`NoArbiter` on `arbiterRefund`** — the vault was created without an arbiter. Mode flag the dispute path off in the UI when `arbiter === address(0)`.
- **Buyer holds plaintext** — read is one-way. Document this in the listing UX before the buyer pays.

## Don't

- Don't use escrow for high-frequency reads. The 2-step flow has UX cost per buyer; subscription or multi-sig vaults fit better for recurring access.
- Don't set `timeoutSecs = 0` to "force immediate seller claim" — the seller can already claim instantly via the buyer's confirmation; setting timeout to 0 just removes the buyer's safety window.
- Don't store the only copy of the secret in escrow without testing the timeout path on a separate vault first. The seller-claim flow grants the buyer plaintext access; verify the encryption surface end-to-end before going live.
