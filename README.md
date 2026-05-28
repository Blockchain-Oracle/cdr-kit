# cdr-kit

**The developer toolkit for Story Protocol's Confidential Data Rails (CDR)** — the wagmi/Stripe layer for CDR.

A standard library of CDR condition contracts + a typed TS SDK + a React layer + an autonomous agent SDK, so anyone can ship private, paid, license-gated data on Story without hand-rolling the protocol. CDR's encryption is commodity (Lit/TACo do it too) — cdr-kit's edge is the **Story IP coupling** (license-tier gating + royalty rails) made usable.

> **Status: backend + SDK + agent complete and validated live on Aeneid.** The full encrypt→write→read→decrypt round-trip and an autonomous agent paying + reading a vault both run end-to-end on real chain. Dashboard (flagship UI) is the remaining piece. 30 Foundry tests; workspace lint/typecheck/build green.

## Packages

| Package | What |
|---|---|
| `contracts/` (Foundry) | Condition standard library (`Subscription`, `TierGate`, `Composable`, `CreatorWrite`, `Open`) + `CdrKitVault` factory |
| `@cdr-kit/contracts` | wagmi-cli typed ABIs + verified Aeneid addresses (single source of truth) |
| `@cdr-kit/core` | `createCdrKitClient`, condition-config encoders, 2-step flows (`subscribeAndAccess`, `createVault`, `writeVaultData`, `accessVault`), WASM init |
| `@cdr-kit/react` | `<CdrProvider>`, `<VaultGate>`, hooks (`useAccessVault`, `useSubscribeAndAccess`, `useCreateVault`, `useCreatorVaults`) |
| `@cdr-kit/agent` | `CdrAgent` — own-wallet discover → subscribe → access, autonomous |

## Deployed (Story Aeneid testnet, chain 1315)

```
CdrKitVault            0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C
SubscriptionCondition  0xB75Cc6571ac7E0ee30A519192740fc471e187458
TierGateCondition      0xdA704Faf61b2FFB37205d7Eb8C1D26BD3090455f
ComposableCondition    0x74F2f94e7867b07ECDFbcc667050CBec1dE2800B
CreatorWriteCondition  0x85CEB332445ca1d3D1975d6929cA6BED25195b2F
OpenCondition          0x36fB2e2d10efd1E905b7779A684F34B9c775b62B
defaultLicenseTermsId  2536
```

## Quickstart (React)

```tsx
import { CdrProvider, VaultGate } from "@cdr-kit/react";

<CdrProvider config={wagmiConfig} apiUrl="http://172.192.41.96:1317">
  <VaultGate uuid={vaultId} auto loading={<Spinner/>} fallback={<SubscribeButton/>}>
    {(data) => <pre>{new TextDecoder().decode(data)}</pre>}
  </VaultGate>
</CdrProvider>
```

## Live demos (real Aeneid)

```bash
source contracts/.env                          # PRIVATE_KEY (testnet), funded via faucet
pnpm --filter @cdr-kit/core  run e2e           # encrypt→write→read→decrypt round-trip
pnpm --filter @cdr-kit/agent run demo          # seller vault → agent pays + reads, autonomous
```

## Dev

```bash
pnpm install
pnpm build | pnpm test | pnpm lint | pnpm typecheck   # turbo across packages
cd contracts && forge test                            # 30 Solidity tests
forge script script/Deploy.s.sol:Deploy --rpc-url aeneid --broadcast --legacy --with-gas-price 60000000000 --slow
```

## Repo layout

```
story-cdr/
├── contracts/   # Foundry: conditions + CdrKitVault + Deploy.s.sol
├── packages/    # @cdr-kit/{contracts,core,react,agent}
├── docs/        # SPECS — PRD, architecture, ux-spec, epics, BDD stories
├── context/     # KNOWLEDGE BASE — research, decisions (D1–D15), best practices, vendored source
└── CLAUDE.md    # build conventions + gotchas for coding agents
```

`context/00-START-HERE.md` is the entrypoint for understanding *why/how CDR works* (verified on-chain). `docs/` is *what we're building*. Building the dashboard? See `docs/ux-spec.md` + `docs/stories/story-e7-dashboard.md`.

## Gotchas (full detail in `context/research/cdr-protocol-truth.md`)

- **CDR has no confidential compute** — the buyer holds plaintext after decrypt. The moat is no-billing-infra + royalty rails + on-chain revocation, not secrecy-after-sale.
- **Condition interface is 4-param uuid-first** (`checkReadCondition(uint32,bytes,bytes,address)`) — the docs' 3-param shape is dead. Verified on-chain.
- **Raw CDR precompile txs need an explicit gas limit** (eth_estimateGas OOGs them); the SDK path is fine, and `core.createVault` sets one.
- **`uuid` is a global counter** — read it from the `VaultCreated`/`VaultAllocated` event, never predict it.
- Read latency ~15s typical (7-min worst case). Testnet only.
