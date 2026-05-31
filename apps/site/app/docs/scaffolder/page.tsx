import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit", "Scaffolder"],
        title: "npm create cdr-kit",
        badges: <Badge tone="primary">create-cdr-kit-app</Badge>,
        lede: <>The fastest way to start. <code>npm create cdr-kit</code> bootstraps a working consumer app from one of the canonical templates — pick framework, agent stack, and starter pattern in a Next-style interactive flow.</>,
        sections: [
          {
            id: "invoke",
            title: "Invoke",
            content: (
              <CodePanel title="terminal" code={`$ npm create cdr-kit          # or
$ pnpm create cdr-kit
$ bun create cdr-kit
$ yarn create cdr-kit`} />
            ),
          },
          {
            id: "templates",
            title: "Templates",
            content: (
              <ul>
                <li><b>data-marketplace</b> — paywalled-data Next.js app with the dashboard pattern.</li>
                <li><b>paywall</b> — single page gated by a Subscription condition.</li>
                <li><b>mcp-quickstart</b> — Node MCP server + Claude Desktop config.</li>
                <li><b>autonomous-agent</b> — LLM agent (Vercel AI SDK) that discovers + subscribes + decides.</li>
              </ul>
            ),
          },
        ],
        prev: { href: "/docs/contracts/cdr-kit-vault", label: "CdrKitVault" },
      }}
    />
  );
}
