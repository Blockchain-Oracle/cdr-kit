<p align="center">
  <a href="https://cdrkit.xyz">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark-dark.svg">
      <img src="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark.svg" alt="cdr-kit" width="200">
    </picture>
  </a>
</p>


# @cdr-kit/contracts

> Typed ABIs + verified deployed addresses for cdr-kit + Story CDR. Single source of truth for every other package.

Pure TypeScript, no runtime deps. ABIs are generated via `@wagmi/cli` from the Foundry build at `contracts/out/`. **Never hardcode an address anywhere else** — import from this package.

---

## Install

```bash
pnpm add @cdr-kit/contracts viem
```

---

## Quick start

```ts
import {
  aeneid,
  cdrKitVaultAbi,
  CDR_GAS_LIMIT,
  resolveAddresses,
} from "@cdr-kit/contracts";

// every deployed address on Aeneid testnet (chain 1315)
aeneid.cdrKitVault;                   // factory
aeneid.openCondition;                 // always-allow read/write
aeneid.timeWindowCondition;
aeneid.deadManSwitchCondition;
aeneid.conditionalEscrowCondition;
aeneid.multiSigCondition;
aeneid.subscriptionCondition;
aeneid.tierGateCondition;
aeneid.creatorWriteCondition;
aeneid.composableCondition;

// const-typed ABI — autocompletes through viem.readContract + writeContract
cdrKitVaultAbi;

// explicit gas limit — CDR precompile txs OOG under eth_estimateGas
// (ReentrancySentryOOG); use 2M+ for safety
CDR_GAS_LIMIT;

// resolve addresses by network name
const addrs = resolveAddresses("aeneid"); // { cdrKitVault, openCondition, … }
```

---

## Live Aeneid addresses (0.7.1)

| contract                       | address                                                                 |
| ------------------------------ | ----------------------------------------------------------------------- |
| **CdrKitVault** (factory)      | `0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C`                            |
| **OpenCondition**              | `0x78528c2dd16fc450ff417189cc0436e8d2d82389` (r3 — see CLAUDE.md D25)    |
| **TimeWindowCondition**        | `0x67911435F262e7e4EC4F7FEB4e868a67b9dd90b1`                            |
| **DeadManSwitchCondition**     | `0x37226f97e184843aB0b8d4f08A55969801B97766`                            |
| **ConditionalEscrowCondition** | `0x7fcDe02DB7c14fD3587aB2fED064a1D8355b7584`                            |
| **MultiSigCondition**          | `0x3A0Cf72f167A2c1f5a7A5025eb36219f28C20FCd`                            |
| **SubscriptionCondition**      | `0xB75Cc6571ac7E0ee30A519192740fc471e187458`                            |
| **TierGateCondition**          | `0xdA704Faf61b2FFB37205d7Eb8C1D26BD3090455f`                            |
| **CreatorWriteCondition**      | `0x85CEB332445ca1d3D1975d6929cA6BED25195b2F`                            |
| **ComposableCondition**        | `0x74F2f94e7867b07ECDFbcc667050CBec1dE2800B`                            |

---

## Regenerating ABIs

After any change to `contracts/src/**.sol`:

```bash
pnpm --filter @cdr-kit/contracts run wagmi
```

This re-reads `contracts/out/*.json` and rewrites `src/generated.ts`.

---

## Peer dependencies

- `viem` ≥ 2.21 — only for the `Hex` / `Address` types in the consumer API surface

---

## Links

- Full docs: <https://cdrkit.xyz/docs/contracts>
- npm: <https://www.npmjs.com/package/@cdr-kit/contracts>
- GitHub: <https://github.com/Blockchain-Oracle/cdr-kit>
- Story Protocol: <https://www.story.foundation>
