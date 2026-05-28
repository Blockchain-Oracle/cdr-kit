import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CdrAgent } from "@cdr-kit/agent";
import { createCdrTools } from "@cdr-kit/tools";
import type { Hex } from "viem";

// NB: on stdio transport, stdout is reserved for JSON-RPC — all logs MUST go to stderr.
const log = (msg: string) => process.stderr.write(`[cdr-kit-mcp] ${msg}\n`);

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex | undefined;
const API_URL = process.env.CDR_API_URL ?? "http://172.192.41.96:1317";
const RPC_URL = process.env.AENEID_RPC;

if (!PRIVATE_KEY) {
  log("PRIVATE_KEY env var is required (the agent's wallet, testnet)");
  process.exit(1);
}

const agent = new CdrAgent({ privateKey: PRIVATE_KEY, apiUrl: API_URL, rpcUrl: RPC_URL });
const tools = createCdrTools(agent);
const server = new McpServer({ name: "cdr-kit", version: "0.1.0" });

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };
// The SDK's generic registerTool over a ZodRawShape trips TS "excessively deep" inference;
// bind it through a loose signature (we validate inputs inside each tool's invoke anyway).
const registerTool = server.registerTool.bind(server) as unknown as (
  name: string,
  config: { description: string; inputSchema: Record<string, unknown> },
  handler: (args: Record<string, unknown>) => Promise<ToolResult>,
) => void;

for (const tool of tools) {
  registerTool(tool.name, { description: tool.description, inputSchema: tool.inputSchema.shape }, async (args) => {
    try {
      const result = await tool.invoke(args);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
    }
  });
}

await server.connect(new StdioServerTransport());
log(`running on stdio — ${tools.length} tools, wallet ${agent.address}`);
