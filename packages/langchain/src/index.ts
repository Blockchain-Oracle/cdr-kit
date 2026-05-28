import { tool, type StructuredToolInterface } from "@langchain/core/tools";
import type { CdrAgent } from "@cdr-kit/agent";
import { createCdrTools } from "@cdr-kit/tools";

/** Adapt the CDR tools to LangChain StructuredTools: `createReactAgent({ tools: getLangChainTools(agent) })`. */
export function getLangChainTools(agent: CdrAgent): StructuredToolInterface[] {
  return createCdrTools(agent).map((t) =>
    tool(async (args: Record<string, unknown>) => JSON.stringify(await t.invoke(args)), {
      name: t.name,
      description: t.description,
      // LangChain's tool() is generic over the schema; we build from a runtime ZodObject and
      // validate inside invoke, so hand it a loose schema to avoid deep type inference.
      schema: t.inputSchema as unknown as Parameters<typeof tool>[1]["schema"],
    }),
  );
}
