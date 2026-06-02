/** `ok(data)` and `err(msg)` helpers. Pretty by default; raw JSON when `--json` is set. */
import { decodeContractRevert } from "@cdr-kit/agent";
import type { CdrAgent } from "@cdr-kit/agent";
import type { Hex } from "viem";

let jsonMode = false;
export function setJsonMode(on: boolean): void {
  jsonMode = on;
}
export function isJsonMode(): boolean {
  return jsonMode;
}

export function ok(data: unknown): void {
  if (jsonMode) process.stdout.write(JSON.stringify(data, replacer, 2) + "\n");
  else prettyPrint(data);
}

export function err(message: string, exitCode = 1): never {
  if (jsonMode) process.stdout.write(JSON.stringify({ error: message }) + "\n");
  else process.stderr.write(`error: ${message}\n`);
  process.exit(exitCode);
}

/** Note to stderr (does not interfere with --json stdout). Skipped in --json mode. */
export function note(message: string): void {
  if (!jsonMode) process.stderr.write(message + "\n");
}

/**
 * Rewrite a thrown error into a short, actionable message. Recognizes the failure
 * modes most likely to surface to a first-time agent user: insufficient funds, EACCES,
 * RPC unreachability, contract reverts the user can fix. Falls back to the raw message.
 */
export function friendlyError(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  // First: try to decode a viem ContractFunctionRevertedError into the contract's custom error
  // name + args ("EpochChanged(expected=0n, current=1n)" instead of "execution reverted").
  // The agent layer already wraps writeContract calls with this decoder, but viem errors thrown
  // by readContract / direct chain calls bubble up unwrapped — catch them here too.
  const decoded = decodeContractRevert(e);
  if (decoded) return `contract reverted: ${decoded}`;
  const raw = e.message;
  if (/insufficient funds/i.test(raw)) {
    return "wallet has insufficient IP for this tx. Fund it: `cdr fund` (faucet is captcha-gated)";
  }
  if (/EACCES/.test(raw) && /wallet\.json/.test(raw)) {
    return `${raw}\n  hint: set CDR_PRIVATE_KEY=0x... to bypass the wallet file, or chmod the parent directory`;
  }
  if (/ECONNREFUSED|ENOTFOUND|fetch failed/i.test(raw)) {
    return `network unreachable: ${raw}\n  hint: check CDR_RPC_URL or your internet connection`;
  }
  return raw;
}

/**
 * Wait for a tx receipt then print `{txHash, blockNumber, status, ...extra}`. Eliminates the
 * post-tx-read race that bit users chaining CLI commands (e.g. `cdr multi-sig rotate` immediately
 * followed by `cdr multi-sig approve` — the second call's read of `getConfig().epoch` could land
 * BEFORE the rotate tx's state was indexed by the RPC node).
 *
 * Default `confirmations: 1` is enough for Aeneid (fast finality). Pass `extra` to surface
 * command-specific hints alongside the receipt info (e.g. "read uuid from VaultCreated").
 */
export async function okTx(
  agent: CdrAgent,
  txHash: Hex,
  extra: Record<string, unknown> = {},
  opts: { confirmations?: number } = {},
): Promise<void> {
  const receipt = await agent.client.publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: opts.confirmations ?? 1,
  });
  ok({
    txHash,
    blockNumber: receipt.blockNumber.toString(),
    status: receipt.status,
    ...extra,
  });
}

function replacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  return value;
}

function prettyPrint(data: unknown): void {
  if (data === undefined || data === null) return;
  if (typeof data === "string") {
    process.stdout.write(data + "\n");
    return;
  }
  if (typeof data === "number" || typeof data === "boolean" || typeof data === "bigint") {
    process.stdout.write(String(data) + "\n");
    return;
  }
  process.stdout.write(JSON.stringify(data, replacer, 2) + "\n");
}
