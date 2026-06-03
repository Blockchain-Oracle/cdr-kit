<p align="center">
  <a href="https://cdrkit.xyz">
    <img src="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/banner.svg" alt="cdr-kit — wagmi-style toolkit for Story Confidential Data Rails" width="100%">
  </a>
</p>



# @cdr-kit/vercel-ai

> Vercel AI SDK adapter for cdr-kit. All 34 CDR tools as `tool()`s for `generateText` / `streamText`.

Hand the result to any AI SDK model — Claude, GPT-4, Gemini, anything — and the LLM autonomously discovers vaults, subscribes, decrypts, and answers from the plaintext.

---

## Install

```bash
pnpm add @cdr-kit/vercel-ai @cdr-kit/agent ai @ai-sdk/anthropic
```

---

## Quick start

```ts
import { CdrAgent } from "@cdr-kit/agent";
import { getVercelAITools } from "@cdr-kit/vercel-ai";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const agent = new CdrAgent({
  privateKey: process.env.WALLET_PRIVATE_KEY as `0x${string}`,
  rpcUrl: "https://aeneid.storyrpc.io",
});

const tools = getVercelAITools(agent);

const result = await generateText({
  model: anthropic("claude-opus-4-7"),
  tools,
  prompt: "Find a recent trading-signal vault and tell me what the signal is.",
  maxSteps: 8,
});

console.log(result.text);
```

The LLM will call `cdr_discover_vaults` → `cdr_get_vault_info` → `cdr_check_entitlement` → `cdr_subscribe_and_access` autonomously, then summarize the decrypted JSON.

---

## What you get

- All 34 CDR tools as Vercel AI `tool()`s (same shape `generateText` / `streamText` consume)
- Schema-driven: every tool emits a Zod `parameters` schema, so the LLM sees full param hints
- Composes with any other AI SDK tools you already have

---

## Peer dependencies

- `@cdr-kit/agent` ≥ 0.7.0
- `ai` ≥ 6
- `viem` ≥ 2.21

---

## Demos

- [`examples/vercel-ai-chatbot`](../../examples/vercel-ai-chatbot) — full Next.js app: model + tools + CDR vault, end-to-end on Aeneid.

---

## Links

- Full docs: <https://cdrkit.xyz/docs/agent-kit/vercel-ai>
- npm: <https://www.npmjs.com/package/@cdr-kit/vercel-ai>
- GitHub: <https://github.com/Blockchain-Oracle/cdr-kit>
- Vercel AI SDK: <https://sdk.vercel.ai>
