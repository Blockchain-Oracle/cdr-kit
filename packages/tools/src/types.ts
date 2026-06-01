import type { z } from "zod";

/**
 * A framework-agnostic CDR tool. This shape is the single source of truth: the MCP server and
 * every framework adapter (Vercel AI / LangChain / OpenAI / AgentKit / GOAT) map from it.
 * Descriptions are written FOR THE MODEL — they're how an LLM decides whether/how to call us.
 */
export interface CdrTool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  invoke: (input: unknown) => Promise<unknown>;
}
