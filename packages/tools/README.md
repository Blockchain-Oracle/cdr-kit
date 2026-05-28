# @cdr-kit/tools

Framework-agnostic **CDR agent tools** — the single source of truth that every adapter maps from. Each tool is `{ name, description, schema (Zod), invoke }`.

```bash
npm install @cdr-kit/tools @cdr-kit/agent
```

```ts
import { CdrAgent } from "@cdr-kit/agent";
import { createCdrTools, toJsonSchema } from "@cdr-kit/tools";

const tools = createCdrTools(new CdrAgent({ privateKey, apiUrl }));
// tools[i]: { name, description, schema, invoke(args) }
const jsonSchema = toJsonSchema(tools[0].schema); // zod -> JSON Schema, the shared primitive
```

You rarely import this directly — use the adapter for your runtime:

| Runtime | Package |
|---|---|
| MCP hosts (Claude Desktop, Cursor, OpenClaw, …) | [`@cdr-kit/mcp`](../mcp) |
| Vercel AI SDK | [`@cdr-kit/vercel-ai`](../vercel-ai) |
| OpenAI / Anthropic raw tool-calling | [`@cdr-kit/openai`](../openai) |
| LangChain | [`@cdr-kit/langchain`](../langchain) |
| Coinbase AgentKit | [`@cdr-kit/agentkit`](../agentkit) |
| GOAT | [`@cdr-kit/goat`](../goat) |
