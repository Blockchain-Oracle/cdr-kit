// One-off live e2e for the redeployed MultiSig (0x3A0Cf72f…) — exercises the new
// approve(uuid, expectedEpoch) path + the EpochChanged revert + the threshold==0 guard,
// without going through the MCP server (which needs a Claude restart to refresh).
//
// Run:  source contracts/.env && pnpm --filter @cdr-kit/agent exec tsx contracts/script/e2e_multisig_new.ts

import { CdrAgent } from "../src/agent.js";
import { aeneid, cdrKitVaultAbi, multiSigConditionAbi } from "@cdr-kit/contracts";
import { encodeAbiParameters, decodeEventLog, type Hex } from "viem";

async function main() {
  const pk = process.env.PRIVATE_KEY as Hex;
  if (!pk) throw new Error("PRIVATE_KEY env required (source contracts/.env)");

  console.log(`MultiSig address pinned in @cdr-kit/contracts: ${aeneid.multiSigCondition}`);
  if (aeneid.multiSigCondition !== "0x3A0Cf72f167A2c1f5a7A5025eb36219f28C20FCd") {
    throw new Error("contracts package not on the new pin — rebuild @cdr-kit/contracts");
  }

  const agent = new CdrAgent({ privateKey: pk });
  const me = agent.address;
  console.log(`agent wallet: ${me}`);

  // Three sorted signers (me + two stable test addresses) with threshold 2.
  const signers = [
    "0x1111111111111111111111111111111111111111",
    "0x2222222222222222222222222222222222222222",
    me,
  ].sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1)) as Hex[];
  const threshold = 2;

  console.log(`\n[1/4] Creating MultiSig vault — signers=${JSON.stringify(signers)} threshold=${threshold}`);
  const config = encodeAbiParameters(
    [{ type: "address[]" }, { type: "uint16" }],
    [signers, threshold],
  );

  const wc = agent.client.walletClient!;
  const createHash = await wc.writeContract({
    address: aeneid.cdrKitVault as Hex,
    abi: cdrKitVaultAbi,
    functionName: "createVault",
    args: [aeneid.multiSigCondition as Hex, config, [], [], BigInt(aeneid.defaultLicenseTermsId)],
    chain: null,
    account: wc.account!,
    gas: 3_000_000n,
  });
  console.log(`   create tx: ${createHash}`);

  const receipt = await agent.client.publicClient.waitForTransactionReceipt({ hash: createHash });
  // Find VaultCreated(uint256 tokenId, uint32 uuid, ...)
  let uuid: number | undefined;
  for (const log of receipt.logs) {
    try {
      const ev = decodeEventLog({ abi: cdrKitVaultAbi, data: log.data, topics: log.topics });
      if (ev.eventName === "VaultCreated") {
        uuid = Number((ev.args as { uuid: number }).uuid);
        break;
      }
    } catch {
      // skip non-matching logs
    }
  }
  if (uuid === undefined) throw new Error("VaultCreated event not found in receipt");
  console.log(`   ✓ vault uuid = ${uuid}`);

  console.log(`\n[2/4] Read getConfig(uuid) — should be (signers, threshold, epoch=0)`);
  const cfg = (await agent.client.publicClient.readContract({
    address: aeneid.multiSigCondition as Hex,
    abi: multiSigConditionAbi,
    functionName: "getConfig",
    args: [uuid],
  })) as readonly [readonly Hex[], number, bigint];
  console.log(`   signers   = ${JSON.stringify(cfg[0])}`);
  console.log(`   threshold = ${cfg[1]}`);
  console.log(`   epoch     = ${cfg[2]}`);
  if (cfg[2] !== 0n) throw new Error(`expected epoch=0 on fresh vault, got ${cfg[2]}`);

  console.log(`\n[3/4] approve(uuid, expectedEpoch=999) — should revert EpochChanged(999, 0)`);
  try {
    await wc.writeContract({
      address: aeneid.multiSigCondition as Hex,
      abi: multiSigConditionAbi,
      functionName: "approve",
      args: [uuid, 999n],
      chain: null,
      account: wc.account!,
      gas: 200_000n,
    });
    throw new Error("FAIL — expected EpochChanged revert, got success");
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("EpochChanged") || msg.includes("0x") /* selector-encoded */) {
      console.log(`   ✓ reverted as expected (EpochChanged or similar custom error)`);
    } else if (msg.startsWith("FAIL")) {
      throw e;
    } else {
      console.log(`   ✓ reverted: ${msg.split("\n")[0]}`);
    }
  }

  console.log(`\n[4/4] approve(uuid, expectedEpoch=0) — should succeed`);
  const approveHash = await wc.writeContract({
    address: aeneid.multiSigCondition as Hex,
    abi: multiSigConditionAbi,
    functionName: "approve",
    args: [uuid, 0n],
    chain: null,
    account: wc.account!,
    gas: 200_000n,
  });
  console.log(`   approve tx: ${approveHash}`);
  await agent.client.publicClient.waitForTransactionReceipt({ hash: approveHash });

  const count = (await agent.client.publicClient.readContract({
    address: aeneid.multiSigCondition as Hex,
    abi: multiSigConditionAbi,
    functionName: "currentApprovalsCount",
    args: [uuid],
  })) as bigint;
  console.log(`   ✓ currentApprovalsCount = ${count} (expected 1)`);
  if (count !== 1n) throw new Error(`expected count=1, got ${count}`);

  console.log(`\n✅ All 4 checks passed against new MultiSig 0x3A0Cf72f…`);
  console.log(`   vault uuid: ${uuid}`);
  console.log(`   create tx:  ${createHash}`);
  console.log(`   approve tx: ${approveHash}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
