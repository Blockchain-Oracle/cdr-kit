import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CdrAgent } from "@cdr-kit/agent";
import { createCdrTools, type CdrTool } from "@cdr-kit/tools";
import { log } from "./lib/logger.js";

declare const __PKG_VERSION__: string;
const PKG_VERSION = __PKG_VERSION__;

export interface CreateMcpServerOptions {
  agent: CdrAgent;
  /** Override the registered tool set (default: all 13 from createCdrTools(agent)). */
  tools?: CdrTool[];
  /** Server name surfaced to MCP hosts (default: "cdr-kit"). */
  name?: string;
}

interface ToolResult {
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

/**
 * Build a wired MCP server: registers every CdrTool as an MCP tool with its Zod input schema +
 * a thin invoke wrapper that turns the JS return value into the MCP `{ content: [{ type: "text" }]}`
 * shape per spec (2025-11-25). Errors are caught and returned with `isError: true` so the agent
 * sees a typed failure instead of a transport-level disconnect.
 *
 * The host attaches transport (stdio for CLI, HTTP for the future remote case).
 */
export function createMcpServer(opts: CreateMcpServerOptions): McpServer {
  const tools = opts.tools ?? createCdrTools(opts.agent);
  const server = new McpServer({ name: opts.name ?? "cdr-kit", version: PKG_VERSION });

  // McpServer.registerTool is heavily generic over a ZodRawShape; the SDK's deep inference trips
  // TS "excessively deep" so we narrow through a loose signature. Validation still runs inside
  // each tool's own invoke() via Zod.
  const registerTool = server.registerTool.bind(server) as unknown as (
    name: string,
    config: { description: string; inputSchema: Record<string, unknown> },
    handler: (args: Record<string, unknown>) => Promise<ToolResult>,
  ) => void;

  for (const tool of tools) {
    registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema.shape },
      async (args) => {
        try {
          const result = await tool.invoke(args);
          return { content: [{ type: "text", text: stringify(result) }] };
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          log.error({ tool: tool.name, err: message }, "tool invocation failed");
          return {
            content: [{ type: "text", text: `Error: ${message}` }],
            isError: true,
          };
        }
      },
    );
  }

  log.info({ tools: tools.length, wallet: opts.agent.address, network: opts.agent.network }, "mcp server ready");
  return server;
}

/** JSON stringify with bigint coercion — every CdrTool can return bigints from contract reads. */
function stringify(value: unknown): string {
  return JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v));
}
