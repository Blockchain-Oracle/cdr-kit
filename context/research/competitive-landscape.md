# Competitive Landscape & Positioning

## Direct (same protocol)
- **`piplabs/cdr-demo`** — Story's own reference app (Next.js, Privy). Routes `/secret /marketplace /agents /ai /bounties`. ~9 condition contracts + `CDRVaultNFT`. This is the incumbent to differentiate from — see `existing-vs-missing.md`. cdr-kit is NOT another app; it's the library the demo *should have been built on*.
- **`jacob-tucker/cdr-ai-negotiate`** — A2A + Story license + CDR demo. Its "negotiation" is just random-number gen (no real logic). Good source for the agent + license + vault wiring (`packages/cdr/src/vault.ts` vendored).
- **`jacob-tucker/cdr-skill`** — canonical CDR code examples + the EOA-as-condition + `skipConditionValidation` trick. (Note: its interface docs are the stale 3-param version.)
- Third-party: `Surojit012/nythera` (Walrus+Supabase+CDR vault w/ Shamir guardian recovery, custom `AccessConditionV2`/`WhitelistCondition`), `arunnadarasa/storycdr` (fork-ish). No one has shipped a productized toolkit.

## Encryption competitors (NOT Story, but judges may ask "why not these?")
- **Lit Protocol** / **Threshold (TACo)** — programmable threshold decryption since ~2023. Comparable encryption + condition gating. **cdr-kit's answer:** CDR's differentiator is **native Story IP coupling** — decryption gated on license tiers, payment routed through Story's RoyaltyModule, derivatives + attribution tracked on-chain. Lit/TACo gate access but have no IP/royalty/licensing primitive. Our advanced conditions (TierGate, royalty-aware Subscription) exploit exactly this gap. Without the Story-IP angle, cdr-kit would just be "Lit with extra steps."

## Payment-rail adjacents (different layer; not competitors, learn from DX)
- **x402** (Coinbase/Cloudflare HTTP-402) — the agent-payment rail. Plaintext resources, per-call. Clean pay→retry flow worth mirroring in the agent SDK.
- **MCPay** (`microchipgnu/MCPay`) — open MCP monetization via x402; plaintext API keys; stale since Jan 2026. Good registry/marketplace UI patterns.
- **FluxA** — live agent wallet + virtual cards + AEP2; 23k+ agent wallets. No encryption, no CDR. Borrow agent-wallet framing for marketing.
- **Nevermined** — MCP monetization (per-call/outcome/value), credit micropayments, centralized billing. No CDR.

## One-line positioning
> "Lit Protocol gives you programmable decryption. x402 gives agents a way to pay. Neither gives you **licensed, royalty-bearing, revocable private data with on-chain IP provenance** — and neither is packaged as a toolkit. cdr-kit is the CDR developer layer that does both."

## Hackathon judging map (build.usecdr.dev)
- **Technical track ($1k):** "advanced read/write conditions (multi-sig, time-based, multi-step)", "composable vault systems interacting with other contracts", "new patterns for programmable permissions" → our condition standard library + ComposableCondition hit these verbatim.
- **Application track ($1k + $1k runner-up):** "quality/polish", "real traction (Twitter/app/LinkedIn)", "users actually want it", "UX someone would use twice" → dashboard + npm installs + agent demo. Distribution plan must be real (DevRel amplification + cold outreach to CDR/Story builders), not "one tweet".
