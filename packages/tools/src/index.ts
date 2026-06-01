import { zodToJsonSchema } from "zod-to-json-schema";
import type { CdrAgent } from "@cdr-kit/agent";
import type { CdrTool } from "./types.js";
import { readTools } from "./tools-read.js";
import { introspectTools } from "./tools-introspect.js";
import { authorTools } from "./tools-author.js";
import { advancedConditionTools } from "./tools-advanced.js";
import { storyTools } from "./tools-story.js";

export type { CdrTool } from "./types.js";
export * from "./schemas.js";

/** Build the CDR tool set over an agent (its own wallet). Each tool validates its own input.
 *  Tools are split across `tools-*.ts` modules per category (read / introspect / author /
 *  advanced conditions / Story IP); `createCdrTools` just concats them so the public API
 *  stays one flat array. */
export function createCdrTools(agent: CdrAgent): CdrTool[] {
  return [
    ...readTools(agent),
    ...introspectTools(agent),
    ...authorTools(agent),
    ...advancedConditionTools(agent),
    ...storyTools(agent),
  ];
}

/** JSON Schema for a tool's input — feeds the OpenAI/Anthropic/MCP adapters. */
export function toJsonSchema(tool: CdrTool): Record<string, unknown> {
  return zodToJsonSchema(tool.inputSchema, { target: "openApi3" }) as Record<string, unknown>;
}
