# @cdr-kit/agent

Autonomous agent client for **Story CDR**: an agent discovers vaults, subscribes, and accesses the plaintext **from its own wallet** — the headless counterpart to [`@cdr-kit/react`](../react).

```bash
npm install @cdr-kit/agent @cdr-kit/core
```

```ts
import { CdrAgent } from "@cdr-kit/agent";

const agent = new CdrAgent({ privateKey: process.env.PRIVATE_KEY, apiUrl: process.env.STORY_API_URL });

const vaults = await agent.discover();
const bytes = await agent.subscribeAndAccess({ uuid: vaults[0].uuid, periods: 1n, maxPricePerPeriod: price, value: price });
// or, if already entitled:
const data = await agent.access(uuid);
```

This is the object every framework adapter wraps — see [`@cdr-kit/tools`](../tools), [`@cdr-kit/mcp`](../mcp), and the `vercel-ai` / `openai` / `langchain` / `agentkit` / `goat` adapters.
