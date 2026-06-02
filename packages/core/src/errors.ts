import {
  BaseError,
  ContractFunctionRevertedError,
  type WalletClient,
  type WriteContractParameters,
  type Hex,
} from "viem";

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
  /// New in 0.4.0 — map every @piplabs/cdr-sdk SDK error code into our taxonomy.
  | "LABEL_MISMATCH"
  | "CID_INTEGRITY"
  | "INVALID_CONDITION_CONTRACT"
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
  labelMismatch: (cause?: unknown) =>
    new CdrError("LABEL_MISMATCH", "ciphertext label does not match the vault uuid", {
      suggestedAction:
        "regenerate the ciphertext with the correct uuidToLabel(uuid) — labels bind ciphertext to its vault",
      cause,
    }),
  cidIntegrity: (cause?: unknown) =>
    new CdrError("CID_INTEGRITY", "downloaded encrypted file does not match the vault's CID", {
      suggestedAction:
        "the IPFS gateway may have served a tampered or stale blob — retry against a different gateway",
      cause,
    }),
  invalidConditionContract: (address?: string, cause?: unknown) =>
    new CdrError(
      "INVALID_CONDITION_CONTRACT",
      address
        ? `condition contract ${address} does not implement checkReadCondition/checkWriteCondition`
        : "condition address does not implement the required interface",
      {
        suggestedAction:
          "verify the address points at a deployed condition contract (not an EOA — for owner-only use allocate() with skipConditionValidation: true)",
        cause,
      },
    ),
  unknown: (message: string, cause?: unknown) =>
    new CdrError("UNKNOWN", message, { cause }),
} as const;

/**
 * Translate a thrown error from `@piplabs/cdr-sdk` into a CdrError. The SDK throws typed classes
 * (`LabelMismatchError`, `CidIntegrityError`, `ContentSizeExceededError`, `PartialCollectionTimeoutError`,
 * `EmptyVaultError`, `WalletClientRequiredError`, `InvalidConditionContractError`, `InvalidParamsError`)
 * which expose a `.code` string. We branch on `.code` and re-wrap so consumers get our stable taxonomy.
 *
 * Pass any unknown thrown value — it returns the original `CdrError` if already typed, otherwise the
 * closest matching CdrError, or `CdrErrors.unknown(...)` as a last resort.
 */
export function mapSdkError(e: unknown): CdrError {
  if (CdrError.is(e)) return e;
  const err = e as { code?: string; message?: string; name?: string };
  const code = err?.code ?? err?.name;
  const message = err?.message ?? String(e);
  switch (code) {
    case "LABEL_MISMATCH":
    case "LabelMismatchError":
      return CdrErrors.labelMismatch(e);
    case "CID_INTEGRITY":
    case "CidIntegrityError":
      return CdrErrors.cidIntegrity(e);
    case "INVALID_CONDITION_CONTRACT":
    case "InvalidConditionContractError":
      return CdrErrors.invalidConditionContract(undefined, e);
    case "CONTENT_SIZE_EXCEEDED":
    case "ContentSizeExceededError":
      return CdrErrors.payloadTooLarge(0, 1024);
    case "WALLET_CLIENT_REQUIRED":
    case "WalletClientRequiredError":
      return CdrErrors.walletRequired();
    case "EMPTY_VAULT":
    case "EmptyVaultError":
      return CdrErrors.vaultNotFound(-1);
    case "PARTIAL_COLLECTION_TIMEOUT":
    case "PartialCollectionTimeoutError":
      return CdrErrors.readTimeout(120_000, e);
    case "INVALID_PARAMS":
    case "InvalidParamsError":
      return CdrErrors.unknown(`invalid parameters: ${message}`, e);
    default:
      return CdrErrors.unknown(message, e);
  }
}

/* ============================================================ */
/* Contract revert decoding — viem ABI custom errors             */
/* ============================================================ */

/**
 * Walk a viem error chain for a `ContractFunctionRevertedError` and format the matched custom
 * error from the contract's ABI as a short readable string. Returns `null` if no decoded revert
 * was found (caller should fall back to the original error message).
 *
 * Examples:
 *   "EpochChanged(expected=0n, current=1n)"
 *   "AlreadyDelivered()"
 *   "BadWindow()"
 *
 * Complement to `mapSdkError` — that handles `@piplabs/cdr-sdk` throws; this handles on-chain
 * reverts from any contract whose ABI was passed to the failing call (which all CDR condition
 * writes do via the generated ABIs in `@cdr-kit/contracts`).
 */
export function decodeContractRevert(err: unknown): string | null {
  if (!(err instanceof BaseError)) return null;
  const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
  if (!(revert instanceof ContractFunctionRevertedError)) return null;
  const data = revert.data;
  if (!data?.errorName) return revert.reason ?? null;
  const args = data.args ?? [];
  if (args.length === 0) return `${data.errorName}()`;
  return `${data.errorName}(${args.map(formatArg).join(", ")})`;
}

function formatArg(arg: unknown): string {
  if (typeof arg === "bigint") return `${arg.toString()}n`;
  if (typeof arg === "string") return arg;
  if (typeof arg === "number" || typeof arg === "boolean") return String(arg);
  if (Array.isArray(arg)) return `[${arg.map(formatArg).join(",")}]`;
  return JSON.stringify(arg, (_k, v) => (typeof v === "bigint" ? v.toString() + "n" : v));
}

/**
 * Wrapper around `walletClient.writeContract` that re-throws viem reverts with a decoded
 * message and the original error attached as `cause`. Used by core's `flows.ts` (createVault /
 * subscribeAndAccess) and agent's advanced/story helpers so CLI's `friendlyError()` AND MCP's
 * auto error envelope both surface readable contract reverts for free.
 */
export async function writeWithDecode(
  wc: WalletClient,
  params: WriteContractParameters,
): Promise<Hex> {
  try {
    return (await wc.writeContract(params)) as Hex;
  } catch (e) {
    const decoded = decodeContractRevert(e);
    if (decoded) {
      const wrapped = new Error(decoded);
      (wrapped as Error & { cause?: unknown }).cause = e;
      throw wrapped;
    }
    throw e;
  }
}
