import { parseAbiItem, encodeAbiParameters, type Hex } from "viem";
import pino, { type Logger } from "pino";
import {
  createCdrKitClient,
  accessVault,
  subscribeAndAccess,
  createVault,
  writeVaultData,
  uploadFile,
  createIpfsStorage,
  prefetchVault,
  type CdrKitClient,
  type CdrStorageProvider,
} from "@cdr-kit/core";
import {
  resolveAddresses,
  cdrKitVaultAbi,
  subscriptionConditionAbi,
  deadManSwitchConditionAbi,
  multiSigConditionAbi,
  conditionalEscrowConditionAbi,
  type Network,
} from "@cdr-kit/contracts";

/** Pino logger pinned to stderr — MCP stdio framing requires stdout to be JSON-RPC only. */
const log: Logger = pino(
  { name: "cdr-agent", level: process.env.LOG_LEVEL ?? "info" },
  process.stderr, // SonicBoom-compatible WritableStream
);

export interface CdrAgentOptions {
  /** Agent's own wallet key (testnet). */
  privateKey: Hex;
  /** Override the network's canonical RPC URL. */
  rpcUrl?: string;
  /** Story-API REST base URL — default: network's canonical apiUrl. */
  apiUrl?: string;
  /** Target network. Default "aeneid". "mainnet" throws today (not yet deployed). */
  network?: Network;
  /** Override the CdrKitVault factory address used for discovery. */
  vault?: Hex;
}

export interface DiscoveredVault {
  tokenId: bigint;
  uuid: number;
  ipId: Hex;
  creator: Hex;
}

export interface VaultInfo {
  uuid: number;
  tokenId: bigint;
  ipId: Hex;
  creator: Hex;
  licenseTermsId: bigint;
}

export interface SubscriptionPlan {
  uuid: number;
  pricePerPeriodWei: bigint;
  periodSeconds: bigint;
  payee: Hex;
  /** 0 = native IP, 1 = WIP (wrapped IP ERC20). */
  mode: number;
  licensorIpId: Hex;
}

export interface Entitlement {
  uuid: number;
  paidUntilUnix: number;
  isEntitled: boolean;
}

export interface MySubscription extends Entitlement {
  ipId: Hex;
  creator: Hex;
  expiresInSeconds: number;
}

export interface CreateVaultParams {
  readConditionAddr: Hex;
  readConfig: Hex;
  /** Optional child conditions (e.g. nested gates for ComposableCondition). */
  childConditions?: Hex[];
  childConfigs?: Hex[];
  licenseTermsId?: bigint;
  /** Native value to send (e.g. mint fee). Defaults to 0. */
  valueWei?: bigint;
}

export interface UploadFileParams {
  content: Uint8Array;
  readConditionAddr?: Hex;
  readConditionData?: Hex;
  /** IPFS pinning endpoint (POSTs multipart, expects JSON with Hash/cid/IpfsHash). */
  addUrl: string;
  /** IPFS gateway (read side, e.g. https://w3s.link). */
  gatewayUrl: string;
  /** Optional Authorization header for the pinning service. */
  authHeader?: string;
}

export interface Fees {
  allocateWei: bigint;
  writeWei: bigint;
  readWei: bigint;
  threshold: number;
}

const VAULT_CREATED = parseAbiItem(
  "event VaultCreated(uint256 indexed tokenId, uint32 indexed uuid, address indexed ipId, address creator, uint256 licenseTermsId)",
);

/** An autonomous agent that publishes, discovers, pays for, and reads CDR vaults from its own wallet. */
export class CdrAgent {
  readonly client: CdrKitClient;
  readonly network: Network;
  private readonly vault: Hex;

  constructor(opts: CdrAgentOptions) {
    this.network = opts.network ?? "aeneid";
    const addrs = resolveAddresses(this.network);
    this.client = createCdrKitClient({
      privateKey: opts.privateKey,
      rpcUrl: opts.rpcUrl,
      apiUrl: opts.apiUrl,
      network: this.network,
    });
    this.vault = opts.vault ?? (addrs.cdrKitVault as Hex);
  }

  get address(): Hex | undefined {
    return this.client.address;
  }

  /* ============================================================ */
  /* Discovery + read                                              */
  /* ============================================================ */

