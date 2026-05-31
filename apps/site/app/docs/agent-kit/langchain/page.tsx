import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const CODE = `import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { CdrAgent } from "@cdr-kit/agent";
import { getLangChainTools } from "@cdr-kit/langchain";

const cdr = new CdrAgent({ privateKey, apiUrl });
const agent = createReactAgent({
  llm: new ChatOpenAI({ model: "gpt-4o" }),
  tools: getLangChainTools(cdr),
});
const res = await agent.invoke({ messages: [{ role: "user", content: "Read vault 4200." }] });`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit", "Agent kit", "LangChain"],
        title: "LangChain adapter",
        badges: <Badge tone="primary">@cdr-kit/langchain</Badge>,
        lede: <>Returns LangChain <code>StructuredToolInterface[]</code> — drop into <code>createReactAgent</code> or any LangChain agent constructor.</>,
        importLine: 'import { getLangChainTools } from "@cdr-kit/langchain"',
        sections: [{ id: "usage", title: "Usage", content: <CodePanel title="langchain-agent.ts" code={CODE} /> }],
        prev: { href: "/docs/agent-kit/openai", label: "OpenAI / Anthropic" },
        next: { href: "/docs/agent-kit/agentkit", label: "Coinbase AgentKit" },
      }}
    />
  );
}
