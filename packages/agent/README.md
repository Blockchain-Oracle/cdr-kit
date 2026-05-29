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

## Demos

- **Scripted loop (no LLM):** `source contracts/.env && pnpm --filter @cdr-kit/agent run demo` — a seller vaults a signal; the agent then `discover()`s it, subscribes from its own wallet, decrypts, and makes a decision. Live on Aeneid.
- **Model-in-the-loop (real LLM):** [`examples/vercel-ai-chatbot`](../../examples/vercel-ai-chatbot) — an LLM is handed the CDR tools and autonomously calls `cdr_discover_vaults` → `cdr_subscribe_and_access`, then answers from the decrypted data. Run with `source contracts/.env && ANTHROPIC_API_KEY=… pnpm --filter cdr-kit-example-vercel-ai-chatbot start`.

The model→tool wiring is covered by a deterministic, key-less test in [`@cdr-kit/vercel-ai`](../vercel-ai/test/model-loop.test.ts) (a scripted mock model drives the real `generateText` loop).
