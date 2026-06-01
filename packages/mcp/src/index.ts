/**
 * Stdio MCP server entry point. A thin wrapper around `@cdr-kit/cli`'s `createMcpServer` so that
 * `npx @cdr-kit/mcp` Just Works in any MCP host (Claude Desktop, Cursor, Windsurf).
 *
 * MCP hosts call this bin with stdin/stdout wired to the JSON-RPC transport; all logs flow to
 * stderr (the `pino` instance + first-run wallet banner inside @cdr-kit/cli are stderr-only).
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CdrAgent } from "@cdr-kit/agent";
import { createMcpServer, loadOrCreateWallet, resolveNetwork } from "@cdr-kit/cli";

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
