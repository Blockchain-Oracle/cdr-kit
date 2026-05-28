/**
 * OQ8 end-to-end: encrypt -> write -> read -> decrypt against real Aeneid, using our deployed
 * OpenCondition as the read+write gate. Proves the full CDR crypto round-trip works with cdr-kit.
 *
 * Run: source contracts/.env && pnpm --filter @cdr-kit/core run e2e
 */
import { createPublicClient, createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CDRClient } from "@piplabs/cdr-sdk";
import { initWasm } from "@piplabs/cdr-crypto";
import { consola } from "consola";

const log = consola.withTag("oq8-e2e");

const PK = process.env.PRIVATE_KEY as `0x${string}`;
const RPC = process.env.AENEID_RPC ?? "https://aeneid.storyrpc.io";
const API = process.env.CDR_API_URL ?? "http://172.192.41.96:1317";
const OPEN = "0x36fB2e2d10efd1E905b7779A684F34B9c775b62B" as const;

if (!PK) throw new Error("PRIVATE_KEY not set (source contracts/.env)");

const chain = defineChain({
  id: 1315,
  name: "Story Aeneid",
  nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
});
const account = privateKeyToAccount(PK);
const publicClient = createPublicClient({ chain, transport: http(RPC) });
const walletClient = createWalletClient({ account, chain, transport: http(RPC) });
const cdr = new CDRClient({ network: "testnet", publicClient, walletClient, apiUrl: API });

log.start("initWasm()");
await initWasm();

const secret = new TextEncoder().encode("cdr-kit-oq8-" + Date.now());
log.info("uploadCDR (allocate + encrypt + write) with OpenCondition…");
const up = await cdr.uploader.uploadCDR({
  dataKey: secret,
  updatable: false,
  writeConditionAddr: OPEN,
  readConditionAddr: OPEN,
  writeConditionData: "0x",
  readConditionData: "0x",
  accessAuxData: "0x",
});
log.success(`allocated uuid=${up.uuid}`);
log.info({ allocate: up.txHashes.allocate, write: up.txHashes.write });

log.info("accessCDR (read + collect partials + decrypt)…");
const t0 = Date.now();
const { dataKey, txHash } = await cdr.consumer.accessCDR({ uuid: up.uuid, accessAuxData: "0x", timeoutMs: 600_000 });
const recovered = new TextDecoder().decode(dataKey);
log.success(`read tx ${txHash} (${Math.round((Date.now() - t0) / 1000)}s)`);

const match = recovered === new TextDecoder().decode(secret);
if (match) log.box(`✅ OQ8 closed — recovered "${recovered}"`);
else log.error(`MISMATCH — recovered "${recovered}"`);
process.exit(match ? 0 : 1);
