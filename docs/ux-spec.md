# cdr-kit — UX Spec (dashboard + templates)

Stack: Next.js App Router, Tailwind, Privy or RainbowKit wallet. Built entirely on `@cdr-kit/react`. The defining UX constraint is the **~7-min read latency** — every access flow is async with visible progress; nothing blocks pretending to be instant.

## Global
- `<CdrProvider>` at root: wagmi + react-query + `initWasm()` (show a one-time "initializing secure module" state) + CDR `apiUrl`/network from env.
- Wallet connect in header; show IP balance + faucet link (Aeneid).
- Error surfaces: WASM-not-initialized, condition-not-satisfied, partial-collection-timeout, inline->file fallback — each a clear, human message (not a raw revert).

## Screens

### 1. Marketplace / Browse (home)
- Grid of vault cards: title, data type, condition badge (MVP: Subscription / TierGate / Composable), price, #subscribers, creator.
- Filters: condition type, price, data type. Click → vault detail.

### 2. Vault detail
- Metadata + the condition explained in plain language ("Subscribe 10 IP / 30 days", "Hold a Commercial-tier license", "Unlocks after <date>").
- Primary CTA depends on connection + condition state:
  - not connected → Connect.
  - connected, not satisfied → Subscribe / Mint license / (locked until date).
  - satisfied → Access data.
- **Access flow (the critical UX):** clicking Access shows a stepper — `Paying ▸ Waiting for validators (~7 min) ▸ Decrypting ▸ Done`. A live progress indicator during partial collection; the page stays usable; result either renders (text/JSON) or downloads (file). Never a spinner with no explanation.

### 3. Create vault (seller)
- Step 1 data: upload file or paste text/JSON. Show the **1KB inline vs file** decision automatically ("large file → stored on IPFS, key secured by CDR").
- Step 2 condition: pick from the MVP set; dynamic form per condition (Subscription→price+period+mode; TierGate→pick allowed PIL tiers; Composable→combine the others with AND/OR). (TimeLock/Revocable/MultiSig forms = Phase 2.)
- Step 3 IP/terms: choose/Create PIL terms (tier). Show allocate fee (msg.value).
- Submit → one `CdrKitVault.createVault` tx → success shows vault id + shareable link. Surface tx + the registered ipId.

### 4. Seller dashboard
- Vault list with status; per-vault: subscriber count, revenue, condition.
- Manage: pause new subs, view **payment/subscription event log** (from `subscribe()`/`VaultCreated` events). CDR cannot provide a "who-decrypted, when" log — reads hit the precompile and the `view` condition emits nothing (D11). Grant/revoke management = Phase 2 (depends on RevocableCondition, not in MVP).

### 5. Buyer dashboard
- Active subscriptions with expiry countdown; one-click renew; access/download; payment history.

## Templates (thin, ship with the library)
- **data-marketplace**: screens 1–2 + create, minimal.
- **secrets-vault**: provisioning UX for team/agent secret sharing (explicitly framed as provisioning + revocation, NOT runtime fetch, given latency).

## Agent demo (recorded for judging)
A terminal/log view + a minimal UI showing: agent discovers a vault → decides to subscribe → pays from its own wallet → waits for partials → receives data → completes a downstream task with it. This is the money shot for the Application track.

## Visual quality
Run a visual/anti-slop pass before demo (distinct, production-grade UI; avoid generic AI aesthetics). Reference `../context/best-practices/react-sdk-packaging.md` for component structure.
