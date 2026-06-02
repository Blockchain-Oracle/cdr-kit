export * from "./agent";
// Re-export the contract-revert decoder helpers from @cdr-kit/core so consumers (CLI, MCP)
// can import them straight off @cdr-kit/agent without adding @cdr-kit/core to their deps.
export { decodeContractRevert, writeWithDecode } from "@cdr-kit/core";
