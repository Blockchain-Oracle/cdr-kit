import { describe, it, expect } from "vitest";
import { createMockCdrKit, CdrError, CdrErrors, matchCdrStatus } from "../src/index.js";

describe("mock cdr kit", () => {
  it("round-trips data and reports determinate progress", async () => {
    const kit = createMockCdrKit({ readDelayMs: 40, threshold: 4 });
    const secret = new TextEncoder().encode("hello");
    const { uuid } = await kit.createVault({ data: secret });
    const ticks: number[] = [];
    const out = await kit.accessVault({ uuid, onProgress: (p) => ticks.push(p.collected) });
    expect(new TextDecoder().decode(out)).toBe("hello");
    expect(ticks).toEqual([1, 2, 3, 4]);
  });

  it("subscribeAndAccess transitions paying -> collecting-partials -> ready", async () => {
    const kit = createMockCdrKit({ readDelayMs: 20, threshold: 2 });
    const { uuid } = await kit.createVault();
    await kit.writeVaultData({ uuid, dataKey: new TextEncoder().encode("data") });
    const steps: string[] = [];
    const out = await kit.subscribeAndAccess({ uuid, onProgress: (s) => steps.push(s) });
    expect(steps).toEqual(["paying", "collecting-partials", "ready"]);
    expect(new TextDecoder().decode(out)).toBe("data");
  });

  it("throws a typed CdrError for a missing vault", async () => {
    const kit = createMockCdrKit({ readDelayMs: 10, threshold: 1 });
    await expect(kit.accessVault({ uuid: 123 })).rejects.toMatchObject({ code: "VAULT_NOT_FOUND" });
  });
});

describe("CdrError", () => {
  it("carries code + recoverable + suggestedAction and is type-guardable", () => {
    const e = CdrErrors.conditionNotMet();
    expect(e.code).toBe("CONDITION_NOT_MET");
    expect(e.recoverable).toBe(true);
    expect(e.suggestedAction).toBeTruthy();
    expect(CdrError.is(e, "CONDITION_NOT_MET")).toBe(true);
    expect(CdrError.is(new Error("x"))).toBe(false);
  });
});

describe("matchCdrStatus", () => {
  it("dispatches on status with a fallback", () => {
    expect(matchCdrStatus({ status: "ready", data: 1 }, { ready: () => "R", _: () => "?" })).toBe("R");
    expect(matchCdrStatus({ status: "error" }, { ready: () => "R", _: () => "?" })).toBe("?");
  });
});
