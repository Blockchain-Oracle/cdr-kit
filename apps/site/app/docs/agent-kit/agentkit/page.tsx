import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const CODE = `import { CdrAgent } from "@cdr-kit/agent";
import { cdrActionProvider } from "@cdr-kit/agentkit";

const agent = new CdrAgent({ privateKey, apiUrl });
// Slot into Coinbase AgentKit's action providers:
const provider = cdrActionProvider(agent);`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit", "Agent kit", "Coinbase AgentKit"],
        title: "Coinbase AgentKit adapter",
        badges: <Badge tone="primary">@cdr-kit/agentkit</Badge>,
        lede: <>Coinbase AgentKit <code>ActionProvider</code> exposing the three CDR tools as on-chain actions.</>,
        importLine: 'import { cdrActionProvider } from "@cdr-kit/agentkit"',
        sections: [{ id: "usage", title: "Usage", content: <CodePanel title="agentkit.ts" code={CODE} /> }],
        prev: { href: "/docs/agent-kit/langchain", label: "LangChain" },
        next: { href: "/docs/agent-kit/goat", label: "GOAT SDK" },
      }}
    />
  );
}
