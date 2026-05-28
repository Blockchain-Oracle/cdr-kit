/** Stable, branchable error codes for every cdr-kit failure mode. */
export type CdrErrorCode =
  | "WASM_NOT_INITIALIZED"
  | "WALLET_REQUIRED"
  | "WRONG_NETWORK"
  | "CONDITION_NOT_MET"
  | "VAULT_NOT_FOUND"
  | "PAYLOAD_TOO_LARGE"
  | "OUT_OF_GAS"
  | "READ_TIMEOUT"
  | "KEEPER_UNAVAILABLE"
  | "RATE_LIMITED"
  | "UNKNOWN";

export interface CdrErrorOptions {
  /** Whether the caller can recover by retrying / taking an action (vs a hard programming error). */
  recoverable?: boolean;
  /** Human/agent-actionable hint, surfaced in UIs and to LLM agents. */
  suggestedAction?: string;
  cause?: unknown;
}

/**
 * The single error type for cdr-kit. UIs branch on `code`/`recoverable`; agents read
 * `suggestedAction`. Never throw bare `Error` from library code — wrap in a CdrError.
 */
export class CdrError extends Error {
  readonly code: CdrErrorCode;
  readonly recoverable: boolean;
  readonly suggestedAction?: string;

  constructor(code: CdrErrorCode, message: string, opts: CdrErrorOptions = {}) {
    super(message, { cause: opts.cause });
    this.name = "CdrError";
    this.code = code;
    this.recoverable = opts.recoverable ?? false;
    this.suggestedAction = opts.suggestedAction;
  }

  static is(e: unknown, code?: CdrErrorCode): e is CdrError {
    return e instanceof CdrError && (code === undefined || e.code === code);
  }
}

/** Factory helpers — one place for the canonical message + recoverability + suggested action. */
export const CdrErrors = {
  wasmNotInitialized: (cause?: unknown) =>
    new CdrError("WASM_NOT_INITIALIZED", "CDR crypto WASM is not initialized", {
      recoverable: true,
      suggestedAction: "await ensureWasm() (or use <CdrProvider>) before any encrypt/decrypt",
      cause,
    }),
  walletRequired: () =>
    new CdrError("WALLET_REQUIRED", "a walletClient with an account is required", {
      suggestedAction: "connect a wallet / pass a privateKey",
    }),
  wrongNetwork: (expected = 1315) =>
    new CdrError("WRONG_NETWORK", `wallet is on the wrong network (expected chain ${expected})`, {
      recoverable: true,
      suggestedAction: `switch to Story Aeneid (chain ${expected})`,
    }),
  conditionNotMet: (message = "access condition is not satisfied", cause?: unknown) =>
    new CdrError("CONDITION_NOT_MET", message, {
      recoverable: true,
      suggestedAction: "satisfy the condition (subscribe / mint the license tier), then retry",
      cause,
    }),
  vaultNotFound: (uuid: number) =>
    new CdrError("VAULT_NOT_FOUND", `vault ${uuid} not found or never written to`, {
      suggestedAction: "verify the uuid; the seller may not have written data yet",
    }),
  payloadTooLarge: (size: number, max: number) =>
    new CdrError("PAYLOAD_TOO_LARGE", `payload ${size}B exceeds the inline cap (${max}B)`, {
      recoverable: true,
      suggestedAction: "use the file path (uploadFile/downloadFile) — it stores the body off-chain",
    }),
  outOfGas: (cause?: unknown) =>
    new CdrError("OUT_OF_GAS", "a CDR precompile call ran out of gas", {
      recoverable: true,
      suggestedAction: "set an explicit gas limit (the SDK does this for createVault)",
      cause,
    }),
  readTimeout: (ms: number, cause?: unknown) =>
    new CdrError("READ_TIMEOUT", `partial collection timed out after ${ms}ms`, {
      recoverable: true,
      suggestedAction: "retry the read; the keeper/validators may be slow",
      cause,
    }),
  keeperUnavailable: (cause?: unknown) =>
    new CdrError("KEEPER_UNAVAILABLE", "the Story-API keeper is unreachable", {
      recoverable: true,
      suggestedAction: "retry with backoff; verify apiUrl",
      cause,
    }),
  rateLimited: (retryAfterMs?: number) =>
    new CdrError("RATE_LIMITED", "rate limited by the keeper", {
      recoverable: true,
      suggestedAction: retryAfterMs ? `retry after ${retryAfterMs}ms` : "retry with backoff",
    }),
  unknown: (message: string, cause?: unknown) =>
    new CdrError("UNKNOWN", message, { cause }),
} as const;
