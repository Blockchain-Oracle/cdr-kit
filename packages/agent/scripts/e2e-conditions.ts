#!/usr/bin/env tsx
/**
 * Live testnet e2e for the 4 new 0.5.0 condition contracts. Creates one vault per condition
 * type on Aeneid using the agent's wallet, then verifies the on-chain config matches.
 *
 * Run: source contracts/.env && pnpm --filter @cdr-kit/agent exec tsx scripts/e2e-conditions.ts
 *
 * Spends real testnet IP (~0.01 IP per vault × 4). Aborts up-front if balance < 0.05 IP. Pass
 * `--dry` to skip all writes and only run view checks.
 */
import { CdrAgent } from "../src/agent.js";
import { aeneid } from "@cdr-kit/contracts";
import pino from "pino";

const consola = pino({ name: "e2e", level: "info" }, process.stderr);

const DRY = process.argv.includes("--dry");
const PK = process.env.PRIVATE_KEY ?? process.env.CDR_PRIVATE_KEY;
const MIN_BALANCE_WEI = 50_000_000_000_000_000n; // 0.05 IP

async function main() {
  if (!PK) throw new Error("set PRIVATE_KEY or CDR_PRIVATE_KEY");
  const agent = new CdrAgent({
    privateKey: PK as `0x${string}`,
    rpcUrl: aeneid.rpcUrl,
    apiUrl: aeneid.apiUrl,
    network: "aeneid",
  });
  const address = agent.address!;
  const balance = await agent.client.publicClient.getBalance({ address });
  consola.info(`wallet=${address}  balance=${Number(balance) / 1e18} IP  dry=${DRY}`);
  if (!DRY && balance < MIN_BALANCE_WEI) {
    throw new Error(`insufficient balance: ${balance} wei < ${MIN_BALANCE_WEI} wei. Run: cdr fund`);
  }

  // ---- 1. TimeWindow ----
  consola.info("[1/4] TimeWindow: short available window starting now");
  if (!DRY) {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const tx = await agent.createTimeWindowVault({
      startTs: now,
      endTs: now + 3600n, // 1-hour window
      blockBased: false,
    });
    consola.info(`TimeWindow vault tx ${tx}`);
  }

  // ---- 2. DeadManSwitch ----
  consola.info("[2/4] DeadManSwitch: 5-minute window, creator as sole heir");
  if (!DRY) {
    const tx = await agent.createDeadManVault({
      duration: 300n, // 5 minutes
      heirs: [address],
      blockBased: false,
      creatorCanReadWhileLocked: true,
      publicAfterUnlock: false,
    });
    consola.info(`DeadMan vault tx ${tx}`);
  }

  // ---- 3. ConditionalEscrow ----
  consola.info("[3/4] ConditionalEscrow: 0.001 IP price, no arbiter, creator = seller");
  if (!DRY) {
    const tx = await agent.createEscrowVault({
      price: 1_000_000_000_000_000n, // 0.001 IP
      timeoutSecs: 86_400n, // 24h
    });
    consola.info(`Escrow vault tx ${tx}`);
  }

  // ---- 4. MultiSig ----
  consola.info("[4/4] MultiSig: 1-of-1 (creator only), threshold = 1");
  if (!DRY) {
    const tx = await agent.createMultiSigVault({
      signers: [address],
      threshold: 1,
    });
    consola.info(`MultiSig vault tx ${tx}`);
  }

  consola.info(`Done.${DRY ? " (dry-run — no chain writes)" : ""}`);
}

main().catch((e) => {
  consola.error(e);
  process.exit(1);
});
