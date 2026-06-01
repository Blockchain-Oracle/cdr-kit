/**
 * SDK-heavy storage adapters — each pulls a dependency that's too big to bundle into the core
 * surface for everyone. Use dynamic imports + clear "install X" errors so unaffected callers
 * never pay the load cost.
 *
 * Pair the adapter name with one of these install commands:
 *   createS3Storage           → pnpm add @aws-sdk/client-s3
 *   createStorachaStorage     → pnpm add @storacha/client  (or use SDK's bundled Storacha)
 *   createHeliaStorage        → pnpm add helia @helia/unixfs   (+ pnpm overrides: @peculiar/webcrypto@1.7.0)
 */
import { CdrErrors } from "./errors.js";
import { withRetry, type RetryOptions } from "./retry.js";
import type { CdrStorageProvider } from "./files.js";

/**
 * Indirect dynamic import. Bundlers (Vite, Rollup, esbuild) statically analyze a literal
 * `await import("…")` and try to resolve at build time — which fails when the optional peer
 * dep isn't installed in the consumer environment. Routing through `new Function` hides the
 * specifier from static analysis; the real resolution happens at runtime against consumer
 * `node_modules`.
 */
const __dynImport = new Function(
  "specifier",
  "return import(specifier)",
) as <T>(specifier: string) => Promise<T>;

/* ============================================================ */
/* S3-compatible (AWS S3 / Cloudflare R2 / MinIO / DigitalOcean) */
/* ============================================================ */

export interface S3StorageOptions {
  /** Bucket name (must already exist). */
  bucket: string;
  /** AWS region. R2 uses "auto". */
  region: string;
  /** Access key id. */
  accessKeyId: string;
  /** Secret access key. */
  secretAccessKey: string;
  /** Override the S3 endpoint URL — REQUIRED for R2 / MinIO / DigitalOcean Spaces. */
  endpoint?: string;
  /** Key prefix inside the bucket, default `cdr/`. */
  pathPrefix?: string;
  /** Force path-style URLs (true for MinIO / older R2). */
  forcePathStyle?: boolean;
  retry?: RetryOptions;
}

/**
 * S3-compatible storage. Works against AWS S3, Cloudflare R2 (set `region: "auto"` +
 * `endpoint: "https://<account>.r2.cloudflarestorage.com"`), MinIO (set `endpoint` +
 * `forcePathStyle: true`), or any S3-API service.
 *
 * BROWSER NOTE: never ship AWS credentials to the browser. Use a server route that issues
 * pre-signed URLs and call those from the client.
 */
export function createS3Storage(opts: S3StorageOptions): CdrStorageProvider {
  const prefix = (opts.pathPrefix ?? "cdr/").replace(/^\/+|\/+$/g, "");
  const retry = opts.retry ?? {};
  let clientPromise: Promise<unknown> | null = null;
  async function getClient(): Promise<{
    client: { send: (cmd: unknown) => Promise<unknown> };
    PutObjectCommand: new (i: unknown) => unknown;
    GetObjectCommand: new (i: unknown) => unknown;
  }> {
    if (!clientPromise) clientPromise = loadS3();
    return clientPromise as never;
  }
  async function loadS3() {
    let mod: typeof import("@aws-sdk/client-s3");
    try {
      mod = await __dynImport<typeof import("@aws-sdk/client-s3")>("@aws-sdk/client-s3");
    } catch {
      throw CdrErrors.unknown(
        "createS3Storage requires @aws-sdk/client-s3. Install it: pnpm add @aws-sdk/client-s3",
      );
    }
    const client = new mod.S3Client({
      region: opts.region,
      endpoint: opts.endpoint,
      forcePathStyle: opts.forcePathStyle,
      credentials: { accessKeyId: opts.accessKeyId, secretAccessKey: opts.secretAccessKey },
    });
    return { client, PutObjectCommand: mod.PutObjectCommand, GetObjectCommand: mod.GetObjectCommand };
  }

  return {
    upload(data) {
      return withRetry(async () => {
        const { client, PutObjectCommand } = await getClient();
        const key = `${prefix}/${globalThis.crypto.randomUUID()}.bin`;
        await client.send(
          new PutObjectCommand({
            Bucket: opts.bucket,
            Key: key,
            Body: data,
            ContentType: "application/octet-stream",
          }),
        );
        return key;
      }, retry);
    },
    download(key) {
      return withRetry(async () => {
        const { client, GetObjectCommand } = await getClient();
        const res = (await client.send(
          new GetObjectCommand({ Bucket: opts.bucket, Key: key }),
        )) as { Body?: { transformToByteArray: () => Promise<Uint8Array> } };
        if (!res.Body) throw CdrErrors.unknown(`S3 download returned no body for ${key}`);
        return res.Body.transformToByteArray();
      }, retry);
    },
  };
}

/* ============================================================ */
/* Storacha (UCAN-backed IPFS pinning)                           */
/* ============================================================ */

export interface StorachaStorageOptions {
  /** UCAN delegation proof (base64, from `w3 delegation create`). */
  proof: string;
  /** Storacha space DID. */
  spaceDid: string;
  /** UCAN principal key (from `w3 key create`). */
  key: string;
  /** Gateway used for downloads — default `https://w3s.link`. */
  gatewayUrl?: string;
  retry?: RetryOptions;
}

