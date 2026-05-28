/**
 * Live autonomous-agent demo on Aeneid:
 *   seller: createVault (subscription gate) -> writeVaultData (encrypt + write a secret)
 *   agent:  subscribeAndAccess (pay from its own wallet -> read + decrypt)  [no human in the loop]
 *
 * Run: source contracts/.env && pnpm --filter @cdr-kit/agent run demo
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

const secret = new TextEncoder().encode("premium-signal-" + Date.now());
log.start("seller: writeVaultData (encrypt + write the secret)");
await writeVaultData(seller, { uuid, dataKey: secret });
log.success("encrypted data written");

log.start("agent: discover -> subscribe -> access (autonomous)");
const agent = new CdrAgent({ privateKey: PK, apiUrl: API });
const recovered = await agent.subscribeAndAccess({
  uuid,
  periods: 1n,
  maxPricePerPeriod: PRICE,
  value: PRICE,
});

const ok = new TextDecoder().decode(recovered) === new TextDecoder().decode(secret);
if (ok) log.box(`✅ Agent autonomously paid + read the vault: "${new TextDecoder().decode(recovered)}"`);
else log.error("❌ mismatch");
process.exit(ok ? 0 : 1);
