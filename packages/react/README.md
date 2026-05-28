# @cdr-kit/react

React provider, hooks, and components for **Story CDR** — built on [`@cdr-kit/core`](../core). Discriminated-status hooks, a Clerk-style `<Vault>` compound, and a mock mode so you can build UI with no wallet/chain.

```bash
npm install @cdr-kit/react @cdr-kit/core wagmi viem @tanstack/react-query
```

```tsx
import { CdrProvider, Vault, CdrSkeleton } from "@cdr-kit/react";
import { createMockCdrKit } from "@cdr-kit/core";

// mock mode — swap mockKit for config={wagmiConfig} apiUrl="…" to go live
<CdrProvider mockKit={createMockCdrKit()}>
  <Vault uuid={1}>
    <Vault.Loading><CdrSkeleton lines={3} /></Vault.Loading>
    <Vault.Unlocked>{(data) => <pre>{new TextDecoder().decode(data)}</pre>}</Vault.Unlocked>
    <Vault.Locked>Subscribe to read</Vault.Locked>
  </Vault>
</CdrProvider>
```

- **Hooks:** `useAccessVault` (discriminated `status`/`data`/`error`/`progress`), `useSubscribeAndAccess`, `useCreateVault`, `useCreatorVaults`, `useVault`, `useVaultEvents`.
- **Components:** `<VaultGate>`, the `<Vault>` compound (`Unlocked`/`Locked`/`Loading`), `<CdrSkeleton>`, `<EmptyVaults>`, `<CdrInspector>`.
- **Theming:** `<CdrProvider appearance={{ variables: { "--cdr-skeleton": "#222" } }}>`.
