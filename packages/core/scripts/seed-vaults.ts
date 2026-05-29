/**
 * Seed the dashboard with real, live, subscription-gated vaults on Aeneid via the CdrKitVault factory.
 * For each seed: createVault (factory: mint NFT -> register IP -> allocate -> configure subscription)
 * then writeVaultData (encrypt + write the sample payload). Subscription vaults round-trip live —
 * a buyer subscribes from the dashboard, then reads + decrypts.
 *
 * Run: source contracts/.env && pnpm --filter @cdr-kit/core run seed
 * Copy the printed JSON into apps/web/lib/live-vaults.ts (title/description/price aren't on-chain).
 */
import { parseEventLogs, type Hex } from "viem";
import { createCdrKitClient } from "../src/client.js";
import { createVault, writeVaultData } from "../src/flows.js";
import { encodeSubscriptionConfig, SubscriptionMode } from "../src/conditions.js";
import { aeneid, cdrKitVaultAbi } from "@cdr-kit/contracts";
import { consola } from "consola";

const PK = process.env.PRIVATE_KEY as Hex | undefined;
const API = process.env.CDR_API_URL ?? "http://172.192.41.96:1317";
const RPC = process.env.AENEID_RPC;
const log = consola.withTag("seed-vaults");
if (!PK) throw new Error("PRIVATE_KEY not set (source contracts/.env)");

const PERIOD = 2_592_000n; // 30 days
const IP = 10n ** 18n;
const toWei = (ip: number) => (BigInt(Math.round(ip * 1_000)) * IP) / 1_000n;

interface Seed {
  title: string;
  dataType: string;
  description: string;
  priceIp: number;
  sample: Record<string, unknown>;
}

const SEEDS: Seed[] = [
  {
    title: "ETH/USD oracle feed — 1s ticks",
    dataType: "Time series",
    description:
      "Sub-second ETH/USD marks aggregated across venues, signed and threshold-encrypted. Subscribers decrypt the latest window after an on-chain subscription.",
    priceIp: 0.002,
    sample: { pair: "ETH/USD", ts: 1748459200, mark: 3412.88, venues: 9, spread_bps: 1.4, window: "1s" },
  },
  {
    title: "DEX liquidation alpha stream",
    dataType: "Signals",
    description:
      "Forward-looking liquidation-pressure signals across major lending markets, refreshed each block and threshold-encrypted to subscribers.",
    priceIp: 0.003,
    sample: { market: "aave-v3", at_risk_usd: 4_193_000, health_p5: 1.02, horizon: "3blocks" },
  },
  {
    title: "On-chain credit-risk scores",
    dataType: "Model output",
    description:
      "Per-address default-probability scores from a model trained on 3y of liquidations. Royalties route to the model's IP asset on every subscription.",
    priceIp: 0.005,
    sample: { address: "0x3a1f…", pd_30d: 0.062, tier: "BBB", model: "llens-v3", updated: 1748452000 },
  },
];

const client = createCdrKitClient({ privateKey: PK, apiUrl: API, rpcUrl: RPC });
const out: Array<{ uuid: number; condition: string; priceIp: number; priceWei: string } & Omit<Seed, "sample">> = [];

for (const seed of SEEDS) {
  const priceWei = toWei(seed.priceIp);
  log.start(`createVault "${seed.title}" (subscription, ${seed.priceIp} IP / 30d)`);
  const readConfig = encodeSubscriptionConfig({
    pricePerPeriod: priceWei,
    period: PERIOD,
    payee: client.address as Hex,
    mode: SubscriptionMode.NativeIP,
    licensorIpId: "0x0000000000000000000000000000000000000000",
  });
  const txHash = await createVault(client, {
    vault: aeneid.cdrKitVault as Hex,
    readConditionAddr: aeneid.subscriptionCondition as Hex,
    readConfig,
  });
  const receipt = await client.publicClient.waitForTransactionReceipt({ hash: txHash });
  const [created] = parseEventLogs({ abi: cdrKitVaultAbi, logs: receipt.logs, eventName: "VaultCreated" });
  if (!created) throw new Error(`VaultCreated event missing for "${seed.title}" (tx ${txHash})`);
  const uuid = Number(created.args.uuid);
  log.success(`  uuid=${uuid} ipId=${created.args.ipId}`);

  log.start("  writeVaultData (encrypt + write the sample)");
  await writeVaultData(client, { uuid, dataKey: new TextEncoder().encode(JSON.stringify(seed.sample)) });
  log.success("  written");

  const { sample: _sample, ...meta } = seed;
  void _sample;
  out.push({ uuid, condition: "subscription", priceWei: priceWei.toString(), ...meta });
}

log.box(`Seeded ${out.length} vaults. Paste into apps/web/lib/live-vaults.ts:\n\n${JSON.stringify(out, null, 2)}`);
process.exit(0);
