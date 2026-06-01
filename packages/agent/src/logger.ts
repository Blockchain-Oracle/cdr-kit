import pino, { type Logger } from "pino";

/** Pino logger pinned to stderr — MCP stdio framing requires stdout to be JSON-RPC only.
 *  Shared by agent.ts + the helper modules so we keep one logger instance per process. */
export const log: Logger = pino(
  { name: "cdr-agent", level: process.env.LOG_LEVEL ?? "info" },
  process.stderr,
);
