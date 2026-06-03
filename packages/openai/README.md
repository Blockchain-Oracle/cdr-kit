<p align="center">
  <a href="https://cdrkit.xyz">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark-dark.svg">
      <img src="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark.svg" alt="cdr-kit" width="200">
    </picture>
  </a>
</p>


# @cdr-kit/openai

> Raw OpenAI / Anthropic function-calling adapter for cdr-kit — no framework dep. Returns a `tools[]` JSON-Schema array + a `dispatch()` router.

The most portable adapter — works with any LLM client that speaks the OpenAI function-calling shape (OpenAI SDK, Anthropic SDK, Mistral, Groq, llama.cpp, …).

---

## Install

```bash
pnpm add @cdr-kit/openai @cdr-kit/agent openai
```

---

## Quick start

```ts
import { CdrAgent } from "@cdr-kit/agent";
import { getOpenAITools } from "@cdr-kit/openai";
import OpenAI from "openai";

const agent = new CdrAgent({
  privateKey: process.env.WALLET_PRIVATE_KEY as `0x${string}`,
  rpcUrl: "https://aeneid.storyrpc.io",
});

const { tools, dispatch } = getOpenAITools(agent);
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const messages = [{ role: "user", content: "Find a vault and tell me what's in it." }];

while (true) {
  const res = await client.chat.completions.create({
    model: "gpt-4o",
    messages,
    tools, // ← 34 CDR functions
  });
  const msg = res.choices[0].message;
  messages.push(msg);

  if (!msg.tool_calls?.length) {
    console.log(msg.content);
    break;
  }

  for (const call of msg.tool_calls) {
    const result = await dispatch(call.function.name, JSON.parse(call.function.arguments));
    messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
  }
}
```

---

## Peer dependencies

- `@cdr-kit/agent` ≥ 0.7.0
- `viem` ≥ 2.21

---

## Links

- Full docs: <https://cdrkit.xyz/docs/agent-kit/openai>
- npm: <https://www.npmjs.com/package/@cdr-kit/openai>
- GitHub: <https://github.com/Blockchain-Oracle/cdr-kit>
