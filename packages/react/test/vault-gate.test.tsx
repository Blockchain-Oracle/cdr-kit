import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createMockCdrKit } from "@cdr-kit/core";
import { CdrProvider } from "../src/provider.js";
import { VaultGate } from "../src/vault-gate.js";

describe("VaultGate (mock mode)", () => {
  it("renders the decrypted content after the simulated read", async () => {
    const kit = createMockCdrKit({ readDelayMs: 30, threshold: 3 });
    const { uuid } = await kit.createVault({ data: new TextEncoder().encode("top-secret") });
    render(
      <CdrProvider mockKit={kit}>
        <VaultGate uuid={uuid} auto loading={<span>loading</span>} fallback={<span>locked</span>}>
          {(data) => <span>{new TextDecoder().decode(data)}</span>}
        </VaultGate>
      </CdrProvider>,
    );
    await waitFor(() => expect(screen.getByText("top-secret")).toBeTruthy(), { timeout: 2000 });
  });

  it("falls back (no crash) when the vault has no data — error path", async () => {
    const kit = createMockCdrKit({ readDelayMs: 10, threshold: 1 });
    render(
      <CdrProvider mockKit={kit}>
        <VaultGate uuid={999999} auto loading={<span>loading</span>} fallback={<span>locked</span>}>
          {(data) => <span>{new TextDecoder().decode(data)}</span>}
        </VaultGate>
      </CdrProvider>,
    );
    await waitFor(() => expect(screen.getByText("locked")).toBeTruthy(), { timeout: 2000 });
  });
});
