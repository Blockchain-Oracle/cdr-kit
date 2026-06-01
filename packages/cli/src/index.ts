/**
 * Bin entry for the `cdr` command. Kept separate from src/index.ts so library importers
 * (like @cdr-kit/mcp) don't accidentally trigger CLI parsing on import.
 */
import { createCli } from "./cli.js";

const program = createCli();
program.parseAsync(process.argv).catch((e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
});
