import { encodeAbiParameters, type Hex } from "viem";
import {
  resolveAddresses,
  deadManSwitchConditionAbi,
  multiSigConditionAbi,
  conditionalEscrowConditionAbi,
} from "@cdr-kit/contracts";
import type { CdrAgent } from "./agent.js";
import { log } from "./logger.js";

/** Create a vault gated by a time window. `endTs = 0` means open-ended after `startTs`. */
export async function createTimeWindowVault(
  agent: CdrAgent,
  p: { startTs: bigint; endTs: bigint; blockBased?: boolean; licenseTermsId?: bigint; valueWei?: bigint },
): Promise<Hex> {
  const addrs = resolveAddresses(agent.network);
  const readConfig = encodeAbiParameters(
    [{ type: "uint64" }, { type: "uint64" }, { type: "bool" }],
    [p.startTs, p.endTs, p.blockBased ?? false],
  );
  log.info({ start: p.startTs, end: p.endTs }, "create time-window vault");
  return agent.createVault({
    readConditionAddr: addrs.timeWindowCondition as Hex,
    readConfig,
    licenseTermsId: p.licenseTermsId,
    valueWei: p.valueWei,
  });
}

/** Create a vault that unlocks to `heirs` (or public) if the creator stops poking. Helper
 *  defaults `creatorCanReadWhileLocked = true` so the creator doesn't accidentally lock
 *  themselves out pre-unlock — recommend the agent add itself to `heirs` for post-unlock too. */
export async function createDeadManVault(
  agent: CdrAgent,
  p: {
    duration: bigint;
    heirs: Hex[];
    blockBased?: boolean;
    creatorCanReadWhileLocked?: boolean;
    publicAfterUnlock?: boolean;
    licenseTermsId?: bigint;
    valueWei?: bigint;
  },
): Promise<Hex> {
  const addrs = resolveAddresses(agent.network);
  const readConfig = encodeAbiParameters(
    [{ type: "uint64" }, { type: "address[]" }, { type: "bool" }, { type: "bool" }, { type: "bool" }],
    [p.duration, p.heirs, p.blockBased ?? false, p.creatorCanReadWhileLocked ?? true, p.publicAfterUnlock ?? false],
  );
  log.info({ duration: p.duration, heirs: p.heirs.length }, "create dead-man-switch vault");
  return agent.createVault({
    readConditionAddr: addrs.deadManSwitchCondition as Hex,
    readConfig,
    licenseTermsId: p.licenseTermsId,
    valueWei: p.valueWei,
  });
}

/** Create a vault that releases to `buyer` only after they `pay` + `confirmDelivery`. `arbiter`
 *  can refund the buyer if delivery is disputed. `address(0)` arbiter = no refund path. */
export async function createEscrowVault(
  agent: CdrAgent,
  p: { seller?: Hex; price: bigint; timeoutSecs: bigint; arbiter?: Hex; licenseTermsId?: bigint; valueWei?: bigint },
): Promise<Hex> {
  const addrs = resolveAddresses(agent.network);
  const seller = p.seller ?? agent.address;
  if (!seller) throw new Error("agent has no wallet address — set CDR_PRIVATE_KEY");
  const readConfig = encodeAbiParameters(
    [{ type: "address" }, { type: "uint128" }, { type: "uint64" }, { type: "address" }],
    [seller, p.price, p.timeoutSecs, p.arbiter ?? "0x0000000000000000000000000000000000000000"],
  );
  log.info({ price: p.price, seller }, "create escrow vault");
  return agent.createVault({
    readConditionAddr: addrs.conditionalEscrowCondition as Hex,
    readConfig,
    licenseTermsId: p.licenseTermsId,
    valueWei: p.valueWei,
  });
}

/** Create an N-of-M multi-sig vault. `signers` MUST be sorted strictly ascending (helper sorts
 *  for the caller). Read access requires `threshold`-many EIP-712 signatures from configured
 *  signers, submitted as `accessAuxData = abi.encode(deadline, sigs[])`. */
