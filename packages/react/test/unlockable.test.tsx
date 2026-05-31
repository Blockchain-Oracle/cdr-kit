import { describe, it, expect } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { createMockCdrKit } from "@cdr-kit/core";
import { CdrProvider } from "../src/provider.js";
import { Unlockable, useUnlockable } from "../src/unlockable.js";

describe("Unlockable / useUnlockable (mock mode)", () => {
  it("starts idle, opens, runs subscribe → ready, then resets to idle", async () => {
    const kit = createMockCdrKit({ readDelayMs: 30, threshold: 3 });
    const { uuid } = await kit.createVault({ data: new TextEncoder().encode("payload-bytes") });

    let snapshot: ReturnType<typeof useUnlockable> | undefined;
    function Probe() {
      const s = useUnlockable({ uuid });
      snapshot = s;
      return (
        <div>
          <span data-testid="status">{s.status}</span>
          <span data-testid="open">{s.isOpen ? "open" : "closed"}</span>
          <span data-testid="data">{s.data ? new TextDecoder().decode(s.data) : ""}</span>
        </div>
      );
    }

    render(
      <CdrProvider mockKit={kit}>
        <Probe />
      </CdrProvider>,
    );

    expect(screen.getByTestId("status").textContent).toBe("idle");
    expect(screen.getByTestId("open").textContent).toBe("closed");

    act(() => snapshot!.open());
    await waitFor(() => expect(screen.getByTestId("open").textContent).toBe("open"));

    await act(async () => {
      await snapshot!.request();
    });
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("ready"), { timeout: 2000 });
    expect(screen.getByTestId("data").textContent).toBe("payload-bytes");

    act(() => snapshot!.reset());
    expect(screen.getByTestId("open").textContent).toBe("closed");
  });

  it("Unlockable render-prop hands the state to children", async () => {
    const kit = createMockCdrKit({ readDelayMs: 10, threshold: 1 });
    const { uuid } = await kit.createVault({ data: new TextEncoder().encode("hello") });
    render(
      <CdrProvider mockKit={kit}>
        <Unlockable uuid={uuid}>
          {(s) => (
            <div>
              <span data-testid="rp-status">{s.status}</span>
              <button onClick={() => void s.request()}>go</button>
            </div>
          )}
        </Unlockable>
      </CdrProvider>,
    );
    expect(screen.getByTestId("rp-status").textContent).toBe("idle");
  });
});
