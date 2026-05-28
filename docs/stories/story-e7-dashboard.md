# Story E7 — Dashboard + marketplace template (flagship app)

**As** a data/IP owner and as a buyer, **I want** a polished web app to create, manage, browse, and access CDR vaults **so that** the toolkit is usable by non-CLI users — and it doubles as the Application-track demo. Built entirely on `@cdr-kit/react` (dogfooding). Screen-by-screen detail: `../ux-spec.md`.

## Scope (MVP)
Next.js App Router + Tailwind + Privy/RainbowKit. Screens: Browse, Vault detail (with the access stepper), Create vault, Seller dashboard, Buyer dashboard. The **data-marketplace template** is the browse+detail+create flow (the one MVP template; secrets-vault is Phase 2).

## Acceptance criteria (BDD)

**Scenario: end-to-end on Aeneid (the demo)**
- **Given** a connected wallet with testnet IP
- **When** a seller creates a vault (pick condition + PIL tier + upload), then a SECOND wallet subscribes and accesses
- **Then** the data round-trips on Aeneid: create tx (with `VaultCreated`), subscribe tx, then a visible `paying → collecting-partials → ready` access that renders/downloads the decrypted data.

**Scenario: create-vault surfaces the real constraints**
- **Given** the create flow
- **When** a user uploads data
- **Then** the UI auto-routes >1KB to file/IPFS (and says so), shows the `allocateFee` it will send as `msg.value`, and lets them pick a condition with a dynamic form (Subscription→price+period+mode; TierGate→allowed tiers; Composable→combine).

**Scenario: seller management**
- **Given** a seller with vaults
- **When** they open the dashboard
- **Then** they see per-vault subscriber count, revenue, condition, and a **payment/subscription event log** (D11 — not a who-decrypted log), and can grant/revoke where the condition supports it.

**Scenario: buyer management**
- **Given** an active subscription
- **When** the buyer opens their dashboard
- **Then** they see an expiry countdown, one-click renew, and re-access.

**Scenario: visual quality gate**
- **Given** the UI before demo
- **When** a visual/anti-slop pass runs
- **Then** the UI is distinct + production-grade (no generic AI aesthetic); screenshots captured for the submission.

**Scenario: agent demo surface**
- **Given** the `@cdr-kit/agent` example
- **When** recorded for judging
- **Then** a terminal/log view shows discover→pay→access→use-downstream with the on-chain txs visible (keep a pre-recorded fallback given 7-min latency).

## Constraints
Server-safe primitives from `@cdr-kit/core`; client from `@cdr-kit/react`. Deployable to Vercel (no edge runtime for CDR paths). ≤400 lines/file (split screens/components). Handles WASM init + latency + 1KB/file + 2-step everywhere.
