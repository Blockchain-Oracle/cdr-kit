/**
 * cdr-kit × Vercel AI SDK — autonomous data-buying agent (live on Aeneid).
 *
 * An LLM is given the CDR tools and a goal; it autonomously discovers a vault, subscribes (pays from
 * the agent's own wallet), reads + decrypts it, and uses the data to answer — no human in the loop.
 *
 * Run: source ../../contracts/.env && ANTHROPIC_API_KEY=sk-... pnpm start
 *   (CDR_DEMO_MODEL overrides the model; PRIVATE_KEY funds the agent wallet on Aeneid testnet.)
 */
import { generateText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { parseEventLogs, type Hex } from "viem";
import {
  createCdrKitClient,
  createVault,
  writeVaultData,
  encodeSubscriptionConfig,
  SubscriptionMode,
} from "@cdr-kit/core";
import { aeneid, cdrKitVaultAbi } from "@cdr-kit/contracts";
import { CdrAgent } from "@cdr-kit/agent";
import { getVercelAITools } from "@cdr-kit/vercel-ai";
import { consola } from "consola";

const PK = process.env.PRIVATE_KEY as Hex | undefined;
const API = process.env.CDR_API_URL ?? "http://172.192.41.96:1317";
const MODEL = process.env.CDR_DEMO_MODEL ?? "claude-sonnet-4-6";
const log = consola.withTag("vercel-ai-demo");
if (!PK) throw new Error("PRIVATE_KEY not set (source ../../contracts/.env)");
if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");

const PRICE = 100_000_000_000_000n; // 0.0001 IP / period

// 1) seller stages a subscription-gated vault so the agent has something to discover
const seller = createCdrKitClient({ privateKey: PK, apiUrl: API });
log.start("seller: createVault + writeVaultData (a premium trading signal)");
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
if (!created) throw new Error("VaultCreated event not found in receipt");
const uuid = Number(created.args.uuid);
await writeVaultData(seller, {
  uuid,
  dataKey: new TextEncoder().encode(JSON.stringify({ asset: "ETH/USD", signal: "bullish", confidence: 0.82, horizon: "4h" })),
});
log.success(`vault uuid=${uuid} ready behind a subscription gate`);

// 2) the LLM agent autonomously drives the CDR tools toward the goal
const agent = new CdrAgent({ privateKey: PK, apiUrl: API });
log.start(`LLM (${MODEL}) running with the CDR tools…`);
const { text, steps } = await generateText({
  model: anthropic(MODEL),
  tools: getVercelAITools(agent),
  stopWhen: stepCountIs(8),
  prompt:
    `You are an autonomous data-buying agent with your own crypto wallet. There is a Story CDR data ` +
    `vault (uuid ${uuid}) selling a trading signal for ${PRICE} wei per period. Discover it, subscribe ` +
    `(pay at most ${PRICE} wei per period), read it, then tell me the signal and whether to BUY or HOLD.`,
});

for (const s of steps) {
  for (const c of s.toolCalls ?? []) {
    const input = (c as { input?: unknown }).input ?? (c as { args?: unknown }).args;
    log.info(`↳ tool: ${c.toolName}(${JSON.stringify(input)})`);
  }
}
log.box(text);
