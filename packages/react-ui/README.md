<p align="center">
  <a href="https://cdrkit.xyz">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark-dark.svg">
      <img src="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark.svg" alt="cdr-kit" width="200">
    </picture>
  </a>
</p>


# @cdr-kit/react-ui

> Styled, batteries-included components for Story CDR. Clerk + RainbowKit pattern: `@cdr-kit/react` is headless, this package is the designed default.

---

## Install

```bash
pnpm add @cdr-kit/react-ui @cdr-kit/react @cdr-kit/core
```

Import the stylesheet once at your app root:

```ts
import "@cdr-kit/react-ui/styles.css";
```

---

## Quick start

```tsx
import { CdrProvider } from "@cdr-kit/react";
import { createMockCdrKit } from "@cdr-kit/core";
import { SubscribeButton } from "@cdr-kit/react-ui";

<CdrProvider mockKit={createMockCdrKit()}>
  <SubscribeButton uuid={4200} priceWei={5n * 10n ** 18n} priceLabel="5 $IP" />
</CdrProvider>
```

---

## Components

| component                       | what                                                                |
| ------------------------------- | ------------------------------------------------------------------- |
| `<ConditionBadge>`              | tone-coded badge for any condition kind                             |
| `<AccessStepper>`               | progress strip: `idle → paying → collecting-partials → ready/error` |
| `<SubscribeButton>`             | batteries-included CTA (wraps `useSubscribeAndAccess`)              |
| `<UnlockablePill>`              | inline-prose paywall pill (Onscroll / Confide pattern)              |
| `<VaultCard>`                   | full vault tile for discovery grids                                 |
| `<HeartbeatTimer>`              | dead-man-switch countdown                                           |
| `<TimeWindowBadge>`             | time-window state (before / inside / after)                         |
| `<MultiSigApprovalTracker>`     | live signer-set + epoch + counts                                    |
| `<MultiSigSigner>`              | sign / approve button for multi-sig vaults                          |
| `<EscrowDeliveryConfirm>`       | buyer-side pay → confirm flow                                       |
| `<CopyButton>` `<CopyLine>`     | one-click copy helpers                                              |
| `<ShortAddress>`                | EIP-55 truncated address                                            |
| `<ExplorerLink>`                | external link to the Aeneid block explorer                          |
| `<IpPrice>`                     | render a wei BigInt as `5 $IP / month`                              |
| `<CdrNetworkChip>`              | live/connecting status pill (Aeneid vs mainnet vs offline)          |
| `<CdrSpinner>` `<CdrProgress>`  | loading + progress primitives                                       |
| `<CdrError>`                    | typed-error renderer (maps `CdrErrorCode` → readable copy)          |

---

## Theming

No Tailwind, no lucide, no framer-motion as hard requirements. Styled via CSS custom properties on a `--cdr-ui-*` namespace, with light + dark defaults shipped via `[data-theme="dark"]`. Override at any ancestor:

```css
:root {
  --cdr-ui-primary: #e86c2e;
  --cdr-ui-signal:  #1E9C66;
  --cdr-ui-warn:    #C0863A;
  --cdr-ui-danger:  #D32D2D;
  /* …see styles.css for the full token set */
}
```

---

## Peer dependencies

- `@cdr-kit/react` ≥ 0.7.0
- `@cdr-kit/core` ≥ 0.7.0
- `react` ≥ 18

---

## Links

- Full docs: <https://cdrkit.xyz/docs/components>
- npm: <https://www.npmjs.com/package/@cdr-kit/react-ui>
- GitHub: <https://github.com/Blockchain-Oracle/cdr-kit>
