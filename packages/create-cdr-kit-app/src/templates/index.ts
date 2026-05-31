import type { Template, TemplateName } from "./types.js";
import { STARTER } from "./starter.js";
import { BLOG } from "./blog.js";
import { PAYWALL } from "./paywall.js";
import { MCP_SERVER } from "./mcp-server.js";
import { AGENT_VERCEL_AI, AGENT_OPENAI, AGENT_LANGCHAIN, AGENT_AGENTKIT, AGENT_GOAT } from "./agents.js";

export type { Template, TemplateFile, TemplateName } from "./types.js";

const TEMPLATES: Record<TemplateName, Template> = {
  starter: STARTER,
  blog: BLOG,
  paywall: PAYWALL,
  "mcp-server": MCP_SERVER,
  "agent-vercel-ai": AGENT_VERCEL_AI,
  "agent-openai": AGENT_OPENAI,
  "agent-langchain": AGENT_LANGCHAIN,
  "agent-agentkit": AGENT_AGENTKIT,
  "agent-goat": AGENT_GOAT,
};

export function getTemplate(name: TemplateName): Template {
  const t = TEMPLATES[name];
  if (!t) throw new Error(`unknown template: ${name}`);
  return t;
}

export function listTemplates(): { name: TemplateName; description: string }[] {
  return Object.values(TEMPLATES).map((t) => ({ name: t.name, description: t.description }));
}
