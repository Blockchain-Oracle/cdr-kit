# @cdr-kit/react-ui

Styled component variants for [`@cdr-kit/react`](../react) — `ConditionBadge`, `AccessStepper`, `SubscribeButton`, `VaultCard`, plus DX primitives (`CopyButton`, `ShortAddress`, `ExplorerLink`, `IpPrice`, `CdrNetworkChip`, `CdrSpinner`, `CdrProgress`, `CdrError`).

The Clerk / RainbowKit pattern: the headless `@cdr-kit/react` ships hooks + render-prop slots; **this package adds the designed, batteries-included variants**.

## Install

```bash
pnpm add @cdr-kit/react-ui @cdr-kit/react @cdr-kit/core
```

Import the stylesheet once at your app root:

```ts
import "@cdr-kit/react-ui/styles.css";
```

## Use

```tsx
import { CdrProvider } from "@cdr-kit/react";
import { createMockCdrKit } from "@cdr-kit/core";
import { SubscribeButton } from "@cdr-kit/react-ui";

<CdrProvider mockKit={createMockCdrKit()}>
  <SubscribeButton uuid={4200} priceWei={5n * 10n ** 18n} priceLabel="5 $IP" />
</CdrProvider>
```

## Theming

No Tailwind, no lucide, no framer-motion as hard requirements. Components are styled with **CSS custom properties on a `--cdr-ui-*` namespace**, with light + dark defaults shipped via `[data-theme="dark"]`. Override at any ancestor:

```css
:root {
  --cdr-ui-primary: #3E3BE3;
  --cdr-ui-signal:  #1E9C66;
  --cdr-ui-warn:    #C0863A;
  --cdr-ui-danger:  #D32D2D;
  /* …see styles.css for the full token set */
}
```

## License

MIT.
