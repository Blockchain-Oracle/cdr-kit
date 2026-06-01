import type { CdrAgent } from "@cdr-kit/agent";
import type { CdrTool } from "./types.js";
import {
  creatorVaultsSchema,
  entitlementSchema,
  estimateCostSchema,
  feesSchema,
  listSubscriptionsSchema,
  vaultInfoSchema,
} from "./schemas.js";

/** View-only introspection tools — no wallet writes, no gas. */
export function introspectTools(agent: CdrAgent): CdrTool[] {
  return [
    {
      name: "cdr_get_vault_info",
      description:
        "Read on-chain metadata for a CDR vault (tokenId, ipId, creator, licenseTermsId). Call this BEFORE subscribing to learn about a vault. View-only, no gas.",
      inputSchema: vaultInfoSchema,
      invoke: async (raw) => {
        const { uuid } = vaultInfoSchema.parse(raw);
        const info = await agent.getVaultInfo(uuid);
        if (!info) return { uuid, found: false };
        return {
          uuid: info.uuid,
          tokenId: info.tokenId.toString(),
          ipId: info.ipId,
          creator: info.creator,
          licenseTermsId: info.licenseTermsId.toString(),
        };
      },
    },
    {
      name: "cdr_creator_vaults",
      description:
        "List every vault a given creator has minted. Returns uuid + ipId + licenseTermsId per vault. Use to browse one author's catalog.",
      inputSchema: creatorVaultsSchema,
      invoke: async (raw) => {
        const { creator } = creatorVaultsSchema.parse(raw);
        const vaults = await agent.getCreatorVaults(creator as `0x${string}`);
        return vaults.map((v) => ({
          uuid: v.uuid,
          tokenId: v.tokenId.toString(),
          ipId: v.ipId,
          creator: v.creator,
          licenseTermsId: v.licenseTermsId.toString(),
        }));
      },
    },
    {
      name: "cdr_check_entitlement",
      description:
        "Check whether an address is currently subscribed to a vault — returns paidUntil unix timestamp + isEntitled bool. Use to avoid paying twice or to decide between subscribe vs access.",
      inputSchema: entitlementSchema,
      invoke: async (raw) => {
        const { uuid, subscriber } = entitlementSchema.parse(raw);
        return agent.getEntitlement(uuid, subscriber ? { subscriber: subscriber as `0x${string}` } : undefined);
      },
    },
    {
      name: "cdr_estimate_cost",
      description:
        "Look up a subscription-gated vault's plan (pricePerPeriod wei, period seconds, payee, mode). View-only. Use to budget before subscribing.",
      inputSchema: estimateCostSchema,
      invoke: async (raw) => {
        const { uuid } = estimateCostSchema.parse(raw);
        const plan = await agent.getSubscriptionPlan(uuid);
        return {
          uuid: plan.uuid,
          pricePerPeriodWei: plan.pricePerPeriodWei.toString(),
          periodSeconds: plan.periodSeconds.toString(),
          payee: plan.payee,
          mode: plan.mode,
          licensorIpId: plan.licensorIpId,
        };
      },
    },
    {
      name: "cdr_list_subscriptions",
      description:
        "List all vaults the agent is currently subscribed to (filters recent VaultCreated events by paidUntil > now). Use for budget tracking and renewal decisions.",
      inputSchema: listSubscriptionsSchema,
      invoke: async (raw) => {
        const { fromBlock } = listSubscriptionsSchema.parse(raw);
        const subs = await agent.listMySubscriptions(fromBlock !== undefined ? { fromBlock: BigInt(fromBlock) } : undefined);
        return subs.map((s) => ({
          uuid: s.uuid,
          ipId: s.ipId,
          creator: s.creator,
          paidUntilUnix: s.paidUntilUnix,
          expiresInSeconds: s.expiresInSeconds,
        }));
      },
    },
    {
      name: "cdr_get_fees",
      description:
        "Fetch the current CDR operation fees (allocate / write / read in wei) and the operational decryption threshold. View-only, no wallet needed.",
      inputSchema: feesSchema,
      invoke: async () => {
        const f = await agent.getFees();
        return {
          allocateWei: f.allocateWei.toString(),
          writeWei: f.writeWei.toString(),
          readWei: f.readWei.toString(),
          threshold: f.threshold,
        };
      },
    },
  ];
}
