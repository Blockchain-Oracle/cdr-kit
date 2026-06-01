// Live e2e for the off-chain EIP-712 sig path on the redeployed MultiSig (0x3A0Cf72f…).
// Mirrors what `useSignMultiSigApproval` does in @cdr-kit/react: build typed data → signTypedData →
// pass sigs as `accessAuxData` → contract's `checkReadCondition` returns true.
//
// Does NOT write encrypted vault data (that requires the CDR precompile and 3M-gas writes);
// instead asserts `checkReadCondition` view returns true with 2-of-3 sigs and false with 1-of-3.
// The on-chain decrypt path is forge-tested + was exercised earlier via the on-chain `approve`
// flow — this script closes the only remaining end-to-end gap for 0.5.1: the React-hook → contract
// roundtrip on the off-chain sig path.
//
// Run:  source contracts/.env && pnpm --filter @cdr-kit/agent exec \
//         env PRIVATE_KEY=$PRIVATE_KEY AENEID_RPC=$AENEID_RPC \
//         tsx scripts/e2e_multisig_offchain.ts

import { CdrAgent } from "../src/agent.js";
import { aeneid, cdrKitVaultAbi, multiSigConditionAbi } from "@cdr-kit/contracts";
import {
  encodeAbiParameters,
  decodeEventLog,
  createWalletClient,
  http,
  type Hex,
} from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

async function main() {
  const pk = process.env.PRIVATE_KEY as Hex;
  if (!pk) throw new Error("PRIVATE_KEY env required (source contracts/.env)");

  console.log(`MultiSig pinned: ${aeneid.multiSigCondition}`);
  if (aeneid.multiSigCondition !== "0x3A0Cf72f167A2c1f5a7A5025eb36219f28C20FCd") {
    throw new Error("contracts package not on the new pin — rebuild @cdr-kit/contracts");
  }

  const agent = new CdrAgent({ privateKey: pk });
  console.log(`deployer wallet: ${agent.address}`);

  // Generate two ephemeral signer keys for the off-chain path test.
  const k1 = generatePrivateKey();
  const k2 = generatePrivateKey();
  const a1 = privateKeyToAccount(k1);
  const a2 = privateKeyToAccount(k2);

  // Signers must be sorted ascending (contract enforces strict-ascending dedupe on _store).
  const signers = [a1.address, a2.address].sort((a, b) =>
    BigInt(a) < BigInt(b) ? -1 : 1,
  ) as Hex[];
  const threshold = 2;

  console.log(`\n[1/5] Creating 2-of-2 MultiSig vault — ephemeral signers ${signers.join(", ")}`);
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
  let uuid: number | undefined;
  for (const log of receipt.logs) {
    try {
      const ev = decodeEventLog({ abi: cdrKitVaultAbi, data: log.data, topics: log.topics });
      if (ev.eventName === "VaultCreated") {
        uuid = Number((ev.args as { uuid: number }).uuid);
        break;
      }
    } catch {
      // not the event we want
    }
  }
  if (uuid === undefined) throw new Error("VaultCreated event not found in receipt");
  console.log(`   ✓ vault uuid = ${uuid}`);

  console.log(`\n[2/5] Read getConfig(uuid) — confirm signers + threshold + epoch=0`);
  const cfg = (await agent.client.publicClient.readContract({
    address: aeneid.multiSigCondition as Hex,
    abi: multiSigConditionAbi,
    functionName: "getConfig",
    args: [uuid],
  })) as readonly [readonly Hex[], number, bigint];
  console.log(`   signers   = ${JSON.stringify(cfg[0])}`);
  console.log(`   threshold = ${cfg[1]}, epoch = ${cfg[2]}`);
  if (cfg[2] !== 0n) throw new Error(`expected epoch=0, got ${cfg[2]}`);

  // Use the deployer address as the `caller` — anyone could submit, but the sig is bound to it.
  const caller = agent.address as Hex;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

  // Build the EIP-712 domain + types EXACTLY as useSignMultiSigApproval does.
  const domain = {
    name: "cdr-kit:MultiSigCondition",
    version: "1",
    chainId: aeneid.chainId,
    verifyingContract: aeneid.multiSigCondition as Hex,
  } as const;
  const types = {
    Approval: [
      { name: "uuid", type: "uint32" },
      { name: "caller", type: "address" },
      { name: "epoch", type: "uint64" },
      { name: "deadline", type: "uint64" },
    ],
  } as const;
  const message = { uuid, caller, epoch: cfg[2], deadline } as const;

  console.log(`\n[3/5] Each signer produces an EIP-712 Approval sig (same shape useSignMultiSigApproval uses)`);
  // Each ephemeral signer needs its own wallet client to call signTypedData.
  const w1 = createWalletClient({ account: a1, transport: http(aeneid.rpcUrl) });
  const w2 = createWalletClient({ account: a2, transport: http(aeneid.rpcUrl) });
  const sig1 = await w1.signTypedData({ account: a1, domain, types, primaryType: "Approval", message });
  const sig2 = await w2.signTypedData({ account: a2, domain, types, primaryType: "Approval", message });
  console.log(`   sig from ${a1.address}: ${sig1.slice(0, 12)}…${sig1.slice(-8)}`);
  console.log(`   sig from ${a2.address}: ${sig2.slice(0, 12)}…${sig2.slice(-8)}`);

  // Sort sigs by recovered signer address ASC — the contract enforces strict-ascending dedupe.
  const ordered: [Hex, Hex] =
    BigInt(a1.address) < BigInt(a2.address) ? [sig1, sig2] : [sig2, sig1];
  const aux = encodeAbiParameters([{ type: "uint64" }, { type: "bytes[]" }], [deadline, ordered]);

  console.log(`\n[4/5] checkReadCondition with 2 sigs — should be true`);
  const passes = (await agent.client.publicClient.readContract({
    address: aeneid.multiSigCondition as Hex,
    abi: multiSigConditionAbi,
    functionName: "checkReadCondition",
    args: [uuid, aux, "0x", caller],
  })) as boolean;
  console.log(`   checkReadCondition → ${passes}`);
  if (!passes) throw new Error("FAIL — 2 valid sigs should pass the 2-of-2 threshold");

  console.log(`\n[5/5] checkReadCondition with 1 sig — should be false (below threshold)`);
  const auxOne = encodeAbiParameters(
    [{ type: "uint64" }, { type: "bytes[]" }],
    [deadline, [sig1]],
  );
  const failsCheck = (await agent.client.publicClient.readContract({
    address: aeneid.multiSigCondition as Hex,
    abi: multiSigConditionAbi,
    functionName: "checkReadCondition",
    args: [uuid, auxOne, "0x", caller],
  })) as boolean;
  console.log(`   checkReadCondition → ${failsCheck}`);
  if (failsCheck) throw new Error("FAIL — 1 sig must NOT pass a threshold=2 vault");

  console.log(`\n✅ Off-chain sig roundtrip passes against deployed MultiSig 0x3A0Cf72f…`);
  console.log(`   vault uuid:        ${uuid}`);
  console.log(`   create tx:         ${createHash}`);
  console.log(`   signers (ephem.):  ${a1.address} ${a2.address}`);
  console.log(`   The same typed-data shape ships in useSignMultiSigApproval +`);
  console.log(`   <MultiSigSigner> — verified end-to-end without a browser.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
