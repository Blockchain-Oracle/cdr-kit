import type { Hex } from "viem";
import { EmptyVaultError, PartialCollectionTimeoutError } from "@piplabs/cdr-sdk";
import { CID } from "multiformats/cid";
import * as raw from "multiformats/codecs/raw";
import { sha256 } from "multiformats/hashes/sha2";
import { aeneid } from "@cdr-kit/contracts";
import type { CdrKitClient } from "./client.js";
import { ensureWasm } from "./wasm.js";
import { CdrError, CdrErrors } from "./errors.js";
import { withRetry, type RetryOptions } from "./retry.js";

/** The CDR inline payload cap. Bodies larger than this must use the file path (off-chain body,
 *  key secured under CDR). Read `CDR.maxEncryptedDataSize()` for the on-chain truth; this is the
 *  documented practical inline cap. */
export const INLINE_LIMIT_BYTES = 1024;

/** Route a payload: inline (≤cap, on-chain) vs file (>cap, off-chain body + CDR-secured key). */
export function shouldUseFile(content: Uint8Array, limit = INLINE_LIMIT_BYTES): boolean {
  return content.length > limit;
}

/** Storage interface (mirrors the CDR SDK's StorageProvider): upload bytes → CID, download CID → bytes. */
export interface CdrStorageProvider {
  upload(data: Uint8Array, options?: { pin?: boolean }): Promise<string>;
  download(cid: string): Promise<Uint8Array>;
}

/** In-memory, content-addressed storage for tests/mock/CI — no network. Returns a real CIDv1
 *  (raw codec, sha-256) so it's a true drop-in wherever a StorageProvider is expected (incl. the
 *  CDR SDK's downloadFile, which parses the CID). */
export function createMemoryStorage(): CdrStorageProvider {
  const store = new Map<string, Uint8Array>();
  return {
    async upload(data) {
      const hash = await sha256.digest(data);
      const cid = CID.create(1, raw.code, hash).toString();
      store.set(cid, data);
      return cid;
    },
    async download(cid) {
      const data = store.get(cid);
      if (!data) throw CdrErrors.unknown(`no object for CID ${cid}`);
      return data;
    },
  };
}

/** HTTP storage for IPFS — works with a Kubo RPC (`/api/v0/add`) + gateway, or a pinning service
 *  (Pinata / web3.storage) via `addUrl` + `headers`. `addUrl` receives a multipart `file` field and
 *  must return JSON with a CID under `Hash` | `cid` | `IpfsHash`. */
export function createIpfsStorage(opts: {
  addUrl: string;
  gatewayUrl: string;
  headers?: Record<string, string>;
  /** Backoff/jitter for transient HTTP failures. Defaults to the standard policy. */
  retry?: RetryOptions;
}): CdrStorageProvider {
  const gateway = opts.gatewayUrl.replace(/\/$/, "");
  const retry = opts.retry ?? {};
  return {
    upload(data) {
      return withRetry(async () => {
        const form = new FormData();
        form.append("file", new Blob([data as unknown as BlobPart]));
        const res = await fetch(opts.addUrl, { method: "POST", body: form, headers: opts.headers });
        if (!res.ok) throw CdrErrors.keeperUnavailable(new Error(`storage upload failed: ${res.status}`));
        const json = (await res.json()) as { Hash?: string; cid?: string; IpfsHash?: string };
        const cid = json.Hash ?? json.cid ?? json.IpfsHash;
        if (!cid) throw CdrErrors.unknown("storage upload returned no CID");
        return cid;
      }, retry);
    },
    download(cid) {
      return withRetry(async () => {
        const res = await fetch(`${gateway}/ipfs/${cid}`, { headers: opts.headers });
        if (!res.ok) throw CdrErrors.keeperUnavailable(new Error(`storage download failed: ${res.status}`));
        return new Uint8Array(await res.arrayBuffer());
      }, retry);
    },
  };
}

/**
 * Upload a >1KB payload: encrypt the body, push it to `storage` (IPFS), allocate a vault, and write
 * the CID + CDR-secured key reference — all in the SDK's `uploadFile`. Defaults to an open read+write
 * vault (OpenCondition — works with a raw, factory-unconfigured allocate, verified live on Aeneid);
 * pass cdr-kit condition addresses for gated file vaults once those conditions are configured for the
 * uuid by the factory.
 */
export async function uploadFile(
  client: CdrKitClient,
  params: {
    content: Uint8Array;
    storage: CdrStorageProvider;
    readConditionAddr?: Hex;
    readConditionData?: Hex;
    writeConditionAddr?: Hex;
    writeConditionData?: Hex;
    accessAuxData?: Hex;
    updatable?: boolean;
    pin?: boolean;
  },
): Promise<{ uuid: number; cid: string; txHashes: { allocate: Hex; write: Hex } }> {
  await ensureWasm();
  const res = await client.cdr.uploader.uploadFile({
    content: params.content,
    storageProvider: params.storage,
    updatable: params.updatable ?? false,
    readConditionAddr: params.readConditionAddr ?? (aeneid.openCondition as Hex),
    readConditionData: params.readConditionData ?? "0x",
    writeConditionAddr: params.writeConditionAddr ?? (aeneid.openCondition as Hex),
    writeConditionData: params.writeConditionData ?? "0x",
    accessAuxData: params.accessAuxData ?? "0x",
    pin: params.pin ?? true,
  });
  return { uuid: res.uuid, cid: res.cid, txHashes: res.txHashes };
}

/** Read a file vault: collect partials, recover the key, fetch the body from `storage`, decrypt. */
export async function downloadFile(
  client: CdrKitClient,
  params: { uuid: number; storage: CdrStorageProvider; accessAuxData?: Hex; timeoutMs?: number },
): Promise<{ content: Uint8Array; cid: string }> {
  await ensureWasm();
  // Default aligned to Story CDR SDK docs (`downloadFile` example uses 120_000ms). Was 600_000.
  const timeoutMs = params.timeoutMs ?? 120_000;
  try {
    const res = await client.cdr.consumer.downloadFile({
      uuid: params.uuid,
      accessAuxData: params.accessAuxData ?? "0x",
      storageProvider: params.storage,
      timeoutMs,
    });
    return { content: res.content, cid: res.cid };
  } catch (e) {
    if (e instanceof EmptyVaultError) throw CdrErrors.vaultNotFound(params.uuid);
    if (e instanceof PartialCollectionTimeoutError) throw CdrErrors.readTimeout(timeoutMs, e);
    if (CdrError.is(e)) throw e;
    throw CdrErrors.keeperUnavailable(e);
  }
}
