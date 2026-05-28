# @cdr-kit/agentkit

[Coinbase AgentKit](https://docs.cdp.coinbase.com/agentkit) adapter for cdr-kit. Returns an action provider you register alongside your other AgentKit providers.

```bash
npm install @cdr-kit/agentkit @cdr-kit/agent @coinbase/agentkit
```

```ts
import { CdrAgent } from "@cdr-kit/agent";
import { getCdrActionProvider } from "@cdr-kit/agentkit";
import { AgentKit } from "@coinbase/agentkit";

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [getCdrActionProvider(new CdrAgent({ privateKey, apiUrl }))],
});
```

> AgentKit prefixes action names with `CustomActionProvider_`. Backed by [`@cdr-kit/tools`](../tools).
