import pino, { type Logger } from "pino";

/** Single shared logger pinned to stderr — stdout is reserved for JSON-RPC (MCP) or pretty CLI output. */
export const log: Logger = pino(
  { name: "cdr-cli", level: process.env.LOG_LEVEL ?? "info" },
  process.stderr,
);
