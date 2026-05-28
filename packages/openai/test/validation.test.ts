import { describe, it, expect } from "vitest";
import type { CdrAgent } from "@cdr-kit/agent";
import { getOpenAITools } from "../src/index.js";

// access() echoes; if a malformed call slipped past validation it would reach here with bad args.
const stub = {
  discover: async () => [],
  access: async (uuid: number) => new TextEncoder().encode(`data-${uuid}`),
  subscribeAndAccess: async () => new TextEncoder().encode("x"),
} as unknown as CdrAgent;

describe("tool input validation via dispatch (adversarial)", () => {
  it("rejects a call missing the required uuid", async () => {
    const { dispatch } = getOpenAITools(stub);
    await expect(dispatch("cdr_access_vault", {})).rejects.toThrow();
  });

  it("rejects uuid of the wrong type", async () => {
    const { dispatch } = getOpenAITools(stub);
    await expect(dispatch("cdr_access_vault", { uuid: "not-a-number" })).rejects.toThrow();
  });

  it("rejects subscribe missing maxPricePerPeriodWei", async () => {
    const { dispatch } = getOpenAITools(stub);
    await expect(dispatch("cdr_subscribe_and_access", { uuid: 1 })).rejects.toThrow();
  });

  it("rejects subscribe with a non-numeric wei string (BigInt would throw downstream)", async () => {
    const { dispatch } = getOpenAITools(stub);
    await expect(dispatch("cdr_subscribe_and_access", { uuid: 1, maxPricePerPeriodWei: "abc" })).rejects.toThrow();
  });
});

describe("toJsonSchema required/optional fields", () => {
  it("marks uuid required and accessAuxData optional for cdr_access_vault", () => {
    const { tools } = getOpenAITools(stub);
    const access = tools.find((t) => t.function.name === "cdr_access_vault");
    const params = access?.function.parameters as { required?: string[]; properties: Record<string, unknown> };
    expect(params.required).toContain("uuid");
    expect(params.required ?? []).not.toContain("accessAuxData");
    expect(Object.keys(params.properties)).toContain("accessAuxData");
  });
});
