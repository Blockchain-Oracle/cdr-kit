import { Command } from "commander";
import { CdrAgent } from "@cdr-kit/agent";
import { createCdrTools } from "@cdr-kit/tools";
import { loadOrCreateWallet, walletPath } from "./lib/wallet.js";
import { resolveNetwork } from "./lib/network.js";
import { ok, err, setJsonMode } from "./lib/output.js";

const PKG_VERSION = "0.4.0";
const FAUCET_URL = "https://aeneid.faucet.story.foundation/";

/** Build a fresh agent against the resolved network + wallet. */
function buildAgent(networkFlag?: string): CdrAgent {
  const net = resolveNetwork(networkFlag);
  const w = loadOrCreateWallet({ network: net.network });
  return new CdrAgent({
    privateKey: w.privateKey,
    rpcUrl: net.rpcUrl,
    apiUrl: net.apiUrl,
    network: net.network,
  });
}

export function createCli(): Command {
  const program = new Command();
  program
    .name("cdr")
    .description("cdr-kit CLI — wallet, vault, MCP, skill management for Story Confidential Data Rails")
    .version(PKG_VERSION)
    .option("-n, --network <name>", "network: aeneid (default) or mainnet")
    .option("--json", "machine-readable JSON output")
    .hook("preAction", (cmd) => {
      if (cmd.opts<{ json?: boolean }>().json) setJsonMode(true);
    });

  /* ============================================================ */
  /* wallet                                                        */
  /* ============================================================ */

  const wallet = program.command("wallet").description("show wallet status (doctor command)");
  wallet.action(async () => {
    const net = resolveNetwork(program.opts<{ network?: string }>().network);
    const w = loadOrCreateWallet({ network: net.network });
    let balanceWei: bigint | null = null;
    try {
      const agent = new CdrAgent({ privateKey: w.privateKey, rpcUrl: net.rpcUrl, apiUrl: net.apiUrl, network: net.network });
      balanceWei = await agent.client.publicClient.getBalance({ address: w.address });
    } catch {
      balanceWei = null;
    }
    ok({
      address: w.address,
      source: w.source,
      path: w.path,
      network: net.network,
      chainId: net.chainId,
      rpcUrl: net.rpcUrl,
      apiUrl: net.apiUrl,
      balanceWei: balanceWei !== null ? balanceWei.toString() : "unavailable",
      faucetUrl: FAUCET_URL,
    });
  });
  wallet
    .command("new")
    .description("force-generate a new wallet (refuses to overwrite without --force)")
    .option("-f, --force", "overwrite the existing wallet file")
    .action(async (opts: { force?: boolean }) => {
      const path = walletPath();
      const { existsSync, unlinkSync } = await import("node:fs");
      if (existsSync(path)) {
        if (!opts.force) return err(`wallet exists at ${path} — re-run with --force to overwrite`);
        unlinkSync(path);
      }
      const net = resolveNetwork(program.opts<{ network?: string }>().network);
      const w = loadOrCreateWallet({ network: net.network });
      ok({ address: w.address, network: net.network, path: w.path });
    });
  wallet
    .command("export")
    .description("print the wallet's private key (DANGEROUS — exposes the key on stdout)")
    .option("-y, --yes", "skip the explicit confirmation prompt")
    .action(async (opts: { yes?: boolean }) => {
      const net = resolveNetwork(program.opts<{ network?: string }>().network);
      const w = loadOrCreateWallet({ network: net.network });
      if (!opts.yes) {
        process.stderr.write(
          `\nThis will print your private key (${w.address}) to stdout.\nRe-run with --yes to confirm.\n\n`,
        );
        process.exit(2);
      }
      ok({ address: w.address, privateKey: w.privateKey });
    });

  /* ============================================================ */
  /* fund / config / fees / tools                                  */
  /* ============================================================ */

  program
    .command("fund")
    .description("print address + open the Aeneid faucet in your browser (captcha-gated, manual)")
    .action(async () => {
      const net = resolveNetwork(program.opts<{ network?: string }>().network);
      const w = loadOrCreateWallet({ network: net.network });
      process.stderr.write(`\n  address  ${w.address}\n  faucet   ${FAUCET_URL}\n  paste your address into the faucet, complete the captcha, and wait for IP to land.\n\n`);
      try {
        const open = (await import("open")).default;
        await open(FAUCET_URL);
      } catch {
        /* open failed (no display, container) — the URL is already printed */
      }
      ok({ address: w.address, faucetUrl: FAUCET_URL });
    });

  program
    .command("config")
    .description("print resolved network / rpc / api url / wallet path")
    .action(() => {
      const net = resolveNetwork(program.opts<{ network?: string }>().network);
      ok({
        network: net.network,
        chainId: net.chainId,
        rpcUrl: net.rpcUrl,
        apiUrl: net.apiUrl,
        walletPath: walletPath(),
        cdrPrivateKeyFromEnv: Boolean(process.env.CDR_PRIVATE_KEY || process.env.PRIVATE_KEY),
      });
    });

  program
    .command("fees")
    .description("fetch CDR operation fees (allocate/write/read in wei) + operational threshold")
    .action(async () => {
      const agent = buildAgent(program.opts<{ network?: string }>().network);
      const f = await agent.getFees();
      ok({
        allocateWei: f.allocateWei.toString(),
        writeWei: f.writeWei.toString(),
        readWei: f.readWei.toString(),
        threshold: f.threshold,
      });
    });

  program
    .command("tools")
    .description("enumerate every MCP tool this CLI exposes (introspection)")
    .action(() => {
      const agent = buildAgent(program.opts<{ network?: string }>().network);
      const tools = createCdrTools(agent);
      ok(
        tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: Object.keys(t.inputSchema.shape),
        })),
      );
    });

  /* ============================================================ */
  /* discover / vault / subscribe / access / subscriptions          */
  /* ============================================================ */

  program
    .command("discover")
    .description("scan factory VaultCreated events (returns recent uuids/ipIds/creators)")
    .option("--from-block <n>", "start block for the scan")
    .action(async (opts: { fromBlock?: string }) => {
      const agent = buildAgent(program.opts<{ network?: string }>().network);
      const vaults = await agent.discover(opts.fromBlock ? { fromBlock: BigInt(opts.fromBlock) } : undefined);
      ok(
        vaults.map((v) => ({ uuid: v.uuid, ipId: v.ipId, creator: v.creator, tokenId: v.tokenId.toString() })),
      );
    });

  const vault = program.command("vault").description("vault info, list, create, upload");
  vault
    .command("info <uuid>")
    .description("uuid → tokenId + ipId + creator + licenseTermsId + plan + your entitlement")
    .action(async (uuidArg: string) => {
      const agent = buildAgent(program.opts<{ network?: string }>().network);
      const uuid = Number(uuidArg);
      const [info, plan, ent] = await Promise.all([
        agent.getVaultInfo(uuid),
        agent.getSubscriptionPlan(uuid).catch(() => null),
        agent.getEntitlement(uuid).catch(() => null),
      ]);
      if (!info) return err(`vault ${uuid} not found`);
      ok({
        info: {
          uuid: info.uuid,
          tokenId: info.tokenId.toString(),
          ipId: info.ipId,
          creator: info.creator,
          licenseTermsId: info.licenseTermsId.toString(),
        },
        plan: plan && {
          pricePerPeriodWei: plan.pricePerPeriodWei.toString(),
          periodSeconds: plan.periodSeconds.toString(),
          payee: plan.payee,
          mode: plan.mode,
        },
        entitlement: ent,
      });
    });
  vault
    .command("list")
    .description("list every vault by a creator")
    .requiredOption("--creator <addr>", "EOA address of the creator")
    .action(async (opts: { creator: string }) => {
      const agent = buildAgent(program.opts<{ network?: string }>().network);
      const vaults = await agent.getCreatorVaults(opts.creator as `0x${string}`);
      ok(
        vaults.map((v) => ({
          uuid: v.uuid,
          tokenId: v.tokenId.toString(),
          ipId: v.ipId,
          licenseTermsId: v.licenseTermsId.toString(),
        })),
      );
    });
  vault
    .command("create")
    .description("create a new CDR vault (mint NFT + register IP + allocate slot + configure read condition)")
    .requiredOption("--read <addr>", "read condition contract address")
    .requiredOption("--read-config <hex>", "ABI-encoded read-condition config (0x-hex)")
    .option("--license-terms-id <id>", "Story license terms id (decimal)")
    .option("--value <wei>", "native value to send in wei")
    .action(async (opts: { read: string; readConfig: string; licenseTermsId?: string; value?: string }) => {
      const agent = buildAgent(program.opts<{ network?: string }>().network);
      const txHash = await agent.createVault({
        readConditionAddr: opts.read as `0x${string}`,
        readConfig: opts.readConfig as `0x${string}`,
        licenseTermsId: opts.licenseTermsId ? BigInt(opts.licenseTermsId) : undefined,
        valueWei: opts.value ? BigInt(opts.value) : undefined,
      });
      ok({ txHash, hint: "read your uuid from the VaultCreated event in the receipt" });
    });

  program
    .command("subscribe <uuid>")
    .description("subscribe to + immediately read a subscription-gated vault")
    .option("--periods <n>", "number of periods to pay for", "1")
    .option("--max-price <wei>", "max price per period in wei", "5000000000000000000")
    .action(async (uuidArg: string, opts: { periods: string; maxPrice: string }) => {
      const agent = buildAgent(program.opts<{ network?: string }>().network);
      const uuid = Number(uuidArg);
      const periods = BigInt(opts.periods);
      const price = BigInt(opts.maxPrice);
      const data = await agent.subscribeAndAccess({
        uuid,
        periods,
        maxPricePerPeriod: price,
        value: price * periods,
      });
      ok({ uuid, text: new TextDecoder().decode(data) });
    });

  program
    .command("access <uuid>")
    .description("read a vault the agent is already entitled to")
    .option("--aux-data <hex>", "ABI-encoded accessAuxData (e.g. license tokenId for tier-gated vaults)")
    .action(async (uuidArg: string, opts: { auxData?: string }) => {
      const agent = buildAgent(program.opts<{ network?: string }>().network);
      const data = await agent.access(Number(uuidArg), opts.auxData as `0x${string}` | undefined);
      ok({ uuid: Number(uuidArg), text: new TextDecoder().decode(data) });
    });

  program
    .command("access-license <uuid>")
    .description("read a license-gated vault by presenting a Story license token the agent holds")
    .requiredOption("--license-token-id <id>", "license tokenId (decimal)")
    .action(async (uuidArg: string, opts: { licenseTokenId: string }) => {
      const agent = buildAgent(program.opts<{ network?: string }>().network);
      const data = await agent.accessLicenseGated({
        uuid: Number(uuidArg),
        licenseTokenId: BigInt(opts.licenseTokenId),
      });
      ok({ uuid: Number(uuidArg), text: new TextDecoder().decode(data) });
    });

  program
    .command("subscriptions")
    .description("list every vault the agent is currently subscribed to (active paidUntil)")
    .option("--from-block <n>", "start block for the discovery scan")
    .action(async (opts: { fromBlock?: string }) => {
      const agent = buildAgent(program.opts<{ network?: string }>().network);
      const subs = await agent.listMySubscriptions(opts.fromBlock ? { fromBlock: BigInt(opts.fromBlock) } : undefined);
      ok(
        subs.map((s) => ({
          uuid: s.uuid,
          ipId: s.ipId,
          creator: s.creator,
          paidUntilUnix: s.paidUntilUnix,
          expiresInSeconds: s.expiresInSeconds,
        })),
      );
    });

  /* ============================================================ */
  /* skill install                                                 */
  /* ============================================================ */

  program
    .command("skill")
    .description("install the cdr-kit Claude Code skill into ~/.claude/skills/cdr-kit/")
    .argument("<action>", "currently only: install")
    .action(async (action: string) => {
      if (action !== "install") return err(`unknown action "${action}". Try: cdr skill install`);
      const { homedir } = await import("node:os");
      const { join, dirname } = await import("node:path");
      const { mkdirSync, cpSync, existsSync } = await import("node:fs");
      const { fileURLToPath } = await import("node:url");
      // dist/index.mjs lives at <pkg>/dist/index.mjs.
      // Published: bundled at <pkg>/plugin/cdr-kit  → ../plugin/cdr-kit
      // Workspace dev fallback: ../../plugin/cdr-kit (= packages/plugin/cdr-kit)
      const here = dirname(fileURLToPath(import.meta.url));
      const candidates = [
        join(here, "..", "plugin", "cdr-kit"),
        join(here, "..", "..", "plugin", "cdr-kit"),
      ];
      const source = candidates.find((c) => existsSync(c));
      if (!source) return err(`cdr-kit plugin not found bundled with this CLI install. Looked: ${candidates.join(", ")}`);
      const target = join(homedir(), ".claude", "skills", "cdr-kit");
      mkdirSync(target, { recursive: true });
      cpSync(source, target, { recursive: true });
      ok({ installed: target, source });
    });

  /* ============================================================ */
  /* mcp                                                           */
  /* ============================================================ */

  program
    .command("mcp")
    .description("start the stdio MCP server (used by Claude Desktop / Cursor / any MCP host)")
    .action(async () => {
      // Imports kept inline so `cdr --help` doesn't pay the MCP-SDK load cost.
      const { createMcpServer } = await import("./server.js");
      const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
      const agent = buildAgent(program.opts<{ network?: string }>().network);
      const server = createMcpServer({ agent });
      await server.connect(new StdioServerTransport());
    });

  return program;
}
