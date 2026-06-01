/**
 * Bin entry for the `cdr` command. Kept separate from src/index.ts so library importers
 * (like @cdr-kit/mcp) don't accidentally trigger CLI parsing on import.
 *
 * Errors are routed through `friendlyError()` (insufficient-funds → fund hint, EACCES → key
 * override hint, etc.) and respect `--json` so machine consumers always get parseable output.
 */
import { createCli } from "./cli.js";
import { friendlyError } from "./lib/output.js";

const program = createCli();
program.parseAsync(process.argv).catch((e: unknown) => {
  const message = friendlyError(e);
  // Detect --json from argv directly (output.ts state may not be set if parsing failed early).
  const jsonMode = process.argv.includes("--json");
  if (jsonMode) process.stdout.write(JSON.stringify({ error: message }) + "\n");
  else process.stderr.write(`error: ${message}\n`);
  process.exit(1);
});
