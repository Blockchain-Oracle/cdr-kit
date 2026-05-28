import { describe, it, expect, vi } from "vitest";

vi.mock("../src/wasm.js", () => ({ ensureWasm: vi.fn().mockResolvedValue(undefined) }));

import { accessVault, prefetchVault } from "../src/flows.js";

function fakeClient(dataKey: Uint8Array) {
  const accessCDR = vi.fn().mockResolvedValue({ dataKey, txHash: "0xabc" });
  const prefetchRegistry = vi.fn().mockResolvedValue(undefined);
  return {
    client: { cdr: { consumer: { accessCDR, prefetchRegistry } } } as never,
    accessCDR,
    prefetchRegistry,
  };
}

describe("accessVault onProgress", () => {
  it("emits collecting-partials then ready around the read", async () => {
    const { client } = fakeClient(new Uint8Array([1, 2, 3]));
    const steps: string[] = [];
    const out = await accessVault(client, { uuid: 7, onProgress: (s) => steps.push(s) });
    expect(Array.from(out)).toEqual([1, 2, 3]);
    expect(steps).toEqual(["collecting-partials", "ready"]);
  });

  it("does not emit ready when the read fails", async () => {
    const accessCDR = vi.fn().mockRejectedValue(new Error("boom"));
    const client = { cdr: { consumer: { accessCDR, prefetchRegistry: vi.fn() } } } as never;
    const steps: string[] = [];
    await expect(accessVault(client, { uuid: 9, onProgress: (s) => steps.push(s) })).rejects.toBeTruthy();
    expect(steps).toEqual(["collecting-partials"]);
  });
});

describe("prefetchVault", () => {
  it("warms the registry and swallows errors", async () => {
    const { client, prefetchRegistry } = fakeClient(new Uint8Array());
    await prefetchVault(client);
    expect(prefetchRegistry).toHaveBeenCalledOnce();

    const failing = { cdr: { consumer: { prefetchRegistry: vi.fn().mockRejectedValue(new Error("x")) } } } as never;
    await expect(prefetchVault(failing)).resolves.toBeUndefined();
  });
});