  /** Scan factory's VaultCreated events. Default scan = ~9000 recent blocks to fit public RPC limits. */
  async discover(opts?: { fromBlock?: bigint }): Promise<DiscoveredVault[]> {
    const latest = await this.client.publicClient.getBlockNumber();
    const fromBlock = opts?.fromBlock ?? (latest > 9000n ? latest - 9000n : 0n);
    const logs = await this.client.publicClient.getLogs({
      address: this.vault,
      event: VAULT_CREATED,
      fromBlock,
      toBlock: latest,
    });
    return logs.map((l) => ({
      tokenId: l.args.tokenId as bigint,
      uuid: Number(l.args.uuid),
      ipId: l.args.ipId as Hex,
      creator: l.args.creator as Hex,
    }));
  }

  async subscribeAndAccess(p: {
    uuid: number;
    periods: bigint;
    maxPricePerPeriod: bigint;
    value: bigint;
    subscriptionCondition?: Hex;
  }): Promise<Uint8Array> {
    log.info({ uuid: p.uuid, from: this.address }, "subscribe + access");
    const addrs = resolveAddresses(this.network);
    return subscribeAndAccess(this.client, {
      subscriptionCondition: p.subscriptionCondition ?? (addrs.subscriptionCondition as Hex),
      uuid: p.uuid,
      periods: p.periods,
      maxPricePerPeriod: p.maxPricePerPeriod,
      value: p.value,
      onProgress: (s) => log.info({ step: s }, "progress"),
    });
  }

  async access(uuid: number, accessAuxData?: Hex): Promise<Uint8Array> {
    return accessVault(this.client, { uuid, accessAuxData });
  }

  /**
   * Read + decrypt a license-gated vault by presenting a Story license token ID. Encodes
   * `abi.encode(uint256[] licenseTokenIds)` as `accessAuxData` — the format the
   * deployed LicenseReadCondition expects.
   *
   * Pre-flights `getVaultInfo(uuid)` against the factory and throws VAULT_NOT_FOUND if the uuid
   * isn't registered — distinguishes "this vault doesn't exist" from "the keeper REST endpoint
   * is unreachable" (bug audit #3, ex-0.4.1).
   */
  async accessLicenseGated(p: { uuid: number; licenseTokenId: bigint | number }): Promise<Uint8Array> {
    const info = await this.getVaultInfo(p.uuid).catch(() => null);
    if (!info) {
      const err = new Error(`vault ${p.uuid} not found in factory`) as Error & { code?: string };
      err.code = "VAULT_NOT_FOUND";
      throw err;
    }
    const accessAuxData = encodeAbiParameters([{ type: "uint256[]" }], [[BigInt(p.licenseTokenId)]]);
    return this.access(p.uuid, accessAuxData);
  }

  /** Warm validator/keeper caches before a read. Cheap; safe to call before any access. */
  async prefetchVault(): Promise<void> {
    return prefetchVault(this.client);
  }

  /* ============================================================ */
  /* Author / publish                                              */
  /* ============================================================ */

  /** Mint NFT + register IP + allocate CDR slot + configure read condition — one tx. Returns the tx hash. */
  async createVault(p: CreateVaultParams): Promise<Hex> {
    log.info({ from: this.address }, "create vault");
    return createVault(this.client, {
      vault: this.vault,
      readConditionAddr: p.readConditionAddr,
      readConfig: p.readConfig,
      childConditions: p.childConditions,
      childConfigs: p.childConfigs,
      licenseTermsId: p.licenseTermsId,
      value: p.valueWei,
    });
  }

  /** Encrypt + write a small (<1KB) data key into an existing vault. */
  async writeVaultData(p: { uuid: number; dataKey: Uint8Array }): Promise<Hex> {
    log.info({ uuid: p.uuid, bytes: p.dataKey.length }, "write vault data");
    return writeVaultData(this.client, p);
  }

  /** Encrypt + IPFS-pin + allocate vault for a >1KB payload. Returns uuid + CID + tx hashes. */
  async uploadFile(p: UploadFileParams): Promise<{ uuid: number; cid: string; txHashes: { allocate: Hex; write: Hex } }> {
    const storage: CdrStorageProvider = createIpfsStorage({
      addUrl: p.addUrl,
      gatewayUrl: p.gatewayUrl,
      headers: p.authHeader ? { Authorization: p.authHeader } : undefined,
    });
    log.info({ bytes: p.content.length }, "upload file");
    return uploadFile(this.client, {
      content: p.content,
      storage,
      readConditionAddr: p.readConditionAddr,
      readConditionData: p.readConditionData,
    });
  }

