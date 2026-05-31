# @cdr-kit/react-ui

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
