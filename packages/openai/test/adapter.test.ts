import { describe, it, expect } from "vitest";
import type { CdrAgent } from "@cdr-kit/agent";
import { getOpenAITools } from "../src/index.js";

// A stub agent with just the methods the tools call — proves the adapter routes correctly.
const stub = {
  discover: async () => [{ uuid: 1, ipId: "0x01", creator: "0x02", tokenId: 7n }],
  access: async (uuid: number) => new TextEncoder().encode(`data-${uuid}`),
  subscribeAndAccess: async () => new TextEncoder().encode("paid-secret"),
} as unknown as CdrAgent;

describe("getOpenAITools", () => {
  it("produces valid OpenAI function tools with JSON-Schema params", () => {
    const { tools } = getOpenAITools(stub);
    expect(tools.map((t) => t.function.name).sort()).toEqual(["cdr_access_license_gated","cdr_access_vault","cdr_attach_license_terms","cdr_check_entitlement","cdr_create_dead_man_vault","cdr_create_escrow_vault","cdr_create_multi_sig_vault","cdr_create_time_window_vault","cdr_create_vault","cdr_creator_vaults","cdr_discover_vaults","cdr_estimate_cost","cdr_get_fees","cdr_get_vault_info","cdr_list_subscriptions","cdr_mint_license_token","cdr_publish_data","cdr_register_ip","cdr_subscribe_and_access","cdr_upload_file","cdr_write_vault_data"]);
    for (const t of tools) {
      expect(t.type).toBe("function");
      expect(t.function.parameters).toMatchObject({ type: "object" });
      expect(typeof t.function.description).toBe("string");
    }
  });

  it("dispatch routes a tool call through to the agent (string or object args)", async () => {
    const { dispatch } = getOpenAITools(stub);
    const viaObj = await dispatch("cdr_access_vault", { uuid: 42 });
    expect(viaObj).toEqual({ uuid: 42, text: "data-42" });
    const viaStr = await dispatch("cdr_access_vault", JSON.stringify({ uuid: 9 }));
    expect(viaStr).toEqual({ uuid: 9, text: "data-9" });
  });

  it("throws on an unknown tool", async () => {
    const { dispatch } = getOpenAITools(stub);
    await expect(dispatch("nope", {})).rejects.toThrow(/unknown tool/);
  });
});
