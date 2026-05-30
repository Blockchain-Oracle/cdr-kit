# Developer artifacts for a TS/web3 library — survey

**Date:** 2026-05-30 · **Purpose:** input for the "what's the right showcase for cdr-kit (vs the marketplace dashboard we built)?" conversation. Pure facts, no recommendation.

## What cdr-kit ships today (repo inventory)

- 12 packages on npm.
- Docs: Fumadocs at `apps/docs/` — 7 static MDX pages (index, quickstart, core, react, agent, contracts, templates) + standard Fumadocs routes (home, docs, llms.txt, og images, search).
- Examples: 2 entries in `examples/` — `claude-mcp/README.md` (README-only shell), `vercel-ai-chatbot/` (runnable LLM loop).
- Demo app: `apps/web/` — full marketplace dashboard (marketplace + vault detail + create wizard + seller + buyer).
- Scaffolder: `create-cdr-kit-app` — **no `templates/` dir**; scaffolds a single minimal app inline from `src/index.ts`.
- Zero live component previews; no playground; no per-framework example variants.
- PRD #4 verbatim: "an audited, typed, tested standard library of condition contracts + React layer + agent SDK + **a vault-management dashboard**, with marketplace and secrets-vault **templates**." (i.e. PRD originally scoped dashboard + plural templates; templates plural was never built.)

## What 6 comparable libs ship (fresh fetch 2026-05-30, URLs verified)

| Library | Docs | Live gallery | Playground | In-repo examples | Separate templates | Demo app | Scaffolder |
|---|---|---|---|---|---|---|---|
| **shadcn/ui** | ✓ ui.shadcn.com/docs | **✓ canonical** — per-component live previews, blocks, charts | ✓ `/create` theme builder | — | — | — | `shadcn init/add` |
| **RainbowKit** | ✓ rainbowkit.com/docs | ✗ (static code + props) | — | ✓ **13 framework variants** | — | demo.rainbowkit.com [unverified] | `init @rainbow-me/rainbowkit` |
| **wagmi** | ✓ wagmi.sh | n/a (hooks lib) | StackBlitz embeds in guides | [unverified — none top-level] | — | — | `create-wagmi` + `@wagmi/cli` |
| **Vercel AI SDK** | ✓ ai-sdk.dev/docs | n/a (AI Elements separate) | ✓ `/playground` (compare models) | [unverified] | ✓ vercel.com/templates?type=ai (~10+ starters) | Chatbot, Morphic | — (template-deploy) |
| **Privy** | ✓ docs.privy.io | ✗ | — | — | ✓ **~25 starter repos** under privy-io org | demo.privy.io | partial (`create-privy-pwa`) |
| **piplabs/cdr-sdk** (Story's own) | in-repo MD only | ✗ | — | ✓ `apps/examples/*.ts` scripts | ✓ `piplabs/cdr-demo` Next.js app | cdr-demo-basic.vercel.app | — |

## Two distinct patterns

- **Gallery-led** (shadcn-style): the docs site IS the gallery — every primitive has a live preview + copy code + props table; "blocks" for full-page patterns; theme playground. DX leans on *seeing* and copying.
- **Examples-led** (RainbowKit, wagmi, Privy, piplabs/cdr-sdk): static prose docs + a `/examples` directory of runnable framework variants (or a separate starters org), + usually a `create-*` CLI that scaffolds from those. DX leans on *cloning and running*.
- **Hybrid** (Vercel AI SDK): docs + cookbook recipes + playground + templates portal.

## Notable patterns

- **Only shadcn/ui ships a live component gallery on this list.** All three web3 libs (RainbowKit, wagmi, Privy) use the examples-led pattern. RainbowKit's component pages are explicitly static code + props, not live previews.
- **`piplabs/cdr-sdk` — Story's own CDR SDK — ships structurally the same shape we have**: in-repo runnable TS scripts (`apps/examples/`) + a separate full Next.js demo app (`piplabs/cdr-demo`). We're aligned with Story's own choice, just at larger scale.
- The scaffolder pattern is universal among the web3 libs (create-wagmi, init-rainbowkit, create-privy-pwa). We have the *binary* but not the *templates*.

## Where we sit relative to each pattern

- **Gallery:** 0 live previews.
- **Examples-led:** 2 examples (1 README-only + 1 runnable). RainbowKit ships 13 framework variants in-repo; Privy has ~25 starter repos.
- **Scaffolder:** 1 inline minimal template; no `templates/` dir; no interactive prompts beyond name.
- **Demo app:** 1 marketplace dashboard — same pattern as Story's `cdr-demo`, larger surface area.

## Staleness flags

- `demo.rainbowkit.com` — couldn't fetch (connection refused at research time).
- wagmi top-level `/examples` absence — [unverified].
- Vercel AI SDK in-repo `/examples` — [unverified].
- AI SDK `/playground` specifics beyond "compare models" — [unverified].
- Everything else is freshly fetched 2026-05-30.

## Related research

- [Scaffolder CLI patterns](./scaffolder-cli-patterns.md) — how Next/Vite/T3 etc. structure the multi-template + interactive selection + invocation URL surface.
