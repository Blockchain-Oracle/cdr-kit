import { describe, it, expect, vi } from "vitest";

vi.mock("../src/wasm.js", () => ({ ensureWasm: vi.fn().mockResolvedValue(undefined) }));

import { shouldUseFile, createMemoryStorage, uploadFile, downloadFile, INLINE_LIMIT_BYTES } from "../src/files.js";
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

describe("uploadFile", () => {
  it("encrypts+uploads via the SDK with open-read/owner-write defaults", async () => {
    const uploadFileSpy = vi
      .fn()
      .mockResolvedValue({ uuid: 77, cid: "bafyfile", ciphertext: {}, txHashes: { allocate: "0xa", write: "0xw" } });
    const client = { cdr: { uploader: { uploadFile: uploadFileSpy } } } as never;
    const storage = createMemoryStorage();

    const out = await uploadFile(client, { content: bytes(2048), storage });

    expect(out).toEqual({ uuid: 77, cid: "bafyfile", txHashes: { allocate: "0xa", write: "0xw" } });
    const arg = uploadFileSpy.mock.calls[0][0];
    expect(arg.readConditionAddr).toBe(aeneid.openCondition);
    expect(arg.writeConditionAddr).toBe(aeneid.ownerWriteCondition);
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
