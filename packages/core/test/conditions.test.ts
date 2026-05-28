import { describe, it, expect } from "vitest";
import {
  encodeSubscriptionConfig,
  encodeTierGateConfig,
  encodeComposableConfig,
  createMockCdrKit,
} from "../src/index.js";

const ADDR = `0x${"1".repeat(40)}` as `0x${string}`;

describe("encoder validation (adversarial)", () => {
  it("subscription: rejects zero period, negative price, non-address payee, bad mode", () => {
    expect(() => encodeSubscriptionConfig({ pricePerPeriod: 1n, period: 0n, payee: ADDR, mode: 0, licensorIpId: ADDR })).toThrow();
    expect(() => encodeSubscriptionConfig({ pricePerPeriod: -1n, period: 1n, payee: ADDR, mode: 0, licensorIpId: ADDR })).toThrow();
    expect(() => encodeSubscriptionConfig({ pricePerPeriod: 1n, period: 1n, payee: "0x123" as `0x${string}`, mode: 0, licensorIpId: ADDR })).toThrow();
    // mode must be 0 or 1
    expect(() => encodeSubscriptionConfig({ pricePerPeriod: 1n, period: 1n, payee: ADDR, mode: 2 as 0, licensorIpId: ADDR })).toThrow();
  });

  it("subscription: accepts a valid config", () => {
    const hex = encodeSubscriptionConfig({ pricePerPeriod: 1000n, period: 3600n, payee: ADDR, mode: 0, licensorIpId: ADDR });
    expect(hex).toMatch(/^0x[0-9a-f]+$/);
  });

  it("tierGate: rejects empty allowedTermsIds and bad ipId", () => {
    expect(() => encodeTierGateConfig({ ipId: ADDR, allowedTermsIds: [] })).toThrow();
    expect(() => encodeTierGateConfig({ ipId: "0xnothex" as `0x${string}`, allowedTermsIds: [1n] })).toThrow();
  });

  it("composable: rejects empty children and > MAX (8) children", () => {
    expect(() => encodeComposableConfig({ mode: 0, children: [] })).toThrow();
    expect(() => encodeComposableConfig({ mode: 0, children: Array(9).fill(ADDR) })).toThrow();
    // exactly 8 is allowed
    expect(encodeComposableConfig({ mode: 1, children: Array(8).fill(ADDR) })).toMatch(/^0x/);
  });
});

describe("mock edge cases (adversarial)", () => {
  it("subscribeAndAccess on a vault with no data written throws VAULT_NOT_FOUND", async () => {
    const kit = createMockCdrKit({ readDelayMs: 10, threshold: 1 });
    const { uuid } = await kit.createVault(); // no data
    await expect(kit.subscribeAndAccess({ uuid })).rejects.toMatchObject({ code: "VAULT_NOT_FOUND" });
  });

  it("accessVault on a never-created uuid throws (does not hang or return empty)", async () => {
    const kit = createMockCdrKit({ readDelayMs: 10, threshold: 1 });
    await expect(kit.accessVault({ uuid: 999999 })).rejects.toMatchObject({ code: "VAULT_NOT_FOUND" });
  });
});
