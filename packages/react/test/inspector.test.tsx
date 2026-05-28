import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockCdrKit } from "@cdr-kit/core";
import { CdrProvider } from "../src/provider.js";
import { CdrInspector } from "../src/components.js";

describe("<CdrInspector> + theming", () => {
  it("reports mock mode when a mockKit is provided", () => {
    const { container } = render(
      <CdrProvider mockKit={createMockCdrKit()}>
        <CdrInspector />
      </CdrProvider>,
    );
    expect(container.querySelector("[data-cdr-inspector]")?.textContent).toContain("mode: mock");
  });

  it("applies appearance CSS variables on the cdr root", () => {
    const { container } = render(
      <CdrProvider mockKit={createMockCdrKit()} appearance={{ variables: { "--cdr-skeleton": "#123456" } }}>
        <span>x</span>
      </CdrProvider>,
    );
    const root = container.querySelector("[data-cdr-root]") as HTMLElement;
    expect(root.style.getPropertyValue("--cdr-skeleton")).toBe("#123456");
  });

  it("placeholder render does not require a wallet/chain (mock provider mounts cleanly)", () => {
    expect(() => render(<CdrProvider mockKit={createMockCdrKit()}><span>ok</span></CdrProvider>)).not.toThrow();
    expect(screen.getByText("ok")).toBeTruthy();
  });
});
