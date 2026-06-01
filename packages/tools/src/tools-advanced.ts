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
  expectedEpoch: z
    .union([z.bigint(), z.number(), z.string()])
    .optional()
    .describe(
      "Optional epoch to bind the approval to. Omit and the agent reads the current epoch from getConfig immediately before sending — safe default. Pass explicitly to fail-fast if a rotation might be racing.",
    ),
});

const uuidOnlySchema = z.object({
  uuid: z.number().int().describe("Vault uuid"),
});

const escrowMutateSchema = z.object({
  uuid: z.number().int(),
  buyer: z.string().describe("Buyer address (the wallet that called pay() on this listing)"),
});

const payEscrowSchema = z.object({
  uuid: z.number().int(),
  price: z.string().describe("Listing price in wei (decimal) — excess refunded automatically"),
});

const rotateSignersSchema = z.object({
  uuid: z.number().int(),
  signers: z.array(z.string()).min(1).describe("New signer set (auto-sorted ascending)"),
  threshold: z.number().int().min(1).describe("New threshold"),
});

const signMultiSigApprovalSchema = z.object({
  uuid: z.number().int(),
  caller: z.string().describe("Address that will submit the read tx (sigs bind to caller)"),
  deadline: z.string().describe("Unix timestamp after which the sig expires (decimal)"),
});

const accessMultiSigSchema = z.object({
  uuid: z.number().int(),
  deadline: z.string().describe("Deadline the sigs were signed against (must still be future)"),
  sigs: z.array(z.string()).describe("0x-hex sigs, sorted by recovered signer address ascending"),
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
        const { uuid, expectedEpoch } = approveMultiSigSchema.parse(raw);
        const epoch = expectedEpoch === undefined ? undefined : BigInt(expectedEpoch);
        const txHash = await agent.approveMultiSig(uuid, epoch);
        return { txHash };
      },
    },
    {
      name: "cdr_sign_multi_sig_approval",
      description:
        "Off-chain EIP-712 sign for a multi-sig vault approval. Returns the 65-byte signature; collect threshold-many sigs from different signers and submit via cdr_access_multi_sig.",
      inputSchema: signMultiSigApprovalSchema,
      invoke: async (raw) => {
        const p = signMultiSigApprovalSchema.parse(raw);
        const signature = await agent.signMultiSigApproval({
          uuid: p.uuid,
          caller: p.caller as `0x${string}`,
          deadline: BigInt(p.deadline),
        });
        return { signature };
      },
    },
    {
      name: "cdr_access_multi_sig",
      description:
        "Read a multi-sig vault by submitting threshold-many EIP-712 sigs as accessAuxData. Sigs must be sorted by recovered signer address ascending. Returns the decrypted text.",
      inputSchema: accessMultiSigSchema,
      invoke: async (raw) => {
        const p = accessMultiSigSchema.parse(raw);
        const data = await agent.accessMultiSig({
          uuid: p.uuid,
          deadline: BigInt(p.deadline),
          sigs: p.sigs as `0x${string}`[],
        });
        return { uuid: p.uuid, text: new TextDecoder().decode(data) };
      },
    },
    {
      name: "cdr_rotate_multi_sig_signers",
      description:
        "Creator-only: swap multi-sig signer set / threshold. Bumps epoch — invalidates BOTH in-flight off-chain sigs AND on-chain approvals from the previous epoch. Use to remove a compromised signer immediately.",
      inputSchema: rotateSignersSchema,
      invoke: async (raw) => {
        const p = rotateSignersSchema.parse(raw);
        const txHash = await agent.rotateMultiSigSigners({
          uuid: p.uuid,
          signers: p.signers as `0x${string}`[],
          threshold: p.threshold,
        });
        return { txHash };
      },
    },
    {
      name: "cdr_poke_dead_man",
      description:
        "Creator-only: reset the dead-man-switch heartbeat. Bumps unlockAt back to `now + duration`. Cannot poke after the window has lapsed (one-way trapdoor).",
      inputSchema: uuidOnlySchema,
      invoke: async (raw) => {
        const { uuid } = uuidOnlySchema.parse(raw);
        const txHash = await agent.pokeDeadMan(uuid);
        return { txHash };
      },
    },
    {
      name: "cdr_pay_escrow",
      description:
        "Buyer-side step 1: escrow the listing price for a ConditionalEscrow vault. Excess value is refunded same-tx. Returns the pay tx hash.",
      inputSchema: payEscrowSchema,
      invoke: async (raw) => {
        const p = payEscrowSchema.parse(raw);
        const txHash = await agent.payEscrow({ uuid: p.uuid, price: BigInt(p.price) });
        return { txHash };
      },
    },
    {
      name: "cdr_confirm_escrow_delivery",
      description:
        "Buyer-side step 2: confirm delivery. Releases the escrowed funds to the seller AND grants the buyer read access. Returns the confirm tx hash.",
      inputSchema: uuidOnlySchema,
      invoke: async (raw) => {
        const { uuid } = uuidOnlySchema.parse(raw);
        const txHash = await agent.confirmEscrowDelivery(uuid);
        return { txHash };
      },
    },
    {
      name: "cdr_claim_escrow_after_timeout",
      description:
        "Seller-side: claim escrow funds + grant buyer read access after `timeoutSecs` of buyer silence. Caller must be the configured seller.",
      inputSchema: escrowMutateSchema,
      invoke: async (raw) => {
        const p = escrowMutateSchema.parse(raw);
        const txHash = await agent.claimEscrowAfterTimeout({
          uuid: p.uuid,
          buyer: p.buyer as `0x${string}`,
        });
        return { txHash };
      },
    },
    {
      name: "cdr_refund_escrow",
      description:
        "Arbiter-side: refund a buyer who paid but disputes delivery. Resets the buyer's paidAt to 0 (they can re-pay later). Caller must be the configured arbiter.",
      inputSchema: escrowMutateSchema,
      invoke: async (raw) => {
        const p = escrowMutateSchema.parse(raw);
        const txHash = await agent.refundEscrow({
          uuid: p.uuid,
          buyer: p.buyer as `0x${string}`,
        });
        return { txHash };
      },
    },
  ];
}
