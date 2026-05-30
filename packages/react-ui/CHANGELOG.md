# @cdr-kit/react-ui

## 0.1.0

### Minor Changes

- Initial public release of `@cdr-kit/react-ui` — styled component variants for the headless `@cdr-kit/react` (the Clerk pattern). Ships `<ConditionBadge>`, `<AccessStepper>` (with determinate `{collected, threshold}` partials), `<SubscribeButton>` (wraps `useSubscribeAndAccess` + inline AccessStepper + decoded JSON), `<VaultCard>` (CSS pointer-spotlight, no `GlowCard` dep), plus DX primitives: `<CopyButton>`, `<ShortAddress>`, `<ExplorerLink>`, `<IpPrice>`, `<CdrNetworkChip>`, `<CdrSpinner>`, `<CdrProgress>`, `<CdrError>`. Styled with `--cdr-ui-*` CSS variables only — no Tailwind, no lucide, no framer-motion as hard requirements; ships a single `styles.css` consumers import once with light + dark mode via `[data-theme="dark"]`.
