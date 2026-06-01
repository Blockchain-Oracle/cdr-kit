import { describe, it, expect } from "vitest";
import type { CdrAgent } from "@cdr-kit/agent";
import { getGoatTools } from "../src/index.js";

const stub = {
  discover: async () => [],
  access: async (uuid: number) => new TextEncoder().encode(`data-${uuid}`),
  subscribeAndAccess: async () => new TextEncoder().encode("x"),
} as unknown as CdrAgent;

const find = (suffix: string) => getGoatTools(stub).find((t) => t.name.endsWith(suffix))!;

describe("getGoatTools (GOAT SDK)", () => {
  it("exposes the three CDR tools", () => {
    const names = getGoatTools(stub).map((t) => t.name.replace(/^.*?(cdr_)/, "$1"));
    expect(names).toEqual(expect.arrayContaining(["cdr_discover_vaults", "cdr_subscribe_and_access", "cdr_access_vault"]));
    expect(getGoatTools(stub)).toHaveLength(34);
  });

  it("a tool's execute routes through to the agent", async () => {
    const res = await find("cdr_access_vault").execute({ uuid: 7 });
    expect(res).toEqual({ uuid: 7, text: "data-7" });
  });

  it("rejects malformed input (GOAT doesn't validate, so our invoke does)", async () => {
    await expect(Promise.resolve().then(() => find("cdr_access_vault").execute({}))).rejects.toThrow();
  });
});
