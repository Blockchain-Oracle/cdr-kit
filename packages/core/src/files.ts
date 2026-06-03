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
 *  key secured under CDR). Read `CDR.maxEncryptedDataSize()` for the on-chain truth — see
 *  {@link getInlineLimit}; this constant is the safe documented fallback. */
export const INLINE_LIMIT_BYTES = 1024;

/** Route a payload: inline (≤cap, on-chain) vs file (>cap, off-chain body + CDR-secured key). */
export function shouldUseFile(content: Uint8Array, limit = INLINE_LIMIT_BYTES): boolean {
  return content.length > limit;
}

const inlineLimitCache = new WeakMap<object, bigint>();

/**
 * Read the protocol's actual `CDR.maxEncryptedDataSize()` from chain (cached per-client). Falls
 * back to {@link INLINE_LIMIT_BYTES} on any RPC error so callers never block on cold-start
 * network flakes. Picks up future protocol bumps without needing a kit release (decision D-115).
 */
export async function getInlineLimit(client: CdrKitClient): Promise<number> {
  const cached = inlineLimitCache.get(client as unknown as object);
  if (cached !== undefined) return Number(cached);
  try {
    const limit = (await client.publicClient.readContract({
      address: aeneid.cdr as Hex,
      abi: [
        {
          type: "function",
          name: "maxEncryptedDataSize",
          stateMutability: "view",
          inputs: [],
          outputs: [{ type: "uint256" }],
        },
      ] as const,
      functionName: "maxEncryptedDataSize",
    })) as bigint;
    inlineLimitCache.set(client as unknown as object, limit);
    return Number(limit);
  } catch {
    return INLINE_LIMIT_BYTES;
  }
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

/**
 * Pinata-flavored convenience over `createIpfsStorage`. Sets the canonical Pinata pinning
 * endpoint + the public Pinata gateway and wires the JWT as a Bearer auth header. The CID
 * comes back as `IpfsHash` (already handled by `createIpfsStorage`).
 *
 * Get a JWT from https://app.pinata.cloud/keys (rotate per-environment; never bundle into a
 * browser build — proxy through a server route instead).
 */
export function createPinataStorage(opts: {
  jwt: string;
  /** Override the gateway (e.g. `https://your-subdomain.mypinata.cloud`). Default: public gateway. */
  gatewayUrl?: string;
  retry?: RetryOptions;
}): CdrStorageProvider {
  return createIpfsStorage({
    addUrl: "https://api.pinata.cloud/pinning/pinFileToIPFS",
    gatewayUrl: opts.gatewayUrl ?? "https://gateway.pinata.cloud",
    headers: { Authorization: `Bearer ${opts.jwt}` },
    retry: opts.retry,
  });
}

/**
 * Supabase Storage adapter. The "CID" is the bucket-relative path the object was uploaded to
 * (Supabase doesn't speak IPFS, but the StorageProvider interface only requires a string
 * round-trip handle). Uses the bare REST API so we don't pull in `@supabase/supabase-js` as a
 * dep — works against either anon or service-role keys depending on bucket RLS.
 *
 * Lifted-and-tightened from Jacob Tucker's `cdr-skill/src/04-encrypt-file-supabase.ts` example,
 * which is the only Supabase-on-CDR pattern in the wild as of 2026-06.
 */
export function createSupabaseStorage(opts: {
  /** Supabase project URL, e.g. `https://abc.supabase.co`. */
  supabaseUrl: string;
  /** Service-role or anon key (Authorization: Bearer …). */
  key: string;
  /** Bucket name (must exist; create via the dashboard or `supabase storage create-bucket`). */
  bucket: string;
  /** Path prefix within the bucket, e.g. `cdr/`. Trailing slash optional. Default: `cdr/`. */
  pathPrefix?: string;
  /** Whether the bucket is public (download uses `/public/…`). Default false → authenticated path. */
  bucketIsPublic?: boolean;
  retry?: RetryOptions;
}): CdrStorageProvider {
  const base = opts.supabaseUrl.replace(/\/$/, "");
  const prefix = (opts.pathPrefix ?? "cdr/").replace(/^\/+|\/+$/g, "");
  const retry = opts.retry ?? {};
  const objectRoot = opts.bucketIsPublic
    ? `${base}/storage/v1/object/public/${opts.bucket}`
    : `${base}/storage/v1/object/authenticated/${opts.bucket}`;
  return {
    upload(data) {
      return withRetry(async () => {
        // Use crypto.randomUUID() rather than randomUUID from node:crypto — works in browsers too.
        const path = `${prefix}/${globalThis.crypto.randomUUID()}.bin`;
        const res = await fetch(`${base}/storage/v1/object/${opts.bucket}/${path}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${opts.key}`,
            "Content-Type": "application/octet-stream",
          },
          body: data as unknown as BodyInit,
        });
        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw CdrErrors.keeperUnavailable(new Error(`supabase upload failed: ${res.status} ${msg}`));
        }
        return path;
      }, retry);
    },
    download(path) {
      return withRetry(async () => {
        const res = await fetch(`${objectRoot}/${path}`, {
          headers: opts.bucketIsPublic ? {} : { Authorization: `Bearer ${opts.key}` },
        });
        if (!res.ok) throw CdrErrors.keeperUnavailable(new Error(`supabase download failed: ${res.status}`));
        return new Uint8Array(await res.arrayBuffer());
      }, retry);
    },
  };
}

/**
 * Read-only IPFS gateway storage. For buyer-side dashboards that never upload — pair with a
 * seller using {@link createPinataStorage} (or any IPFS pinner). Throws on `upload()`. Use when
 * the consumer has no pinning credentials and you only need to fetch already-pinned content.
 */
export function createReadOnlyGatewayStorage(opts: {
  /** Any IPFS gateway URL: `https://ipfs.io`, `https://cf-ipfs.com`, `https://w3s.link`, etc. */
  gatewayUrl: string;
  retry?: RetryOptions;
}): CdrStorageProvider {
  const gateway = opts.gatewayUrl.replace(/\/$/, "");
  const retry = opts.retry ?? {};
  return {
    async upload() {
      throw CdrErrors.unknown("createReadOnlyGatewayStorage cannot upload; use createPinataStorage on the seller side");
    },
    download(cid) {
      return withRetry(async () => {
        const res = await fetch(`${gateway}/ipfs/${cid}`);
        if (!res.ok) throw CdrErrors.keeperUnavailable(new Error(`gateway download failed: ${res.status}`));
        return new Uint8Array(await res.arrayBuffer());
      }, retry);
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
  params: {
    uuid: number;
    storage: CdrStorageProvider;
    accessAuxData?: Hex;
    timeoutMs?: number;
    /** Skip CIDv1 multibase integrity check. Required when storage handle is not an IPFS CID
     *  (Supabase paths, S3 keys, etc.). Default false (verify) — IPFS-shaped storages keep it. */
    skipCidVerification?: boolean;
  },
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
      skipCidVerification: params.skipCidVerification,
    });
    return { content: res.content, cid: res.cid };
  } catch (e) {
    if (e instanceof EmptyVaultError) throw CdrErrors.vaultNotFound(params.uuid);
    if (e instanceof PartialCollectionTimeoutError) throw CdrErrors.readTimeout(timeoutMs, e);
    if (CdrError.is(e)) throw e;
    throw CdrErrors.keeperUnavailable(e);
  }
}
