import { describe, it, expect } from "vitest";
import {
  useDeadManTimer,
  useTimeWindowState,
  useMultiSigStatus,
  useEscrowState,
  useStorageBackend,
  useEscrowClaimTimeout,
  useEscrowRefund,
  useRotateMultiSigSigners,
} from "../src/condition-hooks";
import { useStoryClient, usePublish, useRegisterIp, useMintLicenseToken, useAttachLicenseTerms } from "../src/story-hooks";

describe("0.5 condition + Story IP hooks — exports are present", () => {
  // Smoke test: every hook is exported and is a function. Catches accidental rename / missing
  // export bugs (the real React work happens in unit tests against a wagmi mock, which lives
  // in apps/site's Playwright suite — see docs/e2e-runbook.md §5).
  it("all 0.5 condition hooks exported as functions", () => {
    for (const fn of [
      useDeadManTimer,
      useTimeWindowState,
      useMultiSigStatus,
      useEscrowState,
      useStorageBackend,
      useEscrowClaimTimeout,
      useEscrowRefund,
      useRotateMultiSigSigners,
    ]) {
      expect(typeof fn).toBe("function");
    }
  });

  it("all Story IP hooks exported as functions", () => {
    for (const fn of [useStoryClient, usePublish, useRegisterIp, useMintLicenseToken, useAttachLicenseTerms]) {
      expect(typeof fn).toBe("function");
    }
  });
});

// Functional behavior tests for useStorageBackend (and the wagmi-dependent ones) live in
// apps/site's Playwright suite — see docs/e2e-runbook.md §5. Calling these hooks outside a
// React render context throws because they wrap useMemo / useReadContract — that's expected.
