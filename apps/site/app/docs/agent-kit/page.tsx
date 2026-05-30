import Link from "next/link";
import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";

const CODE = `import { CdrAgent } from "@cdr-kit/agent";

const agent = new CdrAgent({
  privateKey: process.env.PRIVATE_KEY,
  apiUrl: process.env.CDR_API_URL,
});

const vaults = await agent.discover();
const bytes = await agent.subscribeAndAccess({
  uuid: vaults[0].uuid,
  periods: 1n,
  maxPricePerPeriod: 5n * 10n ** 18n,
  value: 5n * 10n ** 18n,
});`;

export default function AgentKitPage() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit", "Agent kit"],
        title: "CdrAgent",
        badges: <Badge tone="primary">@cdr-kit/agent</Badge>,
        lede: <>Autonomous agent client: discover vaults on the factory, subscribe from its own wallet, decrypt, and use the data — no human in the loop. The headless object every framework adapter wraps.</>,
        importLine: 'import { CdrAgent } from "@cdr-kit/agent"',
        sections: [
          {
            id: "usage",
            title: "Usage",
            content: <div className="win doc-code"><div className="win-bar"><span className="lights"><i /><i /><i /></span><span className="win-title">agent-demo.ts</span></div><div className="code"><pre><code>{CODE}</code></pre></div></div>,
          },
          {
            id: "adapters",
            title: "Framework adapters",
            content: (
              <ul>
                <li><Link href="/docs/agent-kit/vercel-ai"><code>@cdr-kit/vercel-ai</code></Link> — <code>generateText</code> tools</li>
                <li><Link href="/docs/agent-kit/openai"><code>@cdr-kit/openai</code></Link> — OpenAI / Anthropic JSON-schema tools</li>
                <li><Link href="/docs/agent-kit/langchain"><code>@cdr-kit/langchain</code></Link> — <code>StructuredTool</code>s</li>
                <li><Link href="/docs/agent-kit/agentkit"><code>@cdr-kit/agentkit</code></Link> — Coinbase AgentKit <code>ActionProvider</code></li>
                <li><Link href="/docs/agent-kit/goat"><code>@cdr-kit/goat</code></Link> — GOAT SDK plugin</li>
                <li><Link href="/docs/agent-kit/mcp"><code>@cdr-kit/mcp</code></Link> — MCP server</li>
              </ul>
            ),
          },
        ],
        prev: { href: "/docs/hooks/use-cdr-wallet", label: "useCdrWallet" },
        next: { href: "/docs/agent-kit/vercel-ai", label: "Vercel AI SDK" },
      }}
    />
  );
}
