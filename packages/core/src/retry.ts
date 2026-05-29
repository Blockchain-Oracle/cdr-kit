import { CdrError, type CdrErrorCode } from "./errors.js";

export interface RetryOptions {
  /** Max total attempts (including the first). Default 3. */
  maxAttempts?: number;
  /** Base backoff in ms (attempt 1 → ~base, then ×factor). Default 400. */
  baseDelayMs?: number;
  /** Cap on a single backoff. Default 8000. */
  maxDelayMs?: number;
  /** Exponential factor. Default 2. */
  factor?: number;
  /** Add equal-jitter (±50%) to each delay. Default true. */
  jitter?: boolean;
  /** Override which errors retry. Default: transient keeper errors only (never on-chain/programmer errors). */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Observe each retry (logging/telemetry). */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
  /** Injectable sleep (tests). */
  sleep?: (ms: number) => Promise<void>;
}

const RETRYABLE: ReadonlySet<CdrErrorCode> = new Set(["KEEPER_UNAVAILABLE", "RATE_LIMITED", "READ_TIMEOUT"]);

/** Default policy: retry transient keeper/network failures, never on-chain or programmer errors. */
export function defaultShouldRetry(error: unknown): boolean {
  if (CdrError.is(error)) return error.recoverable && RETRYABLE.has(error.code);
  // Bare network/transport errors (fetch failures, aborts) are transient.
  return error instanceof Error;
}

/**
 * Run `fn` with exponential backoff + jitter on transient failures. For keeper REST + storage HTTP +
 * read polling — NOT for on-chain txs (those are idempotent via nonce/AlreadyConfigured, and a retry
 * would re-pay fees). Honors a typed `RATE_LIMITED` by still backing off.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 400;
  const maxDelayMs = opts.maxDelayMs ?? 8000;
  const factor = opts.factor ?? 2;
  const jitter = opts.jitter ?? true;
  const shouldRetry = opts.shouldRetry ?? defaultShouldRetry;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  let attempt = 0;
  for (;;) {
    attempt++;
    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxAttempts || !shouldRetry(error, attempt)) throw error;
      const raw = Math.min(maxDelayMs, baseDelayMs * factor ** (attempt - 1));
      const delay = jitter ? raw / 2 + Math.random() * (raw / 2) : raw;
      opts.onRetry?.(error, attempt, delay);
      await sleep(delay);
    }
  }
}
