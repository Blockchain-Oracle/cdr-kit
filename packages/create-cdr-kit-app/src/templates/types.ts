export type TemplateName =
  | "starter"
  | "blog"
  | "paywall"
  | "mcp-server"
  | "agent-vercel-ai"
  | "agent-openai"
  | "agent-langchain"
  | "agent-agentkit"
  | "agent-goat";

export interface TemplateFile {
  path: string;
  content: string;
  /** When true, mark as executable (rare; reserved for shell scripts). */
  executable?: boolean;
}

export interface Template {
  name: TemplateName;
  description: string;
  files: TemplateFile[];
  postInstall: string[];
}

/** The `@cdr-kit/*` peer-dep version templates ship with. Bumped per release. */
export const CDR_VERSION = "^0.3.0";
