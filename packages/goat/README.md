# @cdr-kit/goat

[GOAT SDK](https://github.com/goat-sdk/goat) adapter for cdr-kit. Returns GOAT tools for use across GOAT's wallet/chain integrations.

```bash
npm install @cdr-kit/goat @cdr-kit/agent @goat-sdk/core
```

```ts
import { CdrAgent } from "@cdr-kit/agent";
import { getGoatTools } from "@cdr-kit/goat";

const tools = getGoatTools(new CdrAgent({ privateKey, apiUrl }));
```

Backed by [`@cdr-kit/tools`](../tools).
