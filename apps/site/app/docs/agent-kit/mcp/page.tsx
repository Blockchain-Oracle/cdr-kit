import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const INSTALL = `# Recommended: get the CLI (gives you cdr + cdr mcp + cdr skill install)
$ npm install -g @cdr-kit/cli

# Alternative: just the MCP wrapper (used by claude mcp add)
$ npm install -g @cdr-kit/mcp`;

const ADD = `$ claude mcp add cdr-kit npx @cdr-kit/mcp`;

const JSON_CONFIG = `{
  "mcpServers": {
    "cdr-kit": {
      "command": "npx",
      "args": ["-y", "@cdr-kit/mcp"],
      "env": {
        "CDR_PRIVATE_KEY": "0x_your_aeneid_testnet_key_here",
        "CDR_NETWORK": "aeneid"
      }
    }
  }
}`;

const TOOLS_TABLE: { name: string; group: string; description: string }[] = [
  { name: "cdr_discover_vaults", group: "Discover + read", description: "Scan recent VaultCreated events; returns uuid, ipId, creator per vault." },
  { name: "cdr_subscribe_and_access", group: "Discover + read", description: "Pay the subscription, then read + decrypt — one composite call." },
  { name: "cdr_access_vault", group: "Discover + read", description: "Read + decrypt a vault the agent is already entitled to." },
  { name: "cdr_access_license_gated", group: "Discover + read", description: "Read a license-gated vault by presenting a Story license token the agent owns." },
  { name: "cdr_get_vault_info", group: "Introspection", description: "Resolve uuid → tokenId, ipId, creator, licenseTermsId. View-only." },
  { name: "cdr_creator_vaults", group: "Introspection", description: "List every vault a given creator has minted. View-only." },
  { name: "cdr_check_entitlement", group: "Introspection", description: "Is the agent (or any address) currently subscribed? Returns paidUntil + isEntitled. View-only." },
  { name: "cdr_estimate_cost", group: "Introspection", description: "Subscription plan: pricePerPeriod, period, payee, mode. View-only." },
  { name: "cdr_list_subscriptions", group: "Introspection", description: "Every vault the agent is currently subscribed to (active paidUntil)." },
  { name: "cdr_get_fees", group: "Introspection", description: "CDR allocate / write / read fees + operational threshold. View-only, no wallet needed." },
  { name: "cdr_create_vault", group: "Author / publish", description: "Mint NFT + register IP + allocate slot + configure read condition — one tx." },
  { name: "cdr_write_vault_data", group: "Author / publish", description: "Encrypt a small (<1KB) UTF-8 string and write it to a vault." },
  { name: "cdr_upload_file", group: "Author / publish", description: "Encrypt + IPFS-pin + allocate + write — for any >1KB payload." },
  // 0.5 advanced-condition vaults
  { name: "cdr_create_time_window_vault", group: "Advanced conditions (0.5)", description: "Create a Story CDR vault gated by an absolute time (or block) window." },
  { name: "cdr_create_dead_man_vault", group: "Advanced conditions (0.5)", description: "Create a dead-man-switch vault — auto-unlocks to heirs if the creator stops poke()-ing." },
  { name: "cdr_create_escrow_vault", group: "Advanced conditions (0.5)", description: "Create a buyer-pays-then-confirms-delivery escrow vault with optional arbiter." },
  { name: "cdr_create_multi_sig_vault", group: "Advanced conditions (0.5)", description: "Create an N-of-M multi-sig vault — both off-chain EIP-712 sigs AND on-chain approve() paths supported. First-of-kind in the CDR ecosystem." },
  { name: "cdr_approve_multi_sig", group: "Advanced conditions (0.5)", description: "Safe-style on-chain approval — agent calls approve(uuid). Dashboards read currentApprovalsCount(uuid)." },
  // 0.5 Story IP integration
  { name: "cdr_register_ip", group: "Story IP (0.5)", description: "Register an NFT as a Story IP asset (fresh-mint via SPG)." },
  { name: "cdr_attach_license_terms", group: "Story IP (0.5)", description: "Attach PIL license terms to a Story IP asset (required before minting license tokens)." },
  { name: "cdr_mint_license_token", group: "Story IP (0.5)", description: "Mint Story license tokens against an IP asset's licenseTermsId." },
  { name: "cdr_publish_data", group: "Story IP (0.5)", description: "Agent-as-publisher one-shot: register IP + attach commercial terms + create license-gated CDR vault + write encrypted secret. The highest-DX win for autonomous data sellers." },
];

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit", "Agent kit", "MCP server"],
        title: "MCP server",
        badges: <><Badge tone="primary">@cdr-kit/mcp</Badge><Badge>22 tools · v0.5</Badge></>,
        lede: <>One stdio binary that plugs into Claude Desktop, Cursor, Windsurf, and any MCP host. Exposes the full CDR surface — discover, subscribe, access, audit, publish, plus 4 advanced-condition vault creators and 4 Story IP wrappers (including the <code>cdr_publish_data</code> one-shot) — as <b>21 tools</b> backed by the agent&apos;s own auto-generated wallet. Shares code with <code>@cdr-kit/cli</code>, so anything the MCP can do, <code>cdr &lt;cmd&gt;</code> can do at the terminal.</>,
        sections: [
          {
            id: "install",
            title: "Install",
            content: <CodePanel title="terminal" language="bash" code={INSTALL} />,
          },
          {
            id: "add-to-claude",
            title: "Add to Claude Desktop (one command)",
            content: (
              <>
                <p>
                  If you have Claude Code installed, the cleanest path is:
                </p>
                <CodePanel title="terminal" language="bash" code={ADD} />
                <p>
                  This registers <code>npx @cdr-kit/mcp</code> as the <code>cdr-kit</code> server. The first run auto-generates a wallet at <code>~/.config/cdr-kit/wallet.json</code> (chmod 600) and prints the address + faucet URL to stderr. Fund it with <code>cdr fund</code> before calling write/subscribe tools.
                </p>
              </>
            ),
          },
          {
            id: "manual-config",
            title: "Manual config (Claude Desktop / Cursor / Windsurf)",
            content: (
              <>
                <p>
                  Paste this into your host&apos;s MCP config (Claude Desktop:{" "}
                  <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>; Cursor:{" "}
                  <code>~/.cursor/mcp.json</code>; Windsurf: <code>~/.codeium/windsurf/mcp_config.json</code>).
                </p>
                <CodePanel title="mcp config" language="json" code={JSON_CONFIG} />
                <p>
                  <code>CDR_PRIVATE_KEY</code> is optional — if omitted, the wallet is auto-generated and loaded from disk on every run.
                </p>
              </>
            ),
          },
          {
            id: "tools",
            title: "Tools (13)",
            content: (
              <>
                <p>
                  All tools come from a single source of truth in <code>@cdr-kit/tools</code>. Adapter packages (Vercel AI / OpenAI / LangChain / AgentKit / GOAT) iterate the same list, so every adapter gets all 13 automatically.
                </p>
                <table className="props">
                  <thead>
                    <tr><th>Tool</th><th>Group</th><th>Description</th></tr>
                  </thead>
                  <tbody>
                    {TOOLS_TABLE.map((t) => (
                      <tr key={t.name}>
                        <td><code>{t.name}</code></td>
                        <td>{t.group}</td>
                        <td>{t.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ),
          },
          {
            id: "env",
            title: "Env reference",
            content: (
              <table className="props">
                <thead><tr><th>Var</th><th>Default</th><th>Purpose</th></tr></thead>
                <tbody>
                  <tr><td><code>CDR_PRIVATE_KEY</code></td><td>(auto-generated)</td><td>Agent&apos;s wallet. Overrides the disk file at <code>~/.config/cdr-kit/wallet.json</code>.</td></tr>
                  <tr><td><code>CDR_NETWORK</code></td><td>aeneid</td><td>aeneid (default) or mainnet (throws — not yet deployed).</td></tr>
                  <tr><td><code>CDR_RPC_URL</code></td><td>network&apos;s canonical RPC</td><td>Override the JSON-RPC endpoint (use a paid RPC for production).</td></tr>
                  <tr><td><code>CDR_API_URL</code></td><td>network&apos;s canonical Story-API REST</td><td>Override the Story-API base URL.</td></tr>
                  <tr><td><code>LOG_LEVEL</code></td><td>info</td><td>pino level: trace, debug, info, warn, error.</td></tr>
                  <tr><td><code>PRIVATE_KEY</code></td><td>(deprecated)</td><td>Old name for <code>CDR_PRIVATE_KEY</code>. Still honored in 0.4 with a deprecation warning; removed in 0.5.</td></tr>
                </tbody>
              </table>
            ),
          },
        ],
        prev: { href: "/docs/agent-kit/goat", label: "GOAT SDK" },
        next: { href: "/docs/cli", label: "CLI: cdr" },
      }}
    />
  );
}
