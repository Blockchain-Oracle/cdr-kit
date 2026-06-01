import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("../src/wasm.js", () => ({ ensureWasm: vi.fn().mockResolvedValue(undefined) }));

import {
  shouldUseFile,
  createMemoryStorage,
  createPinataStorage,
  createSupabaseStorage,
  createReadOnlyGatewayStorage,
  uploadFile,
  downloadFile,
  INLINE_LIMIT_BYTES,
} from "../src/files.js";
import { aeneid } from "@cdr-kit/contracts";

const bytes = (n: number) => new Uint8Array(n);

describe("shouldUseFile", () => {
  it("routes >1KB to the file path, ≤1KB inline", () => {
    expect(shouldUseFile(bytes(INLINE_LIMIT_BYTES))).toBe(false);
    expect(shouldUseFile(bytes(INLINE_LIMIT_BYTES + 1))).toBe(true);
    expect(shouldUseFile(bytes(10))).toBe(false);
  });
});

describe("createMemoryStorage", () => {
  it("round-trips bytes and is content-addressed", async () => {
    const s = createMemoryStorage();
    const data = new TextEncoder().encode("a large confidential payload");
    const cid1 = await s.upload(data);
    const cid2 = await s.upload(new TextEncoder().encode("a large confidential payload"));
    expect(cid1).toBe(cid2); // deterministic by content
    expect(new TextDecoder().decode(await s.download(cid1))).toBe("a large confidential payload");
  });

  it("throws for an unknown CID", async () => {
    const s = createMemoryStorage();
    await expect(s.download("mem-nope")).rejects.toBeTruthy();
  });
});

describe("createPinataStorage", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("posts to Pinata's pinFileToIPFS endpoint with bearer auth + parses IpfsHash", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ IpfsHash: "QmCidFromPinata" }) });
    globalThis.fetch = fetchSpy as never;

    const s = createPinataStorage({ jwt: "pinata-jwt", retry: { retries: 0 } });
    const cid = await s.upload(new Uint8Array([1, 2, 3]));

    expect(cid).toBe("QmCidFromPinata");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.pinata.cloud/pinning/pinFileToIPFS");
    expect((init as { headers: Record<string, string> }).headers.Authorization).toBe("Bearer pinata-jwt");
  });

  it("downloads from the public Pinata gateway by default", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new Uint8Array([9, 9]).buffer });
    globalThis.fetch = fetchSpy as never;

    const s = createPinataStorage({ jwt: "x", retry: { retries: 0 } });
    const data = await s.download("Qm123");

    expect(Array.from(data)).toEqual([9, 9]);
    expect(fetchSpy.mock.calls[0][0]).toBe("https://gateway.pinata.cloud/ipfs/Qm123");
  });
});

