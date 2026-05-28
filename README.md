# cdr-kit

**The developer toolkit for Story Protocol's Confidential Data Rails (CDR)** — the wagmi/Clerk/Stripe layer for CDR.

An audited, typed, tested standard library of CDR condition contracts (Subscription, TimeLock, Revocable, TierGate, MultiSig, Composable) + a React layer (`<VaultGate>`, `useVault`) + an agent SDK + a vault-management dashboard. Built for the Story CDR Hackathon (build.usecdr.dev), but the goal is a real product.

## Repo layout

```
story-cdr/
├── context/     # KNOWLEDGE BASE (read first) — research, decisions, best practices, vendored source
│   └── 00-START-HERE.md   ← entrypoint
├── docs/        # SPECS — PRD, architecture, ux-spec, epics, stories  (written after context)
└── (code: contracts/, packages/, apps/ — added after specs are reviewed)
```

`context/` = *why & how the ecosystem works* (so building is grounded in truth, not guesses).
`docs/` = *what we're building*. They are intentionally separate.

## Status
1. ✅ Deep research (CDR protocol, Story IP/royalty, 2026 build stack) — captured in `context/`.
2. ⏳ Specs (`docs/`).
3. ⏳ Sub-agent review of specs vs best standards — BEFORE writing contracts.
4. ⏳ Implementation.

## The 7 hard truths (full detail in `context/00-START-HERE.md`)
No confidential compute (buyer gets plaintext) · condition interface is 4-param uuid-first (docs are stale) · ~7-min read latency · ~1KB inline cap · `view` conditions can't take payment (2-step) · some addresses in flux · Aeneid testnet only.
