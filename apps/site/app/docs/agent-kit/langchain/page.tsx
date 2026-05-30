import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";

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
        sections: [{ id: "usage", title: "Usage", content: <div className="win doc-code"><div className="win-bar"><span className="lights"><i /><i /><i /></span><span className="win-title">langchain-agent.ts</span></div><div className="code"><pre><code>{CODE}</code></pre></div></div> }],
        prev: { href: "/docs/agent-kit/openai", label: "OpenAI / Anthropic" },
        next: { href: "/docs/agent-kit/agentkit", label: "Coinbase AgentKit" },
      }}
    />
  );
}
