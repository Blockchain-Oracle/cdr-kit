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
    expect(tools.map((t) => t.name).sort()).toEqual(["cdr_access_license_gated","cdr_access_vault","cdr_approve_multi_sig","cdr_attach_license_terms","cdr_check_entitlement","cdr_create_dead_man_vault","cdr_create_escrow_vault","cdr_create_multi_sig_vault","cdr_create_time_window_vault","cdr_create_vault","cdr_creator_vaults","cdr_discover_vaults","cdr_estimate_cost","cdr_get_fees","cdr_get_vault_info","cdr_list_subscriptions","cdr_mint_license_token","cdr_publish_data","cdr_register_ip","cdr_subscribe_and_access","cdr_upload_file","cdr_write_vault_data"]);
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