/**
 * Storacha (w3up) storage with env-var bootstrap. Wraps `@storacha/client`'s UCAN ceremony so
 * cdr-kit users don't need to learn delegation/principal bootstrap.
 *
 * The 3 env vars come from your one-time setup:
 *   STORACHA_KEY        → `w3 key create`               (the agent's private key)
 *   STORACHA_SPACE_DID  → `w3 space info`               (the destination space)
 *   STORACHA_PROOF      → `w3 delegation create`         (signed delegation from the space owner)
 */
export function createStorachaStorage(opts: StorachaStorageOptions): CdrStorageProvider {
  const gateway = (opts.gatewayUrl ?? "https://w3s.link").replace(/\/$/, "");
  const retry = opts.retry ?? {};
  let clientPromise: Promise<{ uploadFile: (b: Blob) => Promise<{ toString(): string }> }> | null = null;

  async function getClient() {
    if (clientPromise) return clientPromise;
    clientPromise = (async () => {
      type StorachaModule = {
        create: (cfg: { principal: unknown }) => Promise<{
          addSpace: (delegation: unknown) => Promise<unknown>;
          setCurrentSpace: (did: string) => Promise<void>;
          uploadFile: (b: Blob) => Promise<{ toString(): string }>;
        }>;
        Signer: { parse: (key: string) => unknown };
        Proof: { parse: (proof: string) => Promise<unknown> };
      };
      let mod: StorachaModule;
      try {
        mod = (await __dynImport<unknown>("@storacha/client")) as StorachaModule;
      } catch {
        throw CdrErrors.unknown(
          "createStorachaStorage requires @storacha/client. Install it: pnpm add @storacha/client",
        );
      }
      const principal = mod.Signer.parse(opts.key);
      const client = await mod.create({ principal });
      const delegation = await mod.Proof.parse(opts.proof);
      await client.addSpace(delegation);
      await client.setCurrentSpace(opts.spaceDid);
      return client;
    })();
    return clientPromise;
  }

  return {
    upload(data) {
      return withRetry(async () => {
        const client = await getClient();
        const buf = new ArrayBuffer(data.byteLength);
        new Uint8Array(buf).set(data);
        const cid = await client.uploadFile(new Blob([buf]));
        return cid.toString();
      }, retry);
    },
    download(cid) {
      return withRetry(async () => {
        const res = await fetch(`${gateway}/ipfs/${cid}`);
        if (!res.ok) throw CdrErrors.keeperUnavailable(new Error(`storacha download failed: ${res.status}`));
        return new Uint8Array(await res.arrayBuffer());
      }, retry);
    },
  };
}

/* ============================================================ */
/* Helia (embedded IPFS node — Node and browser)                 */
/* ============================================================ */

export interface HeliaStorageOptions {
  /** Pre-built Helia instance — use this if you already have one in your app. */
  helia?: unknown;
  retry?: RetryOptions;
}

/**
 * Helia-backed embedded IPFS storage. Spawns a Helia node + UnixFS adapter on first use.
 *
 * Browser pin (REQUIRED): add to your root `package.json` so the embedded webcrypto compat
 *   "pnpm": { "overrides": { "@peculiar/webcrypto": "1.7.0" } }
 * Without the pin, tsx + Node 22 ESM resolution breaks on the embedded crypto shim.
 */
export function createHeliaStorage(opts: HeliaStorageOptions = {}): CdrStorageProvider {
  const retry = opts.retry ?? {};
  // Typed loosely — Helia's published types are deeply generic; we only need the 3 methods we call.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let nodePromise: Promise<{ fs: any; CID: any }> | null = null;

  async function getNode() {
    if (!nodePromise) {
      nodePromise = (async () => {
        let heliaMod: typeof import("helia");
        let unixfsMod: typeof import("@helia/unixfs");
        let multiformats: typeof import("multiformats/cid");
        try {
          heliaMod = await __dynImport<typeof import("helia")>("helia");
          unixfsMod = await __dynImport<typeof import("@helia/unixfs")>("@helia/unixfs");
          multiformats = await import("multiformats/cid");
        } catch {
          throw CdrErrors.unknown(
            "createHeliaStorage requires helia + @helia/unixfs. Install: pnpm add helia @helia/unixfs",
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const helia = (opts.helia ?? (await heliaMod.createHelia())) as any;
        const fs = unixfsMod.unixfs(helia);
        return { fs, CID: multiformats.CID };
      })();
    }
    return nodePromise;
  }

  return {
    upload(data) {
      return withRetry(async () => {
        const node = await getNode();
        const cid = await node.fs.addBytes(data);
        return cid.toString();
      }, retry);
    },
    download(cidStr) {
      return withRetry(async () => {
        const node = await getNode();
        const chunks: Uint8Array[] = [];
        for await (const chunk of node.fs.cat(node.CID.parse(cidStr))) chunks.push(chunk);
        let len = 0;
        for (const c of chunks) len += c.length;
        const out = new Uint8Array(len);
        let off = 0;
        for (const c of chunks) {
          out.set(c, off);
          off += c.length;
        }
        return out;
      }, retry);
    },
  };
}
