import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const CODE = `import { CdrAgent } from "@cdr-kit/agent";
import { cdrPlugin } from "@cdr-kit/goat";

const agent = new CdrAgent({ privateKey, apiUrl });
const plugin = cdrPlugin(agent); // pass into GOAT's getOnChainTools`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit", "Agent kit", "GOAT SDK"],
        title: "GOAT SDK adapter",
        badges: <Badge tone="primary">@cdr-kit/goat</Badge>,
        lede: <>GOAT SDK plugin exposing the CDR tools to any GOAT-enabled agent stack.</>,
        importLine: 'import { cdrPlugin } from "@cdr-kit/goat"',
        sections: [{ id: "usage", title: "Usage", content: <CodePanel title="goat.ts" code={CODE} /> }],
        prev: { href: "/docs/agent-kit/agentkit", label: "Coinbase AgentKit" },
        next: { href: "/docs/agent-kit/mcp", label: "MCP server" },
      }}
    />
  );
}
