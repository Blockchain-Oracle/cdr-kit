# cdr-kit × Vercel AI SDK — autonomous vault agent

Give an LLM the CDR tools and let it discover, pay for, and read Story CDR vaults on its own.

```ts
import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { CdrAgent } from "@cdr-kit/agent";
import { getVercelAITools } from "@cdr-kit/vercel-ai";

const agent = new CdrAgent({ privateKey: process.env.PRIVATE_KEY as `0x${string}`, apiUrl: process.env.CDR_API_URL! });

const { text } = await generateText({
  model: openai("gpt-4o"),
  tools: getVercelAITools(agent),
  stopWhen: stepCountIs(6),
  prompt: "Find a CDR vault, subscribe if needed (max 0.001 IP), read it, and summarize the contents.",
});
console.log(text);
```

Run: `OPENAI_API_KEY=… PRIVATE_KEY=0x<testnet> CDR_API_URL=http://172.192.41.96:1317 tsx index.ts`

The agent pays from its own wallet — no human in the loop. Same `CdrAgent` powers the LangChain
(`@cdr-kit/langchain`), raw OpenAI/Anthropic (`@cdr-kit/openai`), and MCP (`@cdr-kit/mcp`) surfaces.
