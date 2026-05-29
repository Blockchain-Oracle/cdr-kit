import { describe, it, expect, vi } from "vitest";
import { withRetry, defaultShouldRetry } from "../src/retry.js";
import { CdrErrors } from "../src/errors.js";

const noSleep = () => Promise.resolve();

describe("withRetry", () => {
  it("returns immediately on success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    expect(await withRetry(fn, { sleep: noSleep })).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries transient keeper errors then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(CdrErrors.keeperUnavailable())
      .mockRejectedValueOnce(CdrErrors.rateLimited())
      .mockResolvedValue("recovered");
    const onRetry = vi.fn();
    const out = await withRetry(fn, { maxAttempts: 3, sleep: noSleep, onRetry });
    expect(out).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry non-transient errors (e.g. wallet required)", async () => {
    const fn = vi.fn().mockRejectedValue(CdrErrors.walletRequired());
    await expect(withRetry(fn, { sleep: noSleep })).rejects.toMatchObject({ code: "WALLET_REQUIRED" });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws the last error after exhausting attempts", async () => {
    const fn = vi.fn().mockRejectedValue(CdrErrors.keeperUnavailable());
    await expect(withRetry(fn, { maxAttempts: 2, sleep: noSleep })).rejects.toMatchObject({
      code: "KEEPER_UNAVAILABLE",
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("defaultShouldRetry", () => {
  it("retries keeper/rate-limit/timeout, not gas/condition errors", () => {
    expect(defaultShouldRetry(CdrErrors.keeperUnavailable())).toBe(true);
    expect(defaultShouldRetry(CdrErrors.readTimeout(1000))).toBe(true);
    expect(defaultShouldRetry(CdrErrors.outOfGas())).toBe(false);
    expect(defaultShouldRetry(CdrErrors.conditionNotMet())).toBe(false);
  });
});
