import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit", "Scaffolder"],
        title: "npm create cdr-kit",
        badges: <><Badge tone="primary">create-cdr-kit-app</Badge><Badge>9 templates · 0.3</Badge></>,
        lede: <>One command per pattern. Pick a template and you have a working consumer app — paywalled blog, single-page Subscribe, stdio MCP server, or any of five agent-framework wirings — running locally in under a minute. Mock CDR out of the box; swap one provider to go live on Aeneid.</>,
        sections: [
          {
            id: "invoke",
            title: "Invoke",
            content: (
              <CodePanel title="terminal" language="bash" code={`# default = starter (Node mock-flow)
$ npm create cdr-kit my-app

# any other template via --template
$ npm create cdr-kit my-blog -- --template blog
$ npm create cdr-kit my-paywall -- --template paywall
$ npm create cdr-kit my-mcp -- --template mcp-server`} />
            ),
          },
          {
            id: "ui",
            title: "UI templates",
            content: (
              <>
                <p><b>blog</b> — Next.js 16 + React 19 + <code>@cdr-kit/react-ui</code>. Three inline <code>&lt;UnlockablePill&gt;</code>s on a real-looking blog post. The onscroll.app pattern. <i>Recommended first.</i></p>
                <p><b>paywall</b> — Next.js single-page <code>&lt;SubscribeButton&gt;</code> gating a whole content block. Classic Substack/Patreon pattern.</p>
              </>
            ),
          },
          {
            id: "mcp",
            title: "MCP server template",
            content: (
              <>
                <p><b>mcp-server</b> — stdio Model Context Protocol server. Exposes <code>cdr_discover_vaults</code>, <code>cdr_subscribe_and_access</code>, <code>cdr_access_vault</code> to any MCP host (Claude Desktop, Cursor, Windsurf). The agent pays from its own wallet — the LLM never sees the key.</p>
                <p>Ships with a ready-to-paste <code>claude_desktop_config.json</code>.</p>
              </>
            ),
          },
          {
            id: "agents",
            title: "Agent templates (one per framework)",
            content: (
              <>
                <p>Each template instantiates <code>new CdrAgent({"{"} privateKey, apiUrl {"}"})</code> and wires CDR tools into the named framework. Pick the one your stack uses; the rest of your agent logic stays untouched.</p>
                <p><b>agent-vercel-ai</b> — Vercel AI SDK chatbot using <code>getVercelAITools(agent)</code> with <code>generateText</code>.</p>
                <p><b>agent-openai</b> — Raw OpenAI / Anthropic tool-calling loop using <code>getOpenAITools(agent).{"{"}tools, dispatch{"}"}</code>.</p>
                <p><b>agent-langchain</b> — LangChain ReAct agent via <code>createReactAgent({"{"}llm, tools: getLangChainTools(agent){"}"})</code>.</p>
                <p><b>agent-agentkit</b> — Coinbase AgentKit action provider via <code>getCdrActionProvider(agent)</code>. Compose with your wallet provider.</p>
                <p><b>agent-goat</b> — GOAT SDK <code>ToolBase[]</code> via <code>getGoatTools(agent)</code>.</p>
              </>
            ),
          },
          {
            id: "starter",
            title: "starter template",
            content: (
              <>
                <p><b>starter</b> — Two-file Node TypeScript script that runs <code>createMockCdrKit()</code> + <code>accessVault()</code> end-to-end. Good for verifying the kit works in your env or for backend-only CDR work.</p>
                <CodePanel title="tree" language="bash" code={`my-app/
├── src/index.ts          # mock CDR end-to-end in ~10 lines
├── package.json          # @cdr-kit/core@^0.3.0 + consola
└── README.md`} />
              </>
            ),
          },
        ],
        prev: { href: "/docs/contracts/cdr-kit-vault", label: "CdrKitVault" },
      }}
    />
  );
}
