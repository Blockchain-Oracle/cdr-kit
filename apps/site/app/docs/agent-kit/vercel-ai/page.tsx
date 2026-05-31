import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const CODE = `import { generateText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { CdrAgent } from "@cdr-kit/agent";
import { getVercelAITools } from "@cdr-kit/vercel-ai";

const agent = new CdrAgent({ privateKey, apiUrl });

const { text } = await generateText({
  model: anthropic("claude-sonnet-4-6"),
  tools: getVercelAITools(agent),
  stopWhen: stepCountIs(8),
  prompt: "Find a CDR vault, subscribe if needed, and tell me the signal.",
});`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit", "Agent kit", "Vercel AI SDK"],
        title: "Vercel AI SDK adapter",
        badges: <Badge tone="primary">@cdr-kit/vercel-ai</Badge>,
        lede: <>Returns a <code>ToolSet</code> for <code>generateText</code> / <code>streamText</code>. The model autonomously picks the three CDR tools and drives the loop.</>,
        importLine: 'import { getVercelAITools } from "@cdr-kit/vercel-ai"',
        sections: [{ id: "usage", title: "Usage", content: <CodePanel title="agent.ts" code={CODE} /> }],
        prev: { href: "/docs/agent-kit", label: "CdrAgent" },
        next: { href: "/docs/agent-kit/openai", label: "OpenAI / Anthropic" },
      }}
    />
  );
}
