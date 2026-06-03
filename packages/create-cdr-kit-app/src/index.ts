import { mkdirSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getTemplate, listTemplates, type TemplateName } from "./templates/index.js";

const KNOWN_TEMPLATES: TemplateName[] = [
  "starter",
  "blog",
  "paywall",
  "data-marketplace",
  "forms",
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
  process.stdout.write("usage: create-cdr-kit-app <dir> [--template <name>]\n\ntemplates:\n");
  for (const t of listTemplates()) process.stdout.write(`  ${t.name.padEnd(20)}  ${t.description}\n`);
}

// CLI entry — fires when invoked as a binary (npx, pnpm dlx, ./dist/index.mjs, etc.).
// We can't strictly compare `process.argv[1] === fileURLToPath(import.meta.url)` because npm/npx
// route through a wrapper script, making argv[1] the wrapper path. Instead detect "is this the
// entrypoint?" by checking whether argv[1] is a sibling/parent of THIS module file. Skip when
// imported via require/import (e.g. tests do `import { scaffold } from '../src/index.js'`).
const _isCli = (() => {
  try {
    const here = fileURLToPath(import.meta.url);
    const entry = process.argv[1] ?? "";
    if (!entry) return false;
    // Exact path match (covers direct node invocation)
    if (entry === here) return true;
    // Wrapper match: bin scripts share a basename ("create-cdr-kit-app") with no extension
    const entryBase = entry.split("/").pop() ?? "";
    if (entryBase === "create-cdr-kit-app" || entryBase === "create-cdr-kit-app.js") return true;
    return false;
  } catch {
    return false;
  }
})();

if (_isCli) {
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
