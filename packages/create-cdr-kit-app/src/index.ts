import { mkdirSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getTemplate, listTemplates, type TemplateName } from "./templates/index.js";

const KNOWN_TEMPLATES: TemplateName[] = [
  "starter",
  "blog",
  "paywall",
  "mcp-server",
  "agent-vercel-ai",
  "agent-openai",
  "agent-langchain",
  "agent-agentkit",
  "agent-goat",
];

export interface ScaffoldOpts {
  /** Template to scaffold. Default: "starter". */
  template?: TemplateName;
}

/** Write a template tree into `target`. Throws if `target` already exists. */
export function scaffold(target: string, opts: ScaffoldOpts = {}): void {
  if (existsSync(target)) throw new Error(`refusing to overwrite existing path: ${target}`);
  const tpl = getTemplate(opts.template ?? "starter");
  for (const f of tpl.files) {
    const abs = join(target, f.path);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, f.content);
    if (f.executable) chmodSync(abs, 0o755);
  }
}

function parseArgs(argv: string[]): { target?: string; template: TemplateName; help: boolean } {
  let target: string | undefined;
  let template: TemplateName = "starter";
  let help = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? "";
    if (a === "--help" || a === "-h") help = true;
    else if (a === "--template" || a === "-t") {
      const v = argv[++i];
      if (!v || !(KNOWN_TEMPLATES as string[]).includes(v)) throw new Error(`unknown template: ${v ?? ""}`);
      template = v as TemplateName;
    } else if (!target && !a.startsWith("-")) target = a;
  }
  return { target, template, help };
}

function printHelp(): void {
  process.stdout.write("usage: create-cdr-kit-app <dir> [--template starter|blog]\n\ntemplates:\n");
  for (const t of listTemplates()) process.stdout.write(`  ${t.name.padEnd(8)}  ${t.description}\n`);
}

// CLI entry (skipped when imported, e.g. by tests).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const { target, template, help } = parseArgs(process.argv.slice(2));
    if (help || !target) {
      printHelp();
      process.exit(help ? 0 : 1);
    }
    scaffold(target, { template });
    const tpl = getTemplate(template);
    process.stdout.write(`✓ scaffolded ${template} template at ${target}\n  cd ${target}\n  ${tpl.postInstall.join("\n  ")}\n`);
  } catch (e) {
    process.stderr.write(`error: ${(e as Error).message}\n`);
    process.exit(1);
  }
}
