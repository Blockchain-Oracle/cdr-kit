import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const INSTALL = "$ npm install -g @cdr-kit/mcp";
const JSON_CONFIG = `{
  "mcpServers": {
    "cdr-kit": {
      "command": "cdr-kit-mcp",
      "env": {
        "PRIVATE_KEY": "0x…",
        "STORY_API_URL": "https://…"
      }
    }
  }
}`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit", "Agent kit", "MCP server"],
        title: "MCP server",
        badges: <Badge tone="primary">@cdr-kit/mcp</Badge>,
        lede: <>One binary that plugs into Claude Desktop, Cursor, Windsurf, and OpenClaw. Exposes the three CDR tools — <code>cdr_discover_vaults</code>, <code>cdr_subscribe_and_access</code>, <code>cdr_access_vault</code> — over stdio.</>,
        sections: [
          {
            id: "install",
            title: "Install",
            content: <CodePanel title="terminal" code={INSTALL} />,
          },
          {
            id: "claude-desktop",
            title: "Claude Desktop / Cursor / Windsurf",
            content: (
              <>
                <p>
                  Paste this block into your host&apos;s MCP config (Claude Desktop:{" "}
                  <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>; Cursor:{" "}
                  <code>~/.cursor/mcp.json</code>; Windsurf: <code>~/.codeium/windsurf/mcp_config.json</code>).
                </p>
                <CodePanel title="mcp_config.json" code={JSON_CONFIG} />
              </>
            ),
          },
          {
            id: "tools",
            title: "Tools exposed",
            content: (
              <ul>
                <li><code>cdr_discover_vaults</code> — scan the factory for vaults (optional <code>fromBlock</code>).</li>
                <li><code>cdr_subscribe_and_access</code> — pay from the agent&apos;s wallet, then read.</li>
                <li><code>cdr_access_vault</code> — read a vault the agent is already entitled to.</li>
              </ul>
            ),
          },
        ],
        prev: { href: "/docs/agent-kit/goat", label: "GOAT SDK" },
        next: { href: "/docs/contracts", label: "Condition library" },
      }}
    />
  );
}
