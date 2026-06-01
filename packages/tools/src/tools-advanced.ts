import { z } from "zod";
import type { CdrAgent } from "@cdr-kit/agent";
import type { CdrTool } from "./types.js";
import {
  createDeadManSchema,
  createEscrowSchema,
  createMultiSigSchema,
  createTimeWindowSchema,
} from "./schemas.js";

const approveMultiSigSchema = z.object({
  uuid: z.number().int().describe("MultiSigCondition-gated vault uuid to approve."),
});

/** 0.5.0 advanced-condition vault creators (TimeWindow / DeadMan / Escrow / MultiSig). */
export function advancedConditionTools(agent: CdrAgent): CdrTool[] {
  return [
    {
      name: "cdr_create_time_window_vault",
      description:
        "Create a Story CDR vault gated by an absolute time (or block) window. Read access is only allowed during [startTs, endTs]. Use endTs=0 for 'open-ended after startTs' (release-on-date pattern). Returns the tx hash; read the uuid from the VaultCreated event in the receipt.",
      inputSchema: createTimeWindowSchema,
      invoke: async (raw) => {
        const p = createTimeWindowSchema.parse(raw);
        const txHash = await agent.createTimeWindowVault({
          startTs: BigInt(p.startTs),
          endTs: BigInt(p.endTs),
          blockBased: p.blockBased,
          licenseTermsId: p.licenseTermsId ? BigInt(p.licenseTermsId) : undefined,
          valueWei: p.valueWei ? BigInt(p.valueWei) : undefined,
        });
        return { txHash };
      },
    },
    {
      name: "cdr_create_dead_man_vault",
      description:
        "Create a dead-man-switch Story CDR vault. The creator must call cdr_poke_dead_man before each `duration` window elapses, or read access flips to `heirs` (or public). The canonical wallet-recovery / leak-on-disappearance pattern.",
      inputSchema: createDeadManSchema,
      invoke: async (raw) => {
        const p = createDeadManSchema.parse(raw);
        const txHash = await agent.createDeadManVault({
          duration: BigInt(p.duration),
          heirs: p.heirs as `0x${string}`[],
          blockBased: p.blockBased,
          creatorCanReadWhileLocked: p.creatorCanReadWhileLocked,
          publicAfterUnlock: p.publicAfterUnlock,
          licenseTermsId: p.licenseTermsId ? BigInt(p.licenseTermsId) : undefined,
          valueWei: p.valueWei ? BigInt(p.valueWei) : undefined,
        });
        return { txHash };
      },
    },
    {
      name: "cdr_create_escrow_vault",
      description:
        "Create a Story CDR vault released to a buyer only after they pay + confirm delivery. Optional arbiter can refund disputed deals. Seller can also unilaterally claim after `timeoutSecs` of buyer silence.",
      inputSchema: createEscrowSchema,
      invoke: async (raw) => {
        const p = createEscrowSchema.parse(raw);
        const txHash = await agent.createEscrowVault({
          seller: p.seller as `0x${string}` | undefined,
          price: BigInt(p.price),
          timeoutSecs: BigInt(p.timeoutSecs),
          arbiter: p.arbiter as `0x${string}` | undefined,
          licenseTermsId: p.licenseTermsId ? BigInt(p.licenseTermsId) : undefined,
          valueWei: p.valueWei ? BigInt(p.valueWei) : undefined,
        });
        return { txHash };
      },
    },
    {
      name: "cdr_create_multi_sig_vault",
      description:
        "Create an N-of-M multi-sig Story CDR vault. Read access requires `threshold`-many approvals — either as off-chain EIP-712 sigs collected and submitted at read time (gas-free for signers), or as on-chain `approve()` txs (Safe-style; dashboards read chain). Both paths share the same signer set.",
      inputSchema: createMultiSigSchema,
      invoke: async (raw) => {
        const p = createMultiSigSchema.parse(raw);
        const txHash = await agent.createMultiSigVault({
          signers: p.signers as `0x${string}`[],
          threshold: p.threshold,
          licenseTermsId: p.licenseTermsId ? BigInt(p.licenseTermsId) : undefined,
          valueWei: p.valueWei ? BigInt(p.valueWei) : undefined,
        });
        return { txHash };
      },
    },
    {
      name: "cdr_approve_multi_sig",
      description:
        "Safe-style on-chain approval for a multi-sig CDR vault. The agent's wallet must be one of the configured signers. Once `threshold`-many signers have called approve, anyone can read the vault — no off-chain sig collection needed.",
      inputSchema: approveMultiSigSchema,
      invoke: async (raw) => {
        const { uuid } = approveMultiSigSchema.parse(raw);
        const txHash = await agent.approveMultiSig(uuid);
        return { txHash };
      },
    },
  ];
}
