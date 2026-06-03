<p align="center">
  <a href="https://cdrkit.xyz">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark-dark.svg">
      <img src="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark.svg" alt="cdr-kit" width="200">
    </picture>
  </a>
</p>


# @cdr-kit/agentkit

> Coinbase AgentKit adapter for cdr-kit. All 34 CDR tools as an AgentKit `ActionProvider`.

Drop alongside your other AgentKit providers — your agent gets the full Story CDR surface (vault discovery, subscribe, decrypt, advanced conditions, Story IP) on top of whatever wallet/onchain stack AgentKit already gives it.

---

## Install

```bash
pnpm add @cdr-kit/agentkit @cdr-kit/agent @coinbase/agentkit
```

---

## Quick start

```ts
import { CdrAgent } from "@cdr-kit/agent";
import { getCdrActionProvider } from "@cdr-kit/agentkit";
import { AgentKit, ViemWalletProvider } from "@coinbase/agentkit";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({
  account,
  transport: http("https://aeneid.storyrpc.io"),
});

const cdrAgent = new CdrAgent({
  privateKey: process.env.WALLET_PRIVATE_KEY as `0x${string}`,
  rpcUrl: "https://aeneid.storyrpc.io",
});

const agentkit = await AgentKit.from({
  walletProvider: new ViemWalletProvider(walletClient),
  actionProviders: [getCdrActionProvider(cdrAgent)],
});

// hand `agentkit.getActions()` to your AI SDK / LangChain agent
```

---

## Naming

AgentKit prefixes action names with `CustomActionProvider_`. The dispatcher routes through the same `@cdr-kit/tools` schema as every other adapter.

---

## Peer dependencies

- `@cdr-kit/agent` ≥ 0.7.0
- `@coinbase/agentkit` ≥ 0.10
- `viem` ≥ 2.21

---

## Links

- Full docs: <https://cdrkit.xyz/docs/agent-kit/agentkit>
- npm: <https://www.npmjs.com/package/@cdr-kit/agentkit>
- GitHub: <https://github.com/Blockchain-Oracle/cdr-kit>
- Coinbase AgentKit: <https://docs.cdp.coinbase.com/agentkit>
