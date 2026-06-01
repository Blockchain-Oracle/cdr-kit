/**
 * Stdio MCP server entry point. A thin wrapper around `@cdr-kit/cli`'s `createMcpServer` so that
 * `npx @cdr-kit/mcp` Just Works in any MCP host (Claude Desktop, Cursor, Windsurf).
 *
 * MCP hosts call this bin with stdin/stdout wired to the JSON-RPC transport; all logs flow to
 * stderr (the `pino` instance + first-run wallet banner inside @cdr-kit/cli are stderr-only).
 *
 * `--help` / `--version` short-circuit BEFORE any wallet I/O, so version inspection doesn't
 * auto-generate a wallet on disk as a side effect.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CdrAgent } from "@cdr-kit/agent";
import { createMcpServer, loadOrCreateWallet, resolveNetwork } from "@cdr-kit/cli";

declare const __PKG_VERSION__: string;

const arg = process.argv[2];
if (arg === "--version" || arg === "-v") {
  process.stdout.write(`${__PKG_VERSION__}\n`);
  process.exit(0);
}
if (arg === "--help" || arg === "-h") {
  process.stderr.write(
    [
      `@cdr-kit/mcp v${__PKG_VERSION__} — stdio MCP server for Story Confidential Data Rails.`,
      "",
      "Usage:",
      "  cdr-kit-mcp                serve MCP over stdin/stdout (default)",
      "  cdr-kit-mcp --version|-v   print version and exit",
      "  cdr-kit-mcp --help|-h      print this help and exit",
      "",
      "Environment:",
      "  CDR_PRIVATE_KEY=0x...      wallet key (else ~/.config/cdr-kit/wallet.json is read or created)",
      "  CDR_NETWORK=aeneid|mainnet network selector (default: aeneid)",
      "  CDR_RPC_URL=https://...    override the chain RPC",
      "",
      "Hosts: Claude Desktop, Cursor, Windsurf — see @cdr-kit/cli docs for `claude mcp add` setup.",
      "",
    ].join("\n"),
  );
  process.exit(0);
}

try {
  const net = resolveNetwork(process.env.CDR_NETWORK);
  const w = loadOrCreateWallet({ network: net.network });
  const agent = new CdrAgent({
    privateKey: w.privateKey,
    rpcUrl: net.rpcUrl,
    apiUrl: net.apiUrl,
    network: net.network,
  });

  const server = createMcpServer({ agent });
  await server.connect(new StdioServerTransport());
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  process.stderr.write(`[cdr-kit-mcp] startup failed: ${message}\n`);
  process.exit(1);
}
