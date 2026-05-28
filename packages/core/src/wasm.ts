import { initWasm } from "@piplabs/cdr-crypto";

let ready: Promise<void> | undefined;

/**
 * Initialize the CDR crypto WASM module exactly once (idempotent, concurrency-safe).
 * The flow helpers call this automatically before any encrypt/decrypt, so consumers
 * normally never need it — but it's exported for advanced/manual use.
 */
export function ensureWasm(): Promise<void> {
  if (!ready) ready = initWasm().then(() => undefined);
  return ready;
}

export { initWasm };
