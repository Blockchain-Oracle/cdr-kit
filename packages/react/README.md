<p align="center">
  <a href="https://cdrkit.xyz">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark-dark.svg">
      <img src="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark.svg" alt="cdr-kit" width="200">
    </picture>
  </a>
</p>


# @cdr-kit/react

> React provider, hooks, and headless components for Story CDR. Discriminated-status hooks, Clerk-style `<Vault>` compound, mock mode for zero-wallet dev.

The wagmi-style headless layer. Pair with `@cdr-kit/react-ui` for the batteries-included styled components.

---

## Install

```bash
pnpm add @cdr-kit/react @cdr-kit/core wagmi viem @tanstack/react-query
```

---

## Quick start — mock mode

```tsx
import { CdrProvider, Vault, CdrSkeleton } from "@cdr-kit/react";
import { createMockCdrKit } from "@cdr-kit/core";

export default function App() {
  return (
    <CdrProvider mockKit={createMockCdrKit()}>
      <Vault uuid={1}>
        <Vault.Loading><CdrSkeleton lines={3} /></Vault.Loading>
        <Vault.Unlocked>{(data) => <pre>{new TextDecoder().decode(data)}</pre>}</Vault.Unlocked>
        <Vault.Locked>Subscribe to read</Vault.Locked>
      </Vault>
    </CdrProvider>
  );
}
```

---

## Quick start — live (Aeneid)

Inside a `WagmiProvider` + `QueryClientProvider`:

```tsx
import { CdrConfigProvider } from "@cdr-kit/react";

<CdrConfigProvider>
  {/* hooks here read wallet + chain from wagmi */}
</CdrConfigProvider>
```

---

## Hooks

| hook                          | what it returns                                                      |
| ----------------------------- | -------------------------------------------------------------------- |
| `useAccessVault(uuid)`        | `{ status, data, error, progress }` discriminated union              |
| `useSubscribeAndAccess(uuid)` | `{ run, status, data, error, txHash, progress }`                     |
| `useCreateVault()`            | `{ create, status, txHash, uuid, error }`                            |
| `useDiscoverVaults()`         | `{ vaults, isLoading, error }`                                       |
| `useCreatorVaults(addr)`      | every vault by a creator                                             |
| `useVault(uuid)`              | on-chain metadata (tokenId, ipId, creator, licenseTermsId)           |
| `useVaultEvents()`            | live subscription to factory events                                  |
| `useCdrWallet()`              | derived wallet status + balance                                      |
| `useDeadManTimer(uuid)`       | live heartbeat countdown, `isUnlocked`                               |
| `useTimeWindowState(uuid)`    | `before` / `inside` / `after` + remaining seconds                    |
| `useMultiSigStatus(uuid)`     | signer set, current epoch, on-chain + off-chain counts               |
| `useEscrowState(uuid)`        | `idle` / `paid` / `confirmed` / `claimed-by-seller` / `refunded`     |
| `useStorageBackend()`         | reactive storage adapter selector for forms / discovery              |
| `useStoryClient()`            | lazy Story SDK client                                                |
| `useRegisterIp(client)`       | register an IP asset                                                 |
| `useMintLicenseToken(client)` | mint license tokens                                                  |
| `useAttachLicenseTerms(c)`    | attach PIL terms                                                     |
| `usePublish()`                | one-shot publish (register IP + attach PIL + create vault + write)   |

---

## Components

| component        | what                                                          |
| ---------------- | ------------------------------------------------------------- |
| `<CdrProvider>`  | batteries-included: wires wagmi + react-query + CDR context   |
| `<CdrConfigProvider>` | CDR context only — for apps with an existing wagmi stack |
| `<Vault>`        | Clerk-style compound: `Loading` / `Locked` / `Unlocked`       |
| `<VaultGate>`    | conditional render based on entitlement                       |
| `<CdrSkeleton>`  | loading placeholder                                           |
| `<EmptyVaults>`  | empty-state for vault lists                                   |
| `<CdrInspector>` | live state debugger for the active CDR context                |

---

## Theming

```tsx
<CdrProvider
  appearance={{
    variables: {
      "--cdr-skeleton": "#222",
      "--cdr-primary": "#e86c2e",
    },
  }}
>
```

---

## Peer dependencies

- `@cdr-kit/core` ≥ 0.7.0
- `react` ≥ 18
- `wagmi` ≥ 2.14
- `viem` ≥ 2.21
- `@tanstack/react-query` ≥ 5

---

## Links

- Full docs: <https://cdrkit.xyz/docs/components>
- npm: <https://www.npmjs.com/package/@cdr-kit/react>
- GitHub: <https://github.com/Blockchain-Oracle/cdr-kit>
