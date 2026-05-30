import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";

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
        sections: [{ id: "usage", title: "Usage", content: <div className="win doc-code"><div className="win-bar"><span className="lights"><i /><i /><i /></span><span className="win-title">goat.ts</span></div><div className="code"><pre><code>{CODE}</code></pre></div></div> }],
        prev: { href: "/docs/agent-kit/agentkit", label: "Coinbase AgentKit" },
        next: { href: "/docs/agent-kit/mcp", label: "MCP server" },
      }}
    />
  );
}
