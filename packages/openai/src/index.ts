import type { CdrAgent } from "@cdr-kit/agent";
import { createCdrTools, toJsonSchema } from "@cdr-kit/tools";

/** An OpenAI function-tool spec (also valid for Anthropic tool use via `input_schema`). */
export interface OpenAIFunctionTool {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export interface OpenAIToolset {
  tools: OpenAIFunctionTool[];
  /** Run a tool call by name with JSON args (string or object). Routes to the right CDR tool. */
  dispatch: (name: string, args: string | Record<string, unknown>) => Promise<unknown>;
}

/**
 * Adapt CDR tools to raw OpenAI / Anthropic tool-calling: pass `toolset.tools` to the API, then
 * call `toolset.dispatch(name, args)` for each tool_call the model returns. No framework dep.
 */
export function getOpenAITools(agent: CdrAgent): OpenAIToolset {
  const cdrTools = createCdrTools(agent);
  const byName = new Map(cdrTools.map((t) => [t.name, t] as const));
  const tools: OpenAIFunctionTool[] = cdrTools.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: toJsonSchema(t) },
  }));
  return {
    tools,
    dispatch: async (name, args) => {
      const t = byName.get(name);
      if (!t) throw new Error(`cdr-kit: unknown tool "${name}"`);
      return t.invoke(typeof args === "string" ? JSON.parse(args) : args);
    },
  };
}
