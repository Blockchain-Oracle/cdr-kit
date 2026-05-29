import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Hex } from "viem";
import { aeneid } from "@cdr-kit/contracts";

// Mock the core SDK so the agent's wiring can be asserted without a chain or keeper.
const h = vi.hoisted(() => {
  const getLogs = vi.fn();
  const getBlockNumber = vi.fn(async () => 10_000n);
  const fakeClient = { address: "0xagent" as Hex, publicClient: { getLogs, getBlockNumber } };
  const accessVault = vi.fn(async () => new TextEncoder().encode("access-bytes"));
  const subscribeAndAccess = vi.fn(async () => new TextEncoder().encode("subscribe-bytes"));
  const createCdrKitClient = vi.fn(() => fakeClient);
  return { getLogs, getBlockNumber, fakeClient, accessVault, subscribeAndAccess, createCdrKitClient };
});

vi.mock("@cdr-kit/core", () => ({
  createCdrKitClient: h.createCdrKitClient,
  accessVault: h.accessVault,
  subscribeAndAccess: h.subscribeAndAccess,
}));

const { CdrAgent } = await import("../src/agent.js");
const decode = (b: Uint8Array) => new TextDecoder().decode(b);
const newAgent = () => new CdrAgent({ privateKey: "0x01" as Hex, apiUrl: "http://api.test" });

describe("CdrAgent", () => {
  beforeEach(() => {
    h.getLogs.mockReset();
    h.accessVault.mockClear();
    h.subscribeAndAccess.mockClear();
  });

  it("discover() maps VaultCreated logs and scans a bounded recent window", async () => {
    h.getLogs.mockResolvedValue([
      { args: { tokenId: 7n, uuid: 42, ipId: "0x0a", creator: "0x0b" } },
      { args: { tokenId: 8n, uuid: 43, ipId: "0x0c", creator: "0x0d" } },
    ]);

    const vaults = await newAgent().discover();

    expect(vaults).toEqual([
      { tokenId: 7n, uuid: 42, ipId: "0x0a", creator: "0x0b" },
      { tokenId: 8n, uuid: 43, ipId: "0x0c", creator: "0x0d" },
    ]);
    expect(h.getLogs).toHaveBeenCalledOnce();
    const arg = h.getLogs.mock.calls[0]![0] as { address: Hex; fromBlock: bigint; toBlock: bigint };
    expect(arg.address).toBe(aeneid.cdrKitVault);
    expect(arg.fromBlock).toBe(1_000n); // latest(10_000) - 9_000
    expect(arg.toBlock).toBe(10_000n);
  });

  it("discover({ fromBlock }) honors an explicit start block", async () => {
    h.getLogs.mockResolvedValue([]);
    await newAgent().discover({ fromBlock: 0n });
    expect((h.getLogs.mock.calls[0]![0] as { fromBlock: bigint }).fromBlock).toBe(0n);
  });

  it("subscribeAndAccess() delegates to core with the default subscription condition + a progress cb", async () => {
    const out = await newAgent().subscribeAndAccess({ uuid: 42, periods: 2n, maxPricePerPeriod: 100n, value: 200n });

    expect(decode(out)).toBe("subscribe-bytes");
    expect(h.subscribeAndAccess).toHaveBeenCalledOnce();
    const [, params] = h.subscribeAndAccess.mock.calls[0]!;
    expect(params).toMatchObject({
      subscriptionCondition: aeneid.subscriptionCondition,
      uuid: 42,
      periods: 2n,
      maxPricePerPeriod: 100n,
      value: 200n,
    });
    expect(typeof (params as { onProgress: unknown }).onProgress).toBe("function");
  });

  it("access() delegates to core accessVault with the uuid + aux data", async () => {
    const out = await newAgent().access(42, "0xaux");
    expect(decode(out)).toBe("access-bytes");
    expect(h.accessVault).toHaveBeenCalledWith(h.fakeClient, { uuid: 42, accessAuxData: "0xaux" });
  });
});