export async function createMultiSigVault(
  agent: CdrAgent,
  p: { signers: Hex[]; threshold: number; licenseTermsId?: bigint; valueWei?: bigint },
): Promise<Hex> {
  const addrs = resolveAddresses(agent.network);
  const sorted = [...p.signers].sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1));
  const readConfig = encodeAbiParameters([{ type: "address[]" }, { type: "uint16" }], [sorted, p.threshold]);
  log.info({ signers: sorted.length, threshold: p.threshold }, "create multi-sig vault");
  return agent.createVault({
    readConditionAddr: addrs.multiSigCondition as Hex,
    readConfig,
    licenseTermsId: p.licenseTermsId,
    valueWei: p.valueWei,
  });
}

/** On-chain `approve(uuid, expectedEpoch)` for the Safe-style multi-sig path. Signer pays gas;
 *  the approval is recorded against the current epoch and visible via `currentApprovalsCount(uuid)`.
 *
 *  Reads the current epoch from `getConfig(uuid)` immediately before sending so the tx is bound to
 *  the signer set the dashboard showed when they clicked approve. If a rotation lands first the tx
 *  reverts with `EpochChanged(expected, current)` — the UI should re-prompt with the new signer
 *  set rather than silently bind the approval. Pass an explicit `expectedEpoch` to skip the read
 *  (advanced flows where the caller has already fetched epoch atomically with other state). */
export async function approveMultiSig(
  agent: CdrAgent,
  uuid: number,
  expectedEpoch?: bigint,
): Promise<Hex> {
  const addrs = resolveAddresses(agent.network);
  const wc = agent.client.walletClient;
  if (!wc) throw new Error("agent has no wallet client");
  let epoch = expectedEpoch;
  if (epoch === undefined) {
    const cfg = (await agent.client.publicClient.readContract({
      address: addrs.multiSigCondition as Hex,
      abi: multiSigConditionAbi,
      functionName: "getConfig",
      args: [uuid],
    })) as readonly [readonly Hex[], number, bigint];
    epoch = cfg[2];
  }
  return wc.writeContract({
    address: addrs.multiSigCondition as Hex,
    abi: multiSigConditionAbi,
    functionName: "approve",
    args: [uuid, epoch],
    chain: null,
    account: wc.account!,
  });
}

/** Creator-side heartbeat for a dead-man-switch vault. Resets the unlock countdown. */
export async function pokeDeadMan(agent: CdrAgent, uuid: number): Promise<Hex> {
  const addrs = resolveAddresses(agent.network);
  const wc = agent.client.walletClient;
  if (!wc) throw new Error("agent has no wallet client");
  return wc.writeContract({
    address: addrs.deadManSwitchCondition as Hex,
    abi: deadManSwitchConditionAbi,
    functionName: "poke",
    args: [uuid],
    chain: null,
    account: wc.account!,
  });
}

/** Sign an EIP-712 `Approval(uuid, caller, epoch, deadline)` for a multi-sig vault. The caller
 *  must be the address that will submit the read tx (sigs are caller-bound). Returns 65-byte sig. */
export async function signMultiSigApproval(
  agent: CdrAgent,
  p: { uuid: number; caller: Hex; deadline: bigint },
): Promise<Hex> {
  const addrs = resolveAddresses(agent.network);
  const wc = agent.client.walletClient;
  if (!wc) throw new Error("agent has no wallet client");
  const verifyingContract = addrs.multiSigCondition as Hex;
  const cfg = (await agent.client.publicClient.readContract({
    address: verifyingContract,
    abi: multiSigConditionAbi,
    functionName: "getConfig",
    args: [p.uuid],
  })) as readonly [readonly Hex[], number, bigint];
  return wc.signTypedData({
    account: wc.account!,
    domain: {
      name: "cdr-kit:MultiSigCondition",
      version: "1",
      chainId: agent.client.publicClient.chain!.id,
      verifyingContract,
    },
    types: {
      Approval: [
        { name: "uuid", type: "uint32" },
        { name: "caller", type: "address" },
        { name: "epoch", type: "uint64" },
        { name: "deadline", type: "uint64" },
      ],
    },
    primaryType: "Approval",
    message: { uuid: p.uuid, caller: p.caller, epoch: cfg[2], deadline: p.deadline },
  });
}

