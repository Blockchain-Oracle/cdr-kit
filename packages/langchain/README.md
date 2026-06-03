<p align="center">
  <a href="https://cdrkit.xyz">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark-dark.svg">
      <img src="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark.svg" alt="cdr-kit" width="200">
    </picture>
  </a>
</p>


# @cdr-kit/langchain

> LangChain adapter for cdr-kit. All 34 CDR tools as `StructuredTool`s for an agent / tool-calling chain.

---

## Install

```bash
pnpm add @cdr-kit/langchain @cdr-kit/agent @langchain/core @langchain/anthropic
```

---

## Quick start

```ts
import { CdrAgent } from "@cdr-kit/agent";
import { getLangChainTools } from "@cdr-kit/langchain";
import { ChatAnthropic } from "@langchain/anthropic";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const agent = new CdrAgent({
  privateKey: process.env.WALLET_PRIVATE_KEY as `0x${string}`,
  rpcUrl: "https://aeneid.storyrpc.io",
});

const tools = getLangChainTools(agent);

const model = new ChatAnthropic({ model: "claude-opus-4-7" });
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a CDR agent. Use the tools to discover and read encrypted vaults."],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"],
]);

const toolCallingAgent = await createToolCallingAgent({ llm: model, tools, prompt });
const executor = new AgentExecutor({ agent: toolCallingAgent, tools });

const result = await executor.invoke({
  input: "Find a recent trading-signal vault and decrypt it.",
});
console.log(result.output);
```

---

## What you get

- All 34 CDR tools as LangChain `StructuredTool`s
- Each tool has a Zod schema → LangChain converts to JSON-Schema automatically
- Works with any LangChain-compatible model

---

## Peer dependencies

- `@cdr-kit/agent` ≥ 0.7.0
- `@langchain/core` ≥ 0.3
- `viem` ≥ 2.21

---

## Links

- Full docs: <https://cdrkit.xyz/docs/agent-kit/langchain>
- npm: <https://www.npmjs.com/package/@cdr-kit/langchain>
- GitHub: <https://github.com/Blockchain-Oracle/cdr-kit>
- LangChain: <https://langchain.com>
