# @cdr-kit/agentkit

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
  - @cdr-kit/agent@0.2.0
  - @cdr-kit/tools@0.2.0

## 0.1.0

### Minor Changes

- Initial public release (0.1.0) of cdr-kit — the developer toolkit for Story Confidential Data Rails: deployed condition contracts, a typed core SDK (`@cdr-kit/core`), React hooks + components (`@cdr-kit/react`), an autonomous agent client (`@cdr-kit/agent`) with framework adapters (Vercel AI / OpenAI / LangChain / AgentKit / GOAT) and an MCP server, plus a project scaffolder (`create-cdr-kit-app`).

### Patch Changes

- Updated dependencies
  - @cdr-kit/agent@0.1.0
  - @cdr-kit/tools@0.1.0
