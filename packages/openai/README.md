# @cdr-kit/openai

Raw **OpenAI / Anthropic tool-calling** adapter for cdr-kit — no framework dependency. Returns a `tools[]` JSON-Schema array plus a `dispatch` router.

```bash
npm install @cdr-kit/openai @cdr-kit/agent
```

```ts
import { CdrAgent } from "@cdr-kit/agent";
import { getOpenAITools } from "@cdr-kit/openai";

const { tools, dispatch } = getOpenAITools(new CdrAgent({ privateKey, apiUrl }));

// pass `tools` to the chat API, then for each tool_call the model returns:
const result = await dispatch(call.function.name, call.function.arguments);
```

Backed by [`@cdr-kit/tools`](../tools).
