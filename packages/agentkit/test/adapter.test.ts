import { describe, it, expect } from "vitest";
import type { CdrAgent } from "@cdr-kit/agent";
import { getCdrActionProvider } from "../src/index.js";

const stub = {
  discover: async () => [],
  access: async (uuid: number) => new TextEncoder().encode(`data-${uuid}`),
  subscribeAndAccess: async () => new TextEncoder().encode("x"),
} as unknown as CdrAgent;

const wallet = { getNetwork: () => ({ protocolFamily: "evm", networkId: "story-aeneid", chainId: "1315" }) } as never;
const actions = () => getCdrActionProvider(stub).getActions(wallet);
// AgentKit prefixes custom-action names with the provider class ("CustomActionProvider_…").
const find = (suffix: string) => actions().find((a) => a.name.endsWith(suffix))!;

describe("getCdrActionProvider (Coinbase AgentKit)", () => {
  it("exposes the three CDR actions", () => {
    const bare = actions()
      .map((a) => a.name.replace("CustomActionProvider_", ""))
      .sort();
    expect(bare).toContain("cdr_access_vault"); expect(bare).toContain("cdr_discover_vaults"); expect(bare).toContain("cdr_subscribe_and_access"); expect(bare.length).toBe(34);
  });

  it("an action routes through to the agent", async () => {
    const out = await find("cdr_access_vault").invoke({ uuid: 7 });
    expect(String(out)).toContain("data-7");
  });

  it("rejects malformed input (AgentKit parses the schema before invoke)", async () => {
    await expect(Promise.resolve().then(() => find("cdr_access_vault").invoke({}))).rejects.toThrow();
  });
});
