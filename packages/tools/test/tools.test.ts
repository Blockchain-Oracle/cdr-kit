import { describe, it, expect, vi } from "vitest";
import type { CdrAgent } from "@cdr-kit/agent";
import { createCdrTools, toJsonSchema, type CdrTool } from "../src/index.js";

function makeAgent() {
  const discover = vi.fn(async () => [{ uuid: 1, ipId: "0x01", creator: "0x02", tokenId: 7n }]);
  const subscribeAndAccess = vi.fn(async () => new TextEncoder().encode("paid-secret"));
  const access = vi.fn(async () => new TextEncoder().encode("owned-secret"));
  const agent = { discover, subscribeAndAccess, access } as unknown as CdrAgent;
  return { agent, discover, subscribeAndAccess, access };
}

const byName = (tools: CdrTool[], name: string) => tools.find((t) => t.name === name)!;

describe("createCdrTools", () => {
  it("exposes exactly the three CDR tools", () => {
    const { agent } = makeAgent();
    expect(createCdrTools(agent).map((t) => t.name).sort()).toEqual([
      "cdr_access_vault",
      "cdr_discover_vaults",
      "cdr_subscribe_and_access",
    ]);
  });

  it("discover tool serializes bigint tokenId to a string", async () => {
    const { agent, discover } = makeAgent();
    const res = await byName(createCdrTools(agent), "cdr_discover_vaults").invoke({});
    expect(discover).toHaveBeenCalledOnce();
    expect(res).toEqual([{ uuid: 1, ipId: "0x01", creator: "0x02", tokenId: "7" }]);
  });

  it("subscribe tool parses wei strings to bigint and computes total value = price * periods", async () => {
    const { agent, subscribeAndAccess } = makeAgent();
    const res = await byName(createCdrTools(agent), "cdr_subscribe_and_access").invoke({
      uuid: 5,
      periods: 3,
      maxPricePerPeriodWei: "100",
    });
    expect(res).toEqual({ uuid: 5, text: "paid-secret" });
    expect(subscribeAndAccess).toHaveBeenCalledWith({
      uuid: 5,
      periods: 3n,
      maxPricePerPeriod: 100n,
      value: 300n,
    });
  });

  it("access tool routes uuid + aux data through and decodes the bytes", async () => {
    const { agent, access } = makeAgent();
    const res = await byName(createCdrTools(agent), "cdr_access_vault").invoke({ uuid: 9, accessAuxData: "0xfeed" });
    expect(res).toEqual({ uuid: 9, text: "owned-secret" });
    expect(access).toHaveBeenCalledWith(9, "0xfeed");
  });

  it("rejects invalid input via the tool's own Zod schema", async () => {
    const { agent } = makeAgent();
    const subscribe = byName(createCdrTools(agent), "cdr_subscribe_and_access");
    await expect(subscribe.invoke({ uuid: "not-a-number", maxPricePerPeriodWei: "1" })).rejects.toThrow();
    await expect(subscribe.invoke({ uuid: 1 })).rejects.toThrow(); // missing maxPricePerPeriodWei
  });

  it("toJsonSchema produces an openApi3 object schema per tool", () => {
    const { agent } = makeAgent();
    for (const tool of createCdrTools(agent)) {
      const schema = toJsonSchema(tool);
      expect(schema).toMatchObject({ type: "object" });
      expect(schema).toHaveProperty("properties");
    }
  });
});