/** Read a multi-sig vault by submitting `threshold`-many signatures as `accessAuxData`. The
 *  contract dedupes by recovered address ascending, so sigs must be sorted by signer address. */
export async function accessMultiSig(
  agent: CdrAgent,
  p: { uuid: number; deadline: bigint; sigs: Hex[] },
): Promise<Uint8Array> {
  const aux = encodeAbiParameters([{ type: "uint64" }, { type: "bytes[]" }], [p.deadline, p.sigs]);
  return agent.access(p.uuid, aux);
}

/** Pay into a conditional escrow vault — buyer side, step 1 of the 2-step delivery flow. */
export async function payEscrow(agent: CdrAgent, p: { uuid: number; price: bigint }): Promise<Hex> {
  const addrs = resolveAddresses(agent.network);
  const wc = agent.client.walletClient;
  if (!wc) throw new Error("agent has no wallet client");
  return wc.writeContract({
    address: addrs.conditionalEscrowCondition as Hex,
    abi: conditionalEscrowConditionAbi,
    functionName: "pay",
    args: [p.uuid],
    value: p.price,
    chain: null,
    account: wc.account!,
  });
}

/** Seller-side: claim escrow funds + auto-grant buyer read access after `timeoutSecs` of
 *  buyer silence. Must be called by the configured seller for that listing. */
export async function claimEscrowAfterTimeout(
  agent: CdrAgent,
  p: { uuid: number; buyer: Hex },
): Promise<Hex> {
  const addrs = resolveAddresses(agent.network);
  const wc = agent.client.walletClient;
  if (!wc) throw new Error("agent has no wallet client");
  return wc.writeContract({
    address: addrs.conditionalEscrowCondition as Hex,
    abi: conditionalEscrowConditionAbi,
    functionName: "claimAfterTimeout",
    args: [p.uuid, p.buyer],
    chain: null,
    account: wc.account!,
  });
}

/** Arbiter-side: refund a buyer who paid but disputes delivery. Resets paidAt; buyer can re-pay. */
export async function refundEscrow(
  agent: CdrAgent,
  p: { uuid: number; buyer: Hex },
): Promise<Hex> {
  const addrs = resolveAddresses(agent.network);
  const wc = agent.client.walletClient;
  if (!wc) throw new Error("agent has no wallet client");
  return wc.writeContract({
    address: addrs.conditionalEscrowCondition as Hex,
    abi: conditionalEscrowConditionAbi,
    functionName: "arbiterRefund",
    args: [p.uuid, p.buyer],
    chain: null,
    account: wc.account!,
  });
}

/** Creator-side: swap multi-sig signer set / threshold. Bumps `epoch`, which invalidates
 *  BOTH in-flight off-chain sigs AND on-chain approvals from the previous epoch. */
export async function rotateMultiSigSigners(
  agent: CdrAgent,
  p: { uuid: number; signers: Hex[]; threshold: number },
): Promise<Hex> {
  const addrs = resolveAddresses(agent.network);
  const wc = agent.client.walletClient;
  if (!wc) throw new Error("agent has no wallet client");
  const sorted = [...p.signers].sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1));
  return wc.writeContract({
    address: addrs.multiSigCondition as Hex,
    abi: multiSigConditionAbi,
    functionName: "rotateSigners",
    args: [p.uuid, sorted, p.threshold],
    chain: null,
    account: wc.account!,
  });
}

/** Buyer confirms delivery — releases funds to seller AND grants read access. */
export async function confirmEscrowDelivery(agent: CdrAgent, uuid: number): Promise<Hex> {
  const addrs = resolveAddresses(agent.network);
  const wc = agent.client.walletClient;
  if (!wc) throw new Error("agent has no wallet client");
  return wc.writeContract({
    address: addrs.conditionalEscrowCondition as Hex,
    abi: conditionalEscrowConditionAbi,
    functionName: "confirmDelivery",
    args: [uuid],
    chain: null,
    account: wc.account!,
  });
}