describe("createSupabaseStorage", () => {
  const originalFetch = globalThis.fetch;
  const originalUuid = globalThis.crypto?.randomUUID;
  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalUuid) Object.defineProperty(globalThis.crypto, "randomUUID", { value: originalUuid, configurable: true });
  });

  it("uploads to bucket-relative path + returns it as the 'cid'", async () => {
    const fetchSpy = vi.fn().mockResolvedValueOnce({ ok: true, text: async () => "" });
    globalThis.fetch = fetchSpy as never;
    Object.defineProperty(globalThis.crypto, "randomUUID", {
      value: () => "11111111-2222-3333-4444-555555555555",
      configurable: true,
    });

    const s = createSupabaseStorage({
      supabaseUrl: "https://proj.supabase.co",
      key: "sb-service-key",
      bucket: "secrets",
      retry: { retries: 0 },
    });
    const path = await s.upload(new Uint8Array([1, 2, 3]));

    expect(path).toBe("cdr/11111111-2222-3333-4444-555555555555.bin");
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "https://proj.supabase.co/storage/v1/object/secrets/cdr/11111111-2222-3333-4444-555555555555.bin",
    );
    const init = fetchSpy.mock.calls[0][1] as { headers: Record<string, string>; method: string };
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer sb-service-key");
    expect(init.headers["Content-Type"]).toBe("application/octet-stream");
  });

  it("downloads via authenticated path by default + sends Bearer on read", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new Uint8Array([7]).buffer });
    globalThis.fetch = fetchSpy as never;

    const s = createSupabaseStorage({
      supabaseUrl: "https://proj.supabase.co",
      key: "sb-key",
      bucket: "secrets",
      retry: { retries: 0 },
    });
    const data = await s.download("cdr/x.bin");

    expect(Array.from(data)).toEqual([7]);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "https://proj.supabase.co/storage/v1/object/authenticated/secrets/cdr/x.bin",
    );
    const init = fetchSpy.mock.calls[0][1] as { headers: Record<string, string> };
    expect(init.headers.Authorization).toBe("Bearer sb-key");
  });

  it("downloads via /public/ + omits Bearer when bucketIsPublic", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new Uint8Array([8]).buffer });
    globalThis.fetch = fetchSpy as never;

    const s = createSupabaseStorage({
      supabaseUrl: "https://proj.supabase.co",
      key: "sb-key",
      bucket: "public-data",
      bucketIsPublic: true,
      retry: { retries: 0 },
    });
    await s.download("cdr/x.bin");

    expect(fetchSpy.mock.calls[0][0]).toBe(
      "https://proj.supabase.co/storage/v1/object/public/public-data/cdr/x.bin",
    );
    const init = fetchSpy.mock.calls[0][1] as { headers: Record<string, string> };
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("surfaces a useful error on upload failure", async () => {
    // Use mockResolvedValue (sticky) — withRetry may attempt > 1 fetch before bailing.
    const fetchSpy = vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => "row-level security" });
    globalThis.fetch = fetchSpy as never;

    const s = createSupabaseStorage({
      supabaseUrl: "https://proj.supabase.co",
      key: "anon-key",
      bucket: "secrets",
      retry: { retries: 0 },
    });
    // CdrErrors.keeperUnavailable wraps the underlying error as `.cause` — assert on that.
    await expect(s.upload(new Uint8Array([1]))).rejects.toMatchObject({
      code: "KEEPER_UNAVAILABLE",
      cause: expect.objectContaining({ message: expect.stringMatching(/403/) }),
    });
  });
});

describe("createReadOnlyGatewayStorage", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("downloads from the configured gateway", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2]).buffer });
    globalThis.fetch = fetchSpy as never;

    const s = createReadOnlyGatewayStorage({ gatewayUrl: "https://w3s.link", retry: { retries: 0 } });
    const data = await s.download("Qm1");

    expect(Array.from(data)).toEqual([1, 2]);
    expect(fetchSpy.mock.calls[0][0]).toBe("https://w3s.link/ipfs/Qm1");
  });

  it("throws on upload — read-only by design", async () => {
    const s = createReadOnlyGatewayStorage({ gatewayUrl: "https://w3s.link" });
    await expect(s.upload(new Uint8Array([1]))).rejects.toThrow(/cannot upload/);
  });
});

describe("uploadFile", () => {
  it("encrypts+uploads via the SDK with open read+write defaults", async () => {
    const uploadFileSpy = vi
      .fn()
      .mockResolvedValue({ uuid: 77, cid: "bafyfile", ciphertext: {}, txHashes: { allocate: "0xa", write: "0xw" } });
    const client = { cdr: { uploader: { uploadFile: uploadFileSpy } } } as never;
    const storage = createMemoryStorage();

    const out = await uploadFile(client, { content: bytes(2048), storage });

    expect(out).toEqual({ uuid: 77, cid: "bafyfile", txHashes: { allocate: "0xa", write: "0xw" } });
    const arg = uploadFileSpy.mock.calls[0][0];
    expect(arg.readConditionAddr).toBe(aeneid.openCondition);
    expect(arg.writeConditionAddr).toBe(aeneid.openCondition);
    expect(arg.storageProvider).toBe(storage);
  });
});

describe("downloadFile", () => {
  it("returns content + cid", async () => {
    const client = {
      cdr: { consumer: { downloadFile: vi.fn().mockResolvedValue({ content: bytes(2048), cid: "bafyfile", txHash: "0x1" }) } },
    } as never;
    const out = await downloadFile(client, { uuid: 77, storage: createMemoryStorage() });
    expect(out.cid).toBe("bafyfile");
    expect(out.content.length).toBe(2048);
  });

  it("maps EmptyVaultError to VAULT_NOT_FOUND", async () => {
    const { EmptyVaultError } = await import("@piplabs/cdr-sdk");
    const client = {
      cdr: { consumer: { downloadFile: vi.fn().mockRejectedValue(new EmptyVaultError("empty")) } },
    } as never;
    await expect(downloadFile(client, { uuid: 9, storage: createMemoryStorage() })).rejects.toMatchObject({
      code: "VAULT_NOT_FOUND",
    });
  });
});
