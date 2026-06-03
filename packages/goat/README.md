<p align="center">
  <a href="https://cdrkit.xyz">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark-dark.svg">
      <img src="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark.svg" alt="cdr-kit" width="200">
    </picture>
  </a>
</p>


# @cdr-kit/goat

> GOAT SDK adapter for cdr-kit. All 34 CDR tools as GOAT `ToolBase` instances.

---

## Install

```bash
pnpm add @cdr-kit/goat @cdr-kit/agent @goat-sdk/core
```

---

## Quick start

```ts
import { CdrAgent } from "@cdr-kit/agent";
import { getGoatTools } from "@cdr-kit/goat";

const agent = new CdrAgent({
  privateKey: process.env.WALLET_PRIVATE_KEY as `0x${string}`,
  rpcUrl: "https://aeneid.storyrpc.io",
});

const tools = getGoatTools(agent);
// hand `tools` to your GOAT agent runtime
```

Each tool has `.name`, `.description`, `.parameters` (Zod), and `.execute()`. Composes with any other GOAT toolset you've already wired.

---

## Peer dependencies

- `@cdr-kit/agent` ≥ 0.7.0
- `@goat-sdk/core` ≥ 0.4
- `viem` ≥ 2.21

---

## Links

- Full docs: <https://cdrkit.xyz/docs/agent-kit/goat>
- npm: <https://www.npmjs.com/package/@cdr-kit/goat>
- GitHub: <https://github.com/Blockchain-Oracle/cdr-kit>
- GOAT SDK: <https://github.com/goat-sdk/goat>
