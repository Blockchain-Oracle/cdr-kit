import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const CODE = `import OpenAI from "openai";
import { CdrAgent } from "@cdr-kit/agent";
import { getOpenAITools } from "@cdr-kit/openai";

const agent = new CdrAgent({ privateKey, apiUrl });
const { tools, dispatch } = getOpenAITools(agent);

const openai = new OpenAI();
const res = await openai.chat.completions.create({
  model: "gpt-4o",
  tools, // JSON-schema tool definitions
  messages: [{ role: "user", content: "Find and read vault 4200." }],
});
// route tool calls back through dispatch(name, args)`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit", "Agent kit", "OpenAI / Anthropic"],
        title: "OpenAI / Anthropic adapter",
        badges: <Badge tone="primary">@cdr-kit/openai</Badge>,
        lede: <>JSON-Schema <code>tools[]</code> + a <code>dispatch</code> router for OpenAI Chat Completions / Anthropic Messages. Works with either provider.</>,
        importLine: 'import { getOpenAITools } from "@cdr-kit/openai"',
        sections: [{ id: "usage", title: "Usage", content: <CodePanel title="openai-agent.ts" code={CODE} /> }],
        prev: { href: "/docs/agent-kit/vercel-ai", label: "Vercel AI SDK" },
        next: { href: "/docs/agent-kit/langchain", label: "LangChain" },
      }}
    />
  );
}
