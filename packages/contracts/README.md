# @cdr-kit/contracts

Typed ABIs + verified addresses for the cdr-kit contracts and Story CDR. Pure TypeScript (no runtime deps) — generated via `@wagmi/cli` from the Foundry build.

```bash
npm install @cdr-kit/contracts
```

```ts
import { cdrKitVaultAbi, aeneid, CDR_GAS_LIMIT } from "@cdr-kit/contracts";

aeneid.cdrKitVault;        // deployed factory address
CDR_GAS_LIMIT;             // explicit gas (CDR precompile txs OOG under eth_estimateGas)
cdrKitVaultAbi;            // const-typed ABI for viem/wagmi
```

Consumed by [`@cdr-kit/core`](../core) and [`@cdr-kit/react`](../react). Regenerate with `pnpm --filter @cdr-kit/contracts generate` after a contract change.
