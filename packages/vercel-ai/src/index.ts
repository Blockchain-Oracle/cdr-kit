import { tool, type ToolSet } from "ai";
import type { CdrAgent } from "@cdr-kit/agent";
import { createCdrTools } from "@cdr-kit/tools";

/** Adapt the CDR tools to a Vercel AI SDK tool set: `generateText({ tools: getVercelAITools(agent) })`. */
export function getVercelAITools(agent: CdrAgent): ToolSet {
  const tools: ToolSet = {};
  for (const t of createCdrTools(agent)) {
    // `tool()` is heavily generic over inputSchema; we build it from a runtime-typed ZodObject and
    // validate inside `invoke`, so we hand it a loose config to avoid the SDK's deep type inference.
    const config = {
      description: t.description,
      inputSchema: t.inputSchema,
      execute: async (args: Record<string, unknown>) => t.invoke(args),
    } as unknown as Parameters<typeof tool>[0];
    tools[t.name] = tool(config);
  }
  return tools;
}
