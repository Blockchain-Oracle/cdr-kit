# @cdr-kit/react-ui

## 0.3.0

### Minor Changes

- **`@cdr-kit/react-ui`** — adopt `@radix-ui/react-popover` for the `<UnlockablePill>` floating card. Closes a11y gaps in the previous custom implementation: full focus trap inside the open card, focus returns to the pill on close, ARIA Dialog roles, robust outside-click + escape handling. Mobile bottom-sheet behavior preserved via CSS.

  New peer dependency: `@radix-ui/react-popover >=1.1.0`.

  The `UnlockablePill` API is unchanged; `useFloatingCard` is removed (was an internal hook, no documented consumers).

  **`create-cdr-kit-app`** — 7 new templates (now 9 total):
  - `blog` — Next.js 16 + UnlockablePill (the onscroll pattern). Three live pills out of the box.
  - `paywall` — Next.js single-page SubscribeButton gating a content block.
  - `mcp-server` — stdio MCP server for Claude Desktop / Cursor. Ships with `claude_desktop_config.json`.
  - `agent-vercel-ai` — Vercel AI SDK chatbot wired to CDR tools.
  - `agent-openai` — Raw OpenAI / Anthropic tool-calling loop.
  - `agent-langchain` — LangChain ReAct agent.
  - `agent-agentkit` — Coinbase AgentKit action provider.
  - `agent-goat` — GOAT SDK tool set.

  Invoke: `npm create cdr-kit my-app -- --template <name>`. Each template is mock-runnable out of the box (no wallet, no chain); README walks through going live on Aeneid.

  Coupled-minor bump across all 12 cdr-kit packages plus `create-cdr-kit-app` so consumers see a single 0.3.0 matrix.

### Patch Changes

- Updated dependencies
  - @cdr-kit/core@0.3.0
  - @cdr-kit/react@0.3.0

## 0.2.0

### Minor Changes

- Add `<UnlockablePill>` — an inline "free to read, pay to unlock" paywall component (the onscroll.app pattern), driven by Story CDR.

  **New exports**
  - `@cdr-kit/react` — `Unlockable`, `useUnlockable`, `UnlockableMode`, `UnlockableRenderState`, `UnlockableProps`, `UnlockableSubscribeParams`, `UseUnlockableProps`
  - `@cdr-kit/react-ui` — `UnlockablePill`, `UnlockableCard`, `unlockedAuto`, `useFloatingCard`, `FloatingPos`, `UnlockablePillProps`, `UnlockableCardProps`

  **What it does**
  - Wrap any inline anchor in a `<UnlockablePill uuid={...} priceLabel="5 $IP">…</UnlockablePill>`. Click opens a floating card that runs the full subscribe → threshold-read → decrypt flow against the named CDR vault.
  - The anchor text stays plaintext (it's a public teaser). The encrypted payload — image, file, hidden prose — only enters the DOM after a successful read. Default renderer auto-detects PNG/JPEG/WebP/GIF/UTF-8 and falls back to a download link.
  - Below 560px the popover collapses to a bottom-sheet automatically.
  - Headless mode: `useUnlockable({ uuid })` exposes the full state machine for fully-custom UI.

  No breaking changes. All existing components and hooks work unchanged. New peer dep on `react-dom >=18` for `react-ui` (already a transitive peer of `react`).

  Coupled-minor across all 12 cdr-kit packages plus `create-cdr-kit-app` to keep the matrix consistent with `0.2.0`.

### Patch Changes

- Updated dependencies
  - @cdr-kit/core@0.2.0
  - @cdr-kit/react@0.2.0

## 0.1.0

### Minor Changes

- Initial public release of `@cdr-kit/react-ui` — styled component variants for the headless `@cdr-kit/react` (the Clerk pattern). Ships `<ConditionBadge>`, `<AccessStepper>` (with determinate `{collected, threshold}` partials), `<SubscribeButton>` (wraps `useSubscribeAndAccess` + inline AccessStepper + decoded JSON), `<VaultCard>` (CSS pointer-spotlight, no `GlowCard` dep), plus DX primitives: `<CopyButton>`, `<ShortAddress>`, `<ExplorerLink>`, `<IpPrice>`, `<CdrNetworkChip>`, `<CdrSpinner>`, `<CdrProgress>`, `<CdrError>`. Styled with `--cdr-ui-*` CSS variables only — no Tailwind, no lucide, no framer-motion as hard requirements; ships a single `styles.css` consumers import once with light + dark mode via `[data-theme="dark"]`.