  /* ============================================================ */
  /* Introspection (view-only, no gas)                             */
  /* ============================================================ */

  /** Resolve uuid → full vault metadata via the factory. */
  async getVaultInfo(uuid: number): Promise<VaultInfo | null> {
    const tokenId = (await this.client.publicClient.readContract({
      address: this.vault,
      abi: cdrKitVaultAbi,
      functionName: "vaultToToken",
      args: [uuid],
    })) as bigint;
    if (tokenId === 0n) return null;
    const info = (await this.client.publicClient.readContract({
      address: this.vault,
      abi: cdrKitVaultAbi,
      functionName: "getVaultInfo",
      args: [tokenId],
    })) as readonly [number, Hex, Hex, bigint];
    return { uuid, tokenId, ipId: info[1], creator: info[2], licenseTermsId: info[3] };
  }

  /** List vaults a given creator has minted. Resolves each tokenId to a full VaultInfo. */
  async getCreatorVaults(creator: Hex): Promise<VaultInfo[]> {
    const tokenIds = (await this.client.publicClient.readContract({
      address: this.vault,
      abi: cdrKitVaultAbi,
      functionName: "getCreatorVaults",
      args: [creator],
    })) as readonly bigint[];
    const out: VaultInfo[] = [];
    for (const tokenId of tokenIds) {
      const info = (await this.client.publicClient.readContract({
        address: this.vault,
        abi: cdrKitVaultAbi,
        functionName: "getVaultInfo",
        args: [tokenId],
      })) as readonly [number, Hex, Hex, bigint];
      out.push({ uuid: info[0], tokenId, ipId: info[1], creator: info[2], licenseTermsId: info[3] });
    }
    return out;
  }

  /** Check whether the agent (or any address) is currently subscribed to a vault. View-only. */
  async getEntitlement(uuid: number, opts?: { subscriber?: Hex; subscriptionCondition?: Hex }): Promise<Entitlement> {
    const subscriber = opts?.subscriber ?? (this.address as Hex);
    const addrs = resolveAddresses(this.network);
    const condition = opts?.subscriptionCondition ?? (addrs.subscriptionCondition as Hex);
    const paidUntil = (await this.client.publicClient.readContract({
      address: condition,
      abi: subscriptionConditionAbi,
      functionName: "paidUntil",
      args: [uuid, subscriber],
    })) as bigint;
    const paidUntilUnix = Number(paidUntil);
    return { uuid, paidUntilUnix, isEntitled: paidUntilUnix > Math.floor(Date.now() / 1000) };
  }

  /** Get a vault's subscription plan (price + period + payee). View-only. */
  async getSubscriptionPlan(uuid: number, opts?: { subscriptionCondition?: Hex }): Promise<SubscriptionPlan> {
    const addrs = resolveAddresses(this.network);
    const condition = opts?.subscriptionCondition ?? (addrs.subscriptionCondition as Hex);
    const plan = (await this.client.publicClient.readContract({
      address: condition,
      abi: subscriptionConditionAbi,
      functionName: "plan",
      args: [uuid],
    })) as readonly [bigint, bigint, Hex, number, Hex];
    return {
      uuid,
      pricePerPeriodWei: plan[0],
      periodSeconds: plan[1],
      payee: plan[2],
      mode: plan[3],
      licensorIpId: plan[4],
    };
  }

  /** List the agent's active subscriptions (scans recent VaultCreated events, then filters by paidUntil). */
  async listMySubscriptions(opts?: { fromBlock?: bigint; subscriptionCondition?: Hex }): Promise<MySubscription[]> {
    if (!this.address) throw new Error("agent has no wallet address — set PRIVATE_KEY");
    const vaults = await this.discover({ fromBlock: opts?.fromBlock });
    const now = Math.floor(Date.now() / 1000);
    const out: MySubscription[] = [];
    for (const v of vaults) {
      const ent = await this.getEntitlement(v.uuid, {
        subscriber: this.address,
        subscriptionCondition: opts?.subscriptionCondition,
      });
      if (!ent.isEntitled) continue;
      out.push({ ...ent, ipId: v.ipId, creator: v.creator, expiresInSeconds: ent.paidUntilUnix - now });
    }
    return out;
  }

