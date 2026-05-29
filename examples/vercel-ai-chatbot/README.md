# cdr-kit × Vercel AI SDK — autonomous vault agent

Give an LLM the CDR tools and let it **discover, pay for, read, and use** Story CDR vaults on its own —
no human in the loop. This is a runnable demo: a seller stages a subscription-gated vault, then the
model autonomously calls `cdr_discover_vaults` → `cdr_subscribe_and_access` and answers from the
decrypted data.

```bash
# from the repo root, with a funded Aeneid key in contracts/.env:
source contracts/.env && ANTHROPIC_API_KEY=sk-ant-... pnpm --filter cdr-kit-example-vercel-ai-chatbot start
```

The whole agent loop is one call:

```ts
import { generateText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { CdrAgent } from "@cdr-kit/agent";
import { getVercelAITools } from "@cdr-kit/vercel-ai";

const agent = new CdrAgent({ privateKey: process.env.PRIVATE_KEY!, apiUrl: process.env.CDR_API_URL! });

const { text, steps } = await generateText({
  model: anthropic(process.env.CDR_DEMO_MODEL ?? "claude-sonnet-4-6"),
  tools: getVercelAITools(agent),
  stopWhen: stepCountIs(8),
  prompt: "Discover a CDR vault, subscribe if needed, read it, and tell me the signal + BUY/HOLD.",
});
```

`CDR_DEMO_MODEL` overrides the model. See `index.ts` for the full runnable flow. The same `CdrAgent`
powers the LangChain (`@cdr-kit/langchain`), raw OpenAI/Anthropic (`@cdr-kit/openai`), AgentKit
(`@cdr-kit/agentkit`), GOAT (`@cdr-kit/goat`), and MCP (`@cdr-kit/mcp`) surfaces.
