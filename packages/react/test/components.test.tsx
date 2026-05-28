import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createMockCdrKit } from "@cdr-kit/core";
import { CdrProvider } from "../src/provider.js";
import { Vault } from "../src/components.js";

const dec = (b: Uint8Array) => new TextDecoder().decode(b);

describe("<Vault> compound (mock mode)", () => {
  it("shows Loading during the read, then Unlocked with the data", async () => {
    const kit = createMockCdrKit({ readDelayMs: 40, threshold: 3 });
    const { uuid } = await kit.createVault({ data: new TextEncoder().encode("classified") });
    render(
      <CdrProvider mockKit={kit}>
        <Vault uuid={uuid}>
          <Vault.Loading>{() => <span>reading…</span>}</Vault.Loading>
          <Vault.Unlocked>{(d) => <span>{dec(d)}</span>}</Vault.Unlocked>
          <Vault.Locked>
            <span>locked</span>
          </Vault.Locked>
        </Vault>
      </CdrProvider>,
    );
    // Loading appears first (auto-access kicks off immediately)
    expect(screen.getByText("reading…")).toBeTruthy();
    // then the decrypted content
    await waitFor(() => expect(screen.getByText("classified")).toBeTruthy(), { timeout: 2000 });
    expect(screen.queryByText("locked")).toBeNull();
  });

  it("renders Locked (not a crash) when the read errors", async () => {
    const kit = createMockCdrKit({ readDelayMs: 10, threshold: 1 });
    render(
      <CdrProvider mockKit={kit}>
        <Vault uuid={424242}>
          <Vault.Unlocked>{(d) => <span>{dec(d)}</span>}</Vault.Unlocked>
          <Vault.Locked>
            <span>locked</span>
          </Vault.Locked>
        </Vault>
      </CdrProvider>,
    );
    await waitFor(() => expect(screen.getByText("locked")).toBeTruthy(), { timeout: 2000 });
  });
});
