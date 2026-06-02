import type { Command } from "commander";
import type { CdrAgent } from "@cdr-kit/agent";
import { ok, okTx } from "./lib/output.js";

/**
 * 0.5 CLI surface — advanced-condition vault creators + mutators + Story IP wrappers.
 * Mirrors `@cdr-kit/tools` 1:1 so anything an MCP host can call, a human can run at the terminal.
 *
 * Each command is a thin commander wrapper around an existing CdrAgent method. Output goes
 * through `ok()` so it respects the global `--json` flag.
 */

export function registerAdvancedCommands(program: Command, buildAgent: (n?: string) => CdrAgent): void {
  const network = () => program.opts<{ network?: string }>().network;

  /* ============================================================ */
  /* TimeWindow / DeadMan / Escrow / MultiSig create              */
  /* ============================================================ */

  const create = program.command("create").description("create a 0.5 advanced-condition vault");

  create
    .command("time-window")
    .description("create a TimeWindowCondition-gated vault — read allowed during [startTs, endTs]")
    .requiredOption("--start <ts>", "start timestamp (or block) as decimal", "0")
    .requiredOption("--end <ts>", "end (0 = open-ended)", "0")
    .option("--block-based", "interpret start/end as block.number instead of block.timestamp", false)
    .option("--license-terms-id <id>", "PIL license terms id (decimal)")
    .option("--value <wei>", "native value to send in wei (decimal)")
    .action(async (opts: { start: string; end: string; blockBased: boolean; licenseTermsId?: string; value?: string }) => {
      const agent = buildAgent(network());
      const txHash = await agent.createTimeWindowVault({
        startTs: BigInt(opts.start),
        endTs: BigInt(opts.end),
        blockBased: opts.blockBased,
        licenseTermsId: opts.licenseTermsId ? BigInt(opts.licenseTermsId) : undefined,
        valueWei: opts.value ? BigInt(opts.value) : undefined,
      });
      await okTx(agent, txHash, { hint: "read uuid from VaultCreated event in the receipt" });
    });

  create
    .command("dead-man")
    .description("create a DeadManSwitchCondition vault — auto-unlocks to heirs after heartbeat lapses")
    .requiredOption("--duration <secs>", "heartbeat window in seconds (or blocks)")
    .requiredOption("--heirs <list>", "comma-separated heir addresses")
    .option("--block-based", "interpret duration as blocks", false)
    .option("--public-after", "anyone reads post-unlock (else: only heirs)", false)
    .option("--no-creator-read", "creator cannot read while locked (default: can)")
    .option("--license-terms-id <id>", "PIL license terms id (decimal)")
    .option("--value <wei>", "native value to send in wei")
    .action(async (opts: {
      duration: string;
      heirs: string;
      blockBased: boolean;
      publicAfter: boolean;
      creatorRead?: boolean;
      licenseTermsId?: string;
      value?: string;
    }) => {
      const agent = buildAgent(network());
      const heirs = opts.heirs.split(",").map((s) => s.trim()) as `0x${string}`[];
      const txHash = await agent.createDeadManVault({
        duration: BigInt(opts.duration),
        heirs,
        blockBased: opts.blockBased,
        publicAfterUnlock: opts.publicAfter,
        creatorCanReadWhileLocked: opts.creatorRead !== false,
        licenseTermsId: opts.licenseTermsId ? BigInt(opts.licenseTermsId) : undefined,
        valueWei: opts.value ? BigInt(opts.value) : undefined,
      });
      await okTx(agent, txHash);
    });

  create
    .command("escrow")
    .description("create a ConditionalEscrowCondition vault — buyer pays, confirms, then reads")
    .requiredOption("--price <wei>", "listing price in wei (decimal)")
    .requiredOption("--timeout <secs>", "seconds before seller may claim unilaterally")
    .option("--seller <addr>", "seller address (default: this wallet)")
    .option("--arbiter <addr>", "optional arbiter who can refund disputed deals")
    .option("--license-terms-id <id>")
    .option("--value <wei>")
    .action(async (opts: { price: string; timeout: string; seller?: string; arbiter?: string; licenseTermsId?: string; value?: string }) => {
      const agent = buildAgent(network());
      const txHash = await agent.createEscrowVault({
        seller: opts.seller as `0x${string}` | undefined,
        price: BigInt(opts.price),
        timeoutSecs: BigInt(opts.timeout),
        arbiter: opts.arbiter as `0x${string}` | undefined,
        licenseTermsId: opts.licenseTermsId ? BigInt(opts.licenseTermsId) : undefined,
        valueWei: opts.value ? BigInt(opts.value) : undefined,
      });
      await okTx(agent, txHash);
    });

  create
    .command("multi-sig")
    .description("create an N-of-M MultiSigCondition vault — off-chain sigs OR on-chain approve")
    .requiredOption("--signers <list>", "comma-separated signer addresses")
    .requiredOption("--threshold <n>", "minimum sigs required (decimal)")
    .option("--license-terms-id <id>")
    .option("--value <wei>")
    .action(async (opts: { signers: string; threshold: string; licenseTermsId?: string; value?: string }) => {
      const agent = buildAgent(network());
      const signers = opts.signers.split(",").map((s) => s.trim()) as `0x${string}`[];
      const txHash = await agent.createMultiSigVault({
        signers,
        threshold: Number(opts.threshold),
        licenseTermsId: opts.licenseTermsId ? BigInt(opts.licenseTermsId) : undefined,
        valueWei: opts.value ? BigInt(opts.value) : undefined,
      });
      await okTx(agent, txHash);
    });

  /* ============================================================ */
  /* MultiSig: approve / sign / access                             */
  /* ============================================================ */

  const ms = program.command("multi-sig").description("MultiSigCondition operations");
  ms.command("approve <uuid>")
    .description("Safe-style on-chain approve — agent's wallet must be a configured signer")
    .option(
      "--expected-epoch <n>",
      "bind approval to a specific epoch; omit and the CLI reads the current epoch first (safe default — guards against in-flight rotateSigners landing first)",
    )
    .action(async (uuidArg: string, opts: { expectedEpoch?: string }) => {
      const agent = buildAgent(network());
      const expected = opts.expectedEpoch === undefined ? undefined : BigInt(opts.expectedEpoch);
      const txHash = await agent.approveMultiSig(Number(uuidArg), expected);
      await okTx(agent, txHash);
    });
  ms.command("sign <uuid>")
    .description("produce an off-chain EIP-712 sig — collect threshold-many off-band, then `access`")
    .requiredOption("--caller <addr>", "address that will submit the read tx (sigs are caller-bound)")
    .requiredOption("--deadline <ts>", "unix timestamp after which the sig expires")
    .action(async (uuidArg: string, opts: { caller: string; deadline: string }) => {
      const agent = buildAgent(network());
      const signature = await agent.signMultiSigApproval({
        uuid: Number(uuidArg),
        caller: opts.caller as `0x${string}`,
        deadline: BigInt(opts.deadline),
      });
      ok({ signature });
    });
  ms.command("access <uuid>")
    .description("read a multi-sig vault by submitting threshold-many off-chain sigs")
    .requiredOption("--deadline <ts>", "the deadline the sigs were signed against")
    .requiredOption("--sigs <list>", "comma-separated 0x-hex signatures, sorted by recovered signer ascending")
    .action(async (uuidArg: string, opts: { deadline: string; sigs: string }) => {
      const agent = buildAgent(network());
      const sigs = opts.sigs.split(",").map((s) => s.trim()) as `0x${string}`[];
      const data = await agent.accessMultiSig({ uuid: Number(uuidArg), deadline: BigInt(opts.deadline), sigs });
      ok({ uuid: Number(uuidArg), text: new TextDecoder().decode(data) });
    });

  /* ============================================================ */
  /* DeadMan: poke                                                 */
  /* ============================================================ */

  program
    .command("poke <uuid>")
    .description("reset the dead-man-switch heartbeat for a vault you created")
    .action(async (uuidArg: string) => {
      const agent = buildAgent(network());
      const txHash = await agent.pokeDeadMan(Number(uuidArg));
      await okTx(agent, txHash);
    });

  /* ============================================================ */
  /* Escrow: pay / confirm                                         */
  /* ============================================================ */

  const escrow = program.command("escrow").description("ConditionalEscrowCondition buyer-side operations");
  escrow.command("pay <uuid>")
    .description("pay the listing price into escrow (buyer side, step 1 of 2)")
    .requiredOption("--price <wei>", "listing price in wei (must match contract's price; excess refunded)")
    .action(async (uuidArg: string, opts: { price: string }) => {
      const agent = buildAgent(network());
      const txHash = await agent.payEscrow({ uuid: Number(uuidArg), price: BigInt(opts.price) });
      await okTx(agent, txHash);
    });
  escrow.command("confirm <uuid>")
    .description("confirm delivery — releases funds to seller, grants buyer read access (step 2 of 2)")
    .action(async (uuidArg: string) => {
      const agent = buildAgent(network());
      const txHash = await agent.confirmEscrowDelivery(Number(uuidArg));
      await okTx(agent, txHash);
    });
  escrow.command("claim-timeout <uuid>")
    .description("seller-side: claim funds + grant buyer read after listing's timeoutSecs of silence")
    .requiredOption("--buyer <addr>", "buyer address (the wallet that called pay)")
    .action(async (uuidArg: string, opts: { buyer: string }) => {
      const agent = buildAgent(network());
      const txHash = await agent.claimEscrowAfterTimeout({ uuid: Number(uuidArg), buyer: opts.buyer as `0x${string}` });
      await okTx(agent, txHash);
    });
  escrow.command("arbiter-refund <uuid>")
    .description("arbiter-side: refund a buyer who paid but disputes delivery")
    .requiredOption("--buyer <addr>", "buyer to refund")
    .action(async (uuidArg: string, opts: { buyer: string }) => {
      const agent = buildAgent(network());
      const txHash = await agent.refundEscrow({ uuid: Number(uuidArg), buyer: opts.buyer as `0x${string}` });
      await okTx(agent, txHash);
    });

  ms.command("rotate <uuid>")
    .description("creator-only: swap multi-sig signer set / threshold (bumps epoch — invalidates BOTH paths)")
    .requiredOption("--signers <list>", "comma-separated new signer addresses")
    .requiredOption("--threshold <n>", "new threshold (decimal)")
    .action(async (uuidArg: string, opts: { signers: string; threshold: string }) => {
      const agent = buildAgent(network());
      const signers = opts.signers.split(",").map((s) => s.trim()) as `0x${string}`[];
      const txHash = await agent.rotateMultiSigSigners({
        uuid: Number(uuidArg),
        signers,
        threshold: Number(opts.threshold),
      });
      await okTx(agent, txHash);
    });

  /* ============================================================ */
  /* Story IP integration                                          */
  /* ============================================================ */

  const ip = program.command("ip").description("Story IP integration (requires @cdr-kit/story + @story-protocol/core-sdk)");
  ip.command("create-collection")
    .description("deploy a new SPG NFT collection — prerequisite for `ip register` / `publish` to mint into")
    .requiredOption("--name <name>", "collection name (e.g. \"cdr-kit Test IP\")")
    .requiredOption("--symbol <symbol>", "collection symbol (e.g. \"CDRTEST\")")
    .option("--no-public-minting", "restrict minting to addresses with the minter role (default: public)")
    .option("--contract-uri <uri>", "ERC-7572 contract metadata URI", "")
    .option("--base-uri <uri>", "base URI for tokenURI resolution")
    .option("--mint-fee <wei>", "per-mint fee in wei (omit for free mints)")
    .option("--mint-fee-token <addr>", "ERC-20 used for the fee (omit for native IP)")
    .option("--max-supply <n>", "maximum tokens that can be minted (omit for unbounded)")
    .action(async (opts: {
      name: string;
      symbol: string;
      publicMinting?: boolean;
      contractUri: string;
      baseUri?: string;
      mintFee?: string;
      mintFeeToken?: string;
      maxSupply?: string;
    }) => {
      const agent = buildAgent(network());
      const res = await agent.createSpgCollection({
        name: opts.name,
        symbol: opts.symbol,
        isPublicMinting: opts.publicMinting !== false,
        contractURI: opts.contractUri,
        baseURI: opts.baseUri,
        mintFee: opts.mintFee ? BigInt(opts.mintFee) : undefined,
        mintFeeToken: opts.mintFeeToken as `0x${string}` | undefined,
        maxSupply: opts.maxSupply ? Number(opts.maxSupply) : undefined,
      });
      await okTx(agent, res.txHash, { spgNftContract: res.spgNftContract });
    });
  ip.command("register")
    .description("register a freshly-minted NFT as a Story IP asset (mint mode)")
    .requiredOption("--spg <addr>", "SPG NFT contract address")
    .option("--metadata <uri>", "off-chain IP metadata URI")
    .action(async (opts: { spg: string; metadata?: string }) => {
      const agent = buildAgent(network());
      const res = await agent.registerIpAsset({
        nft: { type: "mint", spgNftContract: opts.spg as `0x${string}` },
        ipMetadata: opts.metadata ? { ipMetadataURI: opts.metadata } : undefined,
      });
      ok({
        ipId: res.ipId,
        tokenId: res.tokenId.toString(),
        licenseTermsIds: res.licenseTermsIds?.map((t) => t.toString()),
        txHash: res.txHash,
      });
    });
  ip.command("attach-terms")
    .description("attach PIL license terms to an IP asset (required before minting license tokens)")
    .requiredOption("--ip <addr>", "IP asset address")
    .requiredOption("--terms-id <id>", "PIL license terms id (decimal)")
    .action(async (opts: { ip: string; termsId: string }) => {
      const agent = buildAgent(network());
      const res = await agent.attachLicenseTerms({
        ipId: opts.ip as `0x${string}`,
        licenseTermsId: BigInt(opts.termsId),
      });
      await okTx(agent, res.txHash);
    });
  ip.command("mint-license")
    .description("mint Story license tokens against an IP asset's licenseTermsId")
    .requiredOption("--licensor <addr>", "licensor IP address (the seller's IP asset)")
    .requiredOption("--terms-id <id>", "PIL license terms id (decimal)")
    .option("--amount <n>", "number of tokens to mint", "1")
    .option("--receiver <addr>", "token recipient (default: this wallet)")
    .option("--max-minting-fee <wei>", "max minting fee in wei", "0")
    .action(async (opts: { licensor: string; termsId: string; amount: string; receiver?: string; maxMintingFee: string }) => {
      const agent = buildAgent(network());
      const res = await agent.mintLicenseTokens({
        licensorIpId: opts.licensor as `0x${string}`,
        licenseTermsId: BigInt(opts.termsId),
        amount: BigInt(opts.amount),
        receiver: opts.receiver as `0x${string}` | undefined,
        maxMintingFee: BigInt(opts.maxMintingFee),
      });
      ok({
        licenseTokenIds: res.licenseTokenIds.map((t) => t.toString()),
        txHash: res.txHash,
      });
    });
  ip.command("register-derivative")
    .description("register a derivative IP — child inherits parents' PIL terms")
    .requiredOption("--child <addr>", "child IP asset address")
    .requiredOption("--parents <list>", "comma-separated parent IP asset addresses")
    .requiredOption("--terms-ids <list>", "comma-separated parent licenseTermsIds (decimal)")
    .action(async (opts: { child: string; parents: string; termsIds: string }) => {
      const agent = buildAgent(network());
      const res = await agent.registerDerivative({
        childIpId: opts.child as `0x${string}`,
        parentIpIds: opts.parents.split(",").map((s) => s.trim()) as `0x${string}`[],
        licenseTermsIds: opts.termsIds.split(",").map((s) => BigInt(s.trim())),
      });
      await okTx(agent, res.txHash);
    });
  ip.command("wrap-ip")
    .description("wrap native IP into WIP (ERC-20) — required before paying royalties")
    .requiredOption("--amount <wei>", "amount of native IP to wrap (decimal wei)")
    .action(async (opts: { amount: string }) => {
      const agent = buildAgent(network());
      const res = await agent.wrapIp({ amountWei: BigInt(opts.amount) });
      await okTx(agent, res.txHash);
    });
  ip.command("approve-wip")
    .description("approve a spender (typically RoyaltyModule) to pull WIP from the agent's wallet")
    .requiredOption("--spender <addr>", "spender address")
    .requiredOption("--amount <wei>", "approval amount in wei (decimal)")
    .action(async (opts: { spender: string; amount: string }) => {
      const agent = buildAgent(network());
      const res = await agent.approveWip({ spender: opts.spender as `0x${string}`, amountWei: BigInt(opts.amount) });
      await okTx(agent, res.txHash);
    });
}
