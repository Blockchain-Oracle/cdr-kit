import { createTool, type ToolBase } from "@goat-sdk/core";
import type { CdrAgent } from "@cdr-kit/agent";
import { createCdrTools } from "@cdr-kit/tools";

// GOAT 0.5's createTool types `parameters` against a different zod major than @cdr-kit/tools (zod 3).
// The schemas are runtime-compatible (.parse works), so we hand createTool a loosely-typed config.
// Validation still runs inside each tool's own invoke().
type CreateTool = (
  config: { name: string; description: string; parameters: unknown },
  execute: (args: unknown) => unknown,
) => ToolBase;
const make = createTool as unknown as CreateTool;

/**
 * Adapt CDR tools to GOAT `ToolBase[]`. GOAT's `createTool` does NOT validate input, so each
 * tool's own `invoke` parses with its Zod schema (parity with the other adapters).
 */
export function getGoatTools(agent: CdrAgent): ToolBase[] {
  return createCdrTools(agent).map((t) =>
    make({ name: t.name, description: t.description, parameters: t.inputSchema }, (args) => t.invoke(args)),
  );
}
