import { describe, it, expect } from "vitest";
import type { CdrAgent } from "@cdr-kit/agent";
import { getVercelAITools } from "../src/index.js";

const stub = {
  discover: async () => [{ uuid: 1, ipId: "0x01", creator: "0x02", tokenId: 7n }],
  access: async (uuid: number) => new TextEncoder().encode(`data-${uuid}`),
  subscribeAndAccess: async () => new TextEncoder().encode("paid-secret"),
} as unknown as CdrAgent;

describe("getVercelAITools", () => {
  it("produces an AI SDK tool set with the CDR tools", () => {
    const tools = getVercelAITools(stub);
    expect(Object.keys(tools)).toContain("cdr_access_vault");
    expect(Object.keys(tools)).toContain("cdr_discover_vaults");
    expect(Object.keys(tools)).toContain("cdr_subscribe_and_access");
    expect(Object.keys(tools).length).toBe(13);
    expect(typeof tools["cdr_access_vault"]?.description).toBe("string");
  });

  it("a tool's execute routes through to the agent", async () => {
    const tools = getVercelAITools(stub);
    const execute = tools["cdr_access_vault"]?.execute as (a: unknown, o?: unknown) => Promise<unknown>;
    const res = await execute({ uuid: 5 }, {});
    expect(res).toEqual({ uuid: 5, text: "data-5" });
  });
});
