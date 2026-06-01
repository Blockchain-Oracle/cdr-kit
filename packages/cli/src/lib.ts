/**
 * Library entry — pure exports, no side effects on import. Re-exports the helpers that other
 * cdr-kit packages (`@cdr-kit/mcp`, future SDK consumers) compose with.
 *
 * The bin (`cdr` command) lives in src/index.ts so importing this module does NOT trigger
 * CLI argv parsing.
 */
export { createMcpServer } from "./server.js";
export { createCli } from "./cli.js";
export {
  loadOrCreateWallet,
  walletPath,
  type WalletFile,
  type WalletSource,
  type LoadedWallet,
} from "./lib/wallet.js";
export { resolveNetwork, type ResolvedNetwork } from "./lib/network.js";
export { ok, err, setJsonMode, isJsonMode } from "./lib/output.js";
export { log } from "./lib/logger.js";
