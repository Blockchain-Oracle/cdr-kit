/**
 * Low-level CDR SDK surface. The {@link createVault} / {@link accessVault} / {@link uploadFile}
 * helpers in `flows.ts` and `files.ts` cover the common case; this module exposes the raw
 * `@piplabs/cdr-sdk` `uploader.*` and `consumer.*` methods for power users who need finer control
 * (custom allocation patterns, multi-step writes, manual partial collection, etc.).
 *
 * All these functions accept the `CdrKitClient` we own and route to the underlying SDK. Errors
 * pass through unmodified — wrap with your own try/catch + the `mapSdkError` helper in errors.ts
 * if you want typed CdrError-shaped failures.
 */
import type { Hex } from "viem";
import type { CdrKitClient } from "./client.js";
import { ensureWasm } from "./wasm.js";

/* ============================================================ */
/* Uploader (creator side)                                       */
/* ============================================================ */

/**
 * Allocate a fresh CDR vault. Returns `{ uuid, txHash }`. The uuid is a global counter — read
 * from the event in your receipt; don't predict it.
 */
export async function allocate(
  client: CdrKitClient,
  params: {
    updatable?: boolean;
    readConditionAddr: Hex;
    readConditionData?: Hex;
    writeConditionAddr: Hex;
    writeConditionData?: Hex;
    accessAuxData?: Hex;
    feeOverride?: bigint;
  },
): Promise<{ uuid: number; txHash: Hex }> {
  await ensureWasm();
  const res = (await client.cdr.uploader.allocate({
    updatable: params.updatable ?? false,
    readConditionAddr: params.readConditionAddr,
    readConditionData: params.readConditionData ?? "0x",
    writeConditionAddr: params.writeConditionAddr,
    writeConditionData: params.writeConditionData ?? "0x",
    accessAuxData: params.accessAuxData ?? "0x",
    feeOverride: params.feeOverride,
  } as never)) as { uuid: number; txHash: Hex };
  return res;
}

/** TDH2-encrypt a data key against the network DKG public key. Pure crypto — no chain calls. */
export async function encryptDataKey(
  client: CdrKitClient,
  params: { uuid: number; dataKey: Uint8Array; label?: Hex },
): Promise<{ ciphertext: Uint8Array; label: Hex }> {
  await ensureWasm();
  const res = (await client.cdr.uploader.encryptDataKey({
    uuid: params.uuid,
    dataKey: params.dataKey,
    label: params.label,
  } as never)) as unknown as { ciphertext: Uint8Array; label: Hex };
  return res;
}

/** Write a previously-encrypted ciphertext to a vault. Use after `allocate` + `encryptDataKey`. */
export async function write(
  client: CdrKitClient,
  params: { uuid: number; ciphertext: Uint8Array; accessAuxData?: Hex; feeOverride?: bigint },
): Promise<{ txHash: Hex }> {
  const res = (await client.cdr.uploader.write({
    uuid: params.uuid,
    ciphertext: params.ciphertext,
    accessAuxData: params.accessAuxData ?? "0x",
    feeOverride: params.feeOverride,
  } as never)) as { txHash: Hex };
  return res;
}

/* ============================================================ */
/* Consumer (reader side)                                        */
/* ============================================================ */

/** Collect `threshold`-many partial decryptions from network validators. */
export async function collectPartials(
  client: CdrKitClient,
  params: {
    uuid: number;
    accessAuxData?: Hex;
    timeoutMs?: number;
    attestationConfig?: unknown;
  },
): Promise<unknown> {
  await ensureWasm();
  return client.cdr.consumer.collectPartials({
    uuid: params.uuid,
    accessAuxData: params.accessAuxData ?? "0x",
    timeoutMs: params.timeoutMs ?? 120_000,
    attestationConfig: params.attestationConfig,
  } as never);
}

/** Combine collected partials into the recovered data key. */
export async function decryptDataKey(
  client: CdrKitClient,
  params: { uuid: number; partials: unknown },
): Promise<Uint8Array> {
  await ensureWasm();
  const res = (await client.cdr.consumer.decryptDataKey({
    uuid: params.uuid,
    partials: params.partials,
  } as never)) as Uint8Array;
  return res;
}