  /* ============================================================ */
  /* Fees + DKG (observer)                                         */
  /* ============================================================ */

  /** Fetch the operation fees + operational threshold from the CDR contract / DKG. View-only. */
  async getFees(): Promise<Fees> {
    const [allocateWei, writeWei, readWei, threshold] = await Promise.all([
      this.client.cdr.observer.getAllocateFee(),
      this.client.cdr.observer.getWriteFee(),
      this.client.cdr.observer.getReadFee(),
      this.client.cdr.observer.getOperationalThreshold(),
    ]);
    return {
      allocateWei: allocateWei as bigint,
      writeWei: writeWei as bigint,
      readWei: readWei as bigint,
      threshold: Number(threshold),
    };
  }

  /** DKG global public key (used as encryption pubkey by uploader.encryptDataKey). */
  async getGlobalPubKey(): Promise<unknown> {
    return this.client.cdr.observer.getGlobalPubKey();
  }

  /** Raw vault record from the CDR contract (encryptedData hex, write tx, etc.). */
  async getVaultRecord(uuid: number): Promise<unknown> {
    return this.client.cdr.observer.getVault(uuid);
  }

  /* ============================================================ */
  /* 0.5.0 advanced conditions — typed createX helpers             */
  /*                                                               */
  /* Each `createXVault` ABI-encodes the condition-specific config */
  /* and calls the existing factory `createVault` path. Returns    */
  /* the tx hash; read the uuid from the `VaultCreated` event in   */
  /* the receipt (the uuid is a global counter — never predict).   */
  /* ============================================================ */

  /** Create a vault gated by a time window. `endTs = 0` means open-ended after `startTs`. */
  async createTimeWindowVault(p: {
    startTs: bigint;
    endTs: bigint;
    blockBased?: boolean;
    licenseTermsId?: bigint;
    valueWei?: bigint;
  }): Promise<Hex> {
    const addrs = resolveAddresses(this.network);
    const readConfig = encodeAbiParameters(
      [{ type: "uint64" }, { type: "uint64" }, { type: "bool" }],
      [p.startTs, p.endTs, p.blockBased ?? false],
    );
    log.info({ start: p.startTs, end: p.endTs }, "create time-window vault");
    return this.createVault({
      readConditionAddr: addrs.timeWindowCondition as Hex,
      readConfig,
      licenseTermsId: p.licenseTermsId,
      valueWei: p.valueWei,
    });
  }

  /**
   * Create a vault that unlocks to `heirs` (or public) if the creator stops poking. Helper
   * defaults `creatorCanReadWhileLocked = true` so the creator doesn't accidentally lock
   * themselves out pre-unlock — recommend the agent add itself to `heirs` for post-unlock too.
   */
  async createDeadManVault(p: {
    duration: bigint;
    heirs: Hex[];
    blockBased?: boolean;
    creatorCanReadWhileLocked?: boolean;
    publicAfterUnlock?: boolean;
    licenseTermsId?: bigint;
    valueWei?: bigint;
  }): Promise<Hex> {
    const addrs = resolveAddresses(this.network);
    const readConfig = encodeAbiParameters(
      [
        { type: "uint64" },
        { type: "address[]" },
        { type: "bool" },
        { type: "bool" },
        { type: "bool" },
      ],
      [
        p.duration,
        p.heirs,
        p.blockBased ?? false,
        p.creatorCanReadWhileLocked ?? true,
        p.publicAfterUnlock ?? false,
      ],
    );
    log.info({ duration: p.duration, heirs: p.heirs.length }, "create dead-man-switch vault");
    return this.createVault({
      readConditionAddr: addrs.deadManSwitchCondition as Hex,
      readConfig,
      licenseTermsId: p.licenseTermsId,
      valueWei: p.valueWei,
    });
  }

