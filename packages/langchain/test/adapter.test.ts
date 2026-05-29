import { describe, it, expect } from "vitest";
import type { CdrAgent } from "@cdr-kit/agent";
import { getLangChainTools } from "../src/index.js";

const stub = {
  discover: async () => [{ uuid: 1, ipId: "0x01", creator: "0x02", tokenId: 7n }],
  access: async (uuid: number) => new TextEncoder().encode(`data-${uuid}`),
  subscribeAndAccess: async () => new TextEncoder().encode("paid-secret"),
} as unknown as CdrAgent;

describe("getLangChainTools", () => {
  it("produces LangChain StructuredTools for the three CDR tools", () => {
    const tools = getLangChainTools(stub);
    expect(tools.map((t) => t.name).sort()).toEqual([
      "cdr_access_vault",
      "cdr_discover_vaults",
      "cdr_subscribe_and_access",
    ]);
    for (const t of tools) {
      expect(typeof t.description).toBe("string");
      expect(t.schema).toBeDefined();
    }
  });

  it("a tool invoke routes through to the agent and returns a JSON string", async () => {
    const tools = getLangChainTools(stub);
    const access = tools.find((t) => t.name === "cdr_access_vault")!;
    const out = await access.invoke({ uuid: 5 });
    expect(JSON.parse(out as string)).toEqual({ uuid: 5, text: "data-5" });
  });
});
