/**
 * Live autonomous-agent demo on Aeneid — the full loop, no human:
 *   seller: createVault (subscription gate) -> writeVaultData (encrypt + write a JSON signal)
 *   agent:  discover() -> select the vault -> subscribeAndAccess (pay from its own wallet -> decrypt)
 *           -> USE the data downstream (parse the signal, make a decision)
 *
 * Run: source contracts/.env && pnpm --filter @cdr-kit/agent run demo
 * (Uses one funded testnet key for both roles; a real deployment would use two wallets.)
 */
import { parseEventLogs, type Hex } from "viem";
import {
  createCdrKitClient,
  createVault,
  writeVaultData,
  encodeSubscriptionConfig,
  SubscriptionMode,
} from "@cdr-kit/core";
import { aeneid, cdrKitVaultAbi } from "@cdr-kit/contracts";
import { consola } from "consola";
import { CdrAgent } from "../src/agent.js";

const PK = process.env.PRIVATE_KEY as Hex;
const API = process.env.CDR_API_URL ?? "http://172.192.41.96:1317";
const log = consola.withTag("agent-demo");
if (!PK) throw new Error("PRIVATE_KEY not set (source contracts/.env)");

const PRICE = 100_000_000_000_000n; // 0.0001 IP per period
const seller = createCdrKitClient({ privateKey: PK, apiUrl: API });

// --- seller: vault a premium signal behind a subscription gate ---
log.start("seller: createVault (subscription gate, 0.0001 IP / hour)");
const readConfig = encodeSubscriptionConfig({
  pricePerPeriod: PRICE,
  period: 3600n,
  payee: seller.address as Hex,
  mode: SubscriptionMode.NativeIP,
  licensorIpId: "0x0000000000000000000000000000000000000000",
});
const txHash = await createVault(seller, {
  vault: aeneid.cdrKitVault as Hex,
  readConditionAddr: aeneid.subscriptionCondition as Hex,
  readConfig,
});
const receipt = await seller.publicClient.waitForTransactionReceipt({ hash: txHash });
const [created] = parseEventLogs({ abi: cdrKitVaultAbi, logs: receipt.logs, eventName: "VaultCreated" });
const uuid = Number(created.args.uuid);
log.success(`vault created uuid=${uuid} ipId=${created.args.ipId}`);

const payload = { asset: "ETH/USD", signal: "bullish", confidence: 0.82, horizon: "4h", ts: Date.now() };
log.start("seller: writeVaultData (encrypt + write the signal)");
await writeVaultData(seller, { uuid, dataKey: new TextEncoder().encode(JSON.stringify(payload)) });
log.success("encrypted signal written");

// --- agent: discover -> pay -> access -> USE (autonomous) ---
const agent = new CdrAgent({ privateKey: PK, apiUrl: API });

log.start("agent: discover() — scan the factory for vaults");
const vaults = await agent.discover();
const target = vaults.find((v) => v.uuid === uuid);
if (!target) throw new Error(`agent could not discover vault ${uuid} (found ${vaults.length})`);
log.success(`discovered ${vaults.length} vault(s); selected uuid=${target.uuid} from ${target.creator}`);

log.start("agent: subscribeAndAccess — pay from its own wallet, then decrypt");
const recovered = await agent.subscribeAndAccess({ uuid: target.uuid, periods: 1n, maxPricePerPeriod: PRICE, value: PRICE });

// --- downstream use: the agent consumes the decrypted data to make a decision ---
const signal = JSON.parse(new TextDecoder().decode(recovered)) as typeof payload;
const decision = signal.confidence >= 0.7 ? "BUY" : "HOLD";
log.box(
  `✅ Autonomous loop: discovered → paid → decrypted → decided (no human).\n` +
    `   signal: ${signal.asset} ${signal.signal} (confidence ${signal.confidence}, ${signal.horizon})\n` +
    `   agent decision: ${decision}`,
);
process.exit(0);