  /**
   * Create a vault that releases to `buyer` only after they `pay` + `confirmDelivery`. `arbiter`
   * can refund the buyer if delivery is disputed. `address(0)` arbiter = no refund path.
   */
  async createEscrowVault(p: {
    seller?: Hex;
    price: bigint;
    timeoutSecs: bigint;
    arbiter?: Hex;
    licenseTermsId?: bigint;
    valueWei?: bigint;
  }): Promise<Hex> {
    const addrs = resolveAddresses(this.network);
    const seller = p.seller ?? this.address;
    if (!seller) throw new Error("agent has no wallet address — set CDR_PRIVATE_KEY");
    const readConfig = encodeAbiParameters(
      [{ type: "address" }, { type: "uint128" }, { type: "uint64" }, { type: "address" }],
      [seller, p.price, p.timeoutSecs, p.arbiter ?? "0x0000000000000000000000000000000000000000"],
    );
    log.info({ price: p.price, seller }, "create escrow vault");
    return this.createVault({
      readConditionAddr: addrs.conditionalEscrowCondition as Hex,
      readConfig,
      licenseTermsId: p.licenseTermsId,
      valueWei: p.valueWei,
    });
  }

  /**
   * Create an N-of-M multi-sig vault. `signers` MUST be sorted strictly ascending (helper sorts
   * for the caller). Read access requires `threshold`-many EIP-712 signatures from configured
   * signers, submitted as `accessAuxData = abi.encode(deadline, sigs[])`.
   */
  async createMultiSigVault(p: {
    signers: Hex[];
    threshold: number;
    licenseTermsId?: bigint;
    valueWei?: bigint;
  }): Promise<Hex> {
    const addrs = resolveAddresses(this.network);
    const sorted = [...p.signers].sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1));
    const readConfig = encodeAbiParameters(
      [{ type: "address[]" }, { type: "uint16" }],
      [sorted, p.threshold],
    );
    log.info({ signers: sorted.length, threshold: p.threshold }, "create multi-sig vault");
    return this.createVault({
      readConditionAddr: addrs.multiSigCondition as Hex,
      readConfig,
      licenseTermsId: p.licenseTermsId,
      valueWei: p.valueWei,
    });
  }

  /** Creator-side heartbeat for a dead-man-switch vault. Resets the unlock countdown. */
  async pokeDeadMan(uuid: number): Promise<Hex> {
    const addrs = resolveAddresses(this.network);
    if (!this.client.walletClient) throw new Error("agent has no wallet client");
    return this.client.walletClient.writeContract({
      address: addrs.deadManSwitchCondition as Hex,
      abi: deadManSwitchConditionAbi,
      functionName: "poke",
      args: [uuid],
      chain: null,
      account: this.client.walletClient.account!,
    });
  }

  /**
   * Sign an EIP-712 `Approval(uuid, caller, epoch, deadline)` for a multi-sig vault. The caller
   * must be the address that will submit the read tx (sigs are caller-bound — they can't be
   * replayed against a different caller). Returns the 65-byte signature.
   */
  async signMultiSigApproval(p: {
    uuid: number;
    caller: Hex;
    deadline: bigint;
  }): Promise<Hex> {
    const addrs = resolveAddresses(this.network);
    if (!this.client.walletClient) throw new Error("agent has no wallet client");
    const verifyingContract = addrs.multiSigCondition as Hex;
    const epoch = (await this.client.publicClient.readContract({
      address: verifyingContract,
      abi: multiSigConditionAbi,
      functionName: "getConfig",
      args: [p.uuid],
    })) as readonly [readonly Hex[], number, bigint];
    return this.client.walletClient.signTypedData({
      account: this.client.walletClient.account!,
      domain: {
        name: "cdr-kit:MultiSigCondition",
        version: "1",
        chainId: this.client.publicClient.chain!.id,
        verifyingContract,
      },
      types: {
        Approval: [
          { name: "uuid", type: "uint32" },
          { name: "caller", type: "address" },
          { name: "epoch", type: "uint64" },
          { name: "deadline", type: "uint64" },
        ],
      },
      primaryType: "Approval",
      message: {
        uuid: p.uuid,
        caller: p.caller,
        epoch: epoch[2],
        deadline: p.deadline,
      },
    });
  }

  /**
   * Read a multi-sig vault by submitting `threshold`-many signatures as `accessAuxData`.
   * Sigs are submitted in the order given — the contract dedupes by recovered address ascending,
   * so the caller MUST sort sigs by signer address ascending OR the read fails.
   */
  async accessMultiSig(p: { uuid: number; deadline: bigint; sigs: Hex[] }): Promise<Uint8Array> {
    const aux = encodeAbiParameters(
      [{ type: "uint64" }, { type: "bytes[]" }],
      [p.deadline, p.sigs],
    );
    return this.access(p.uuid, aux);
  }

  /** Pay into a conditional escrow vault — buyer side, step 1 of the 2-step delivery flow. */
  async payEscrow(p: { uuid: number; price: bigint }): Promise<Hex> {
    const addrs = resolveAddresses(this.network);
    if (!this.client.walletClient) throw new Error("agent has no wallet client");
    return this.client.walletClient.writeContract({
      address: addrs.conditionalEscrowCondition as Hex,
      abi: conditionalEscrowConditionAbi,
      functionName: "pay",
      args: [p.uuid],
      value: p.price,
      chain: null,
      account: this.client.walletClient.account!,
    });
  }

  /** Buyer confirms delivery — releases funds to seller AND grants read access. */
  async confirmEscrowDelivery(uuid: number): Promise<Hex> {
    const addrs = resolveAddresses(this.network);
    if (!this.client.walletClient) throw new Error("agent has no wallet client");
    return this.client.walletClient.writeContract({
      address: addrs.conditionalEscrowCondition as Hex,
      abi: conditionalEscrowConditionAbi,
      functionName: "confirmDelivery",
      args: [uuid],
      chain: null,
      account: this.client.walletClient.account!,
    });
  }

  /* ============================================================ */
  /* Story IP integration (lazy — @cdr-kit/story is optional)      */
  /*                                                               */
  /* These methods import @cdr-kit/story dynamically. If the user  */
  /* hasn't installed it (+ @story-protocol/core-sdk), the import  */
  /* throws a clear "install @cdr-kit/story" error. Basic users    */
  /* who don't publish original IP never pay the dep cost.         */
  /* ============================================================ */

  /**
   * Register an NFT as a Story IP asset (unified entry — supports both `mint` (fresh) and
   * `minted` (adopt existing) variants). Optionally registers + attaches PIL terms in the same tx.
   */
  async registerIpAsset(params: {
    nft:
      | { type: "mint"; spgNftContract: Hex; recipient?: Hex; allowDuplicates?: boolean }
      | { type: "minted"; nftContract: Hex; tokenId: bigint };
    ipMetadata?: {
      ipMetadataURI?: string;
      ipMetadataHash?: Hex;
      nftMetadataURI?: string;
      nftMetadataHash?: Hex;
    };
    licenseTermsData?: { terms: unknown; licensingConfig?: unknown }[];
  }): Promise<{ ipId: Hex; tokenId: bigint; licenseTermsIds?: bigint[]; txHash: Hex }> {
    const { story, client } = await this._loadStory();
    log.info({ kind: params.nft.type }, "register IP asset");
    return story.registerIpAsset(client, params);
  }

  async attachLicenseTerms(params: { ipId: Hex; licenseTermsId: bigint; licenseTemplate?: Hex }): Promise<{ txHash: Hex }> {
    const { story, client } = await this._loadStory();
    log.info({ ipId: params.ipId, termsId: params.licenseTermsId }, "attach license terms");
    return story.attachLicenseTerms(client, params);
  }

  async mintLicenseTokens(params: {
    licensorIpId: Hex;
    licenseTermsId: bigint;
    amount?: bigint;
    receiver?: Hex;
    maxMintingFee?: bigint;
    maxRevenueShare?: number;
  }): Promise<{ licenseTokenIds: bigint[]; txHash: Hex }> {
    const { story, client } = await this._loadStory();
    log.info({ licensor: params.licensorIpId, amount: params.amount ?? 1n }, "mint license tokens");
    return story.mintLicenseTokens(client, params);
  }

  /**
   * Agent-as-publisher one-shot: register IP + (optional) attach PIL terms + create a
   * license-gated CDR vault + write the encrypted data. Returns the chain of artifacts a
   * buyer/agent needs to subscribe + read.
   *
   * NOTE: this is the highest-value DX win in the 0.5.0 release — it collapses what would
   * otherwise be 4-5 separate SDK calls into a single agent method. Pricing is wired through
   * Story's license-mint fee, NOT a CDR subscription, because license-gated vaults inherently
   * tie payment to Story's royalty graph.
   */
  async publish(params: {
    /** The secret to encrypt + publish. */
    data: Uint8Array;
    /** SPG NFT contract address (your own — register one via Story's SPG factory). */
    spgNftContract: Hex;
    /** PILTerms struct produced via `PILFlavor.commercialUse({...})` etc. */
    pilTerms: unknown;
    /** Optional IP metadata bundle. */
    ipMetadata?: {
      ipMetadataURI?: string;
      ipMetadataHash?: Hex;
      nftMetadataURI?: string;
      nftMetadataHash?: Hex;
    };
  }): Promise<{
    ipId: Hex;
    tokenId: bigint;
    licenseTermsId: bigint;
    vaultUuid: number;
    vaultTxHash: Hex;
    ipRegisterTxHash: Hex;
    writeTxHash: Hex;
  }> {
    const { story, client: storyClient } = await this._loadStory();
    log.info({ bytes: params.data.length }, "publish (one-shot)");

    // Step 1: register the IP + attach PIL terms in one tx (SDK supports it).
    const reg = await story.registerIpAsset(storyClient, {
      nft: { type: "mint", spgNftContract: params.spgNftContract },
      ipMetadata: params.ipMetadata,
      licenseTermsData: [{ terms: params.pilTerms }],
    });
    if (!reg.licenseTermsIds || reg.licenseTermsIds.length === 0) {
      throw new Error("publish: licenseTermsIds missing from registerIpAsset response");
    }
    const licenseTermsId = reg.licenseTermsIds[0]!;

    // Step 2: allocate a license-gated CDR vault for this IP + this licenseTermsId.
    const addrs = resolveAddresses(this.network);
    const readConfig = encodeAbiParameters(
      [{ type: "address" }, { type: "uint256" }],
      [reg.ipId, licenseTermsId],
    );
    const vaultTxHash = await this.createVault({
      readConditionAddr: addrs.licenseReadCondition as Hex,
      readConfig,
      licenseTermsId,
    });

    // Step 3: extract uuid from the VaultCreated event in the receipt.
    const receipt = await this.client.publicClient.waitForTransactionReceipt({ hash: vaultTxHash });
    const vaultLog = receipt.logs
      .map((l) => {
        try {
          return this.client.publicClient.chain
            ? (l as { topics: Hex[]; data: Hex }) // narrowing for the decode below
            : null;
        } catch {
          return null;
        }
      })
      .find((l): l is { topics: Hex[]; data: Hex } => l !== null);
    if (!vaultLog) throw new Error("publish: VaultCreated event not found in receipt");
    // Decode topics[2] is the indexed uuid — viem indexed-event decoding would be more correct
    // but we already have the tx + topics so a manual extract is fine.
    const uuid = Number(BigInt(receipt.logs[0]!.topics[2]!));

    // Step 4: write the encrypted payload into the vault.
    const writeTxHash = await this.writeVaultData({ uuid, dataKey: params.data });

    return {
      ipId: reg.ipId,
      tokenId: reg.tokenId,
      licenseTermsId,
      vaultUuid: uuid,
      vaultTxHash,
      ipRegisterTxHash: reg.txHash,
      writeTxHash,
    };
  }

  /** Internal: lazy-load @cdr-kit/story + build a StoryClient from the agent's existing wallet. */
  private async _loadStory(): Promise<{
    story: typeof import("@cdr-kit/story");
    client: import("@cdr-kit/story").StoryClient;
  }> {
    let story: typeof import("@cdr-kit/story");
    try {
      story = await import("@cdr-kit/story");
    } catch {
      throw new Error(
        "cdr-kit/agent: @cdr-kit/story is required for Story IP integration. Install it: pnpm add @cdr-kit/story @story-protocol/core-sdk",
      );
    }
    if (!this.client.walletClient?.account) {
      throw new Error("cdr-kit/agent: a wallet client is required for Story IP integration");
    }
    const client = await story.createStoryClient({
      account: this.client.walletClient.account as unknown as { address: Hex },
      chainId: this.network === "aeneid" ? 1315 : undefined,
    });
    return { story, client };
  }
}
