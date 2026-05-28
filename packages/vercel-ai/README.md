# @cdr-kit/vercel-ai

[Vercel AI SDK](https://sdk.vercel.ai) adapter for cdr-kit. Turns the CDR agent tools into AI SDK `tool()`s you can hand straight to `generateText` / `streamText`.

```bash
npm install @cdr-kit/vercel-ai @cdr-kit/agent ai
```

```ts
import { CdrAgent } from "@cdr-kit/agent";
import { getVercelAITools } from "@cdr-kit/vercel-ai";
import { generateText } from "ai";

const tools = getVercelAITools(new CdrAgent({ privateKey, apiUrl }));
await generateText({ model, tools, prompt: "Find a vault and read it." });
```

Backed by [`@cdr-kit/tools`](../tools).
