# @cdr-kit/langchain

[LangChain](https://langchain.com) adapter for cdr-kit. Returns `DynamicStructuredTool`s ready for an agent / tool-calling chain.

```bash
npm install @cdr-kit/langchain @cdr-kit/agent @langchain/core
```

```ts
import { CdrAgent } from "@cdr-kit/agent";
import { getLangChainTools } from "@cdr-kit/langchain";

const tools = getLangChainTools(new CdrAgent({ privateKey, apiUrl }));
// bind to your model / create a tool-calling agent
```

Backed by [`@cdr-kit/tools`](../tools).
