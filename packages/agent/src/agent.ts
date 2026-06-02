import { parseAbiItem, encodeAbiParameters, type Hex } from "viem";
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
  type Network,
} from "@cdr-kit/contracts";
import { log } from "./logger.js";
import * as advanced from "./agent-advanced.js";
import * as story from "./agent-story.js";

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
  /* 0.5.0 advanced conditions — delegated to ./agent-advanced.ts  */
  /* ============================================================ */
  createTimeWindowVault(p: Parameters<typeof advanced.createTimeWindowVault>[1]): Promise<Hex> {
    return advanced.createTimeWindowVault(this, p);
  }
  createDeadManVault(p: Parameters<typeof advanced.createDeadManVault>[1]): Promise<Hex> {
    return advanced.createDeadManVault(this, p);
  }
  createEscrowVault(p: Parameters<typeof advanced.createEscrowVault>[1]): Promise<Hex> {
    return advanced.createEscrowVault(this, p);
  }
  createMultiSigVault(p: Parameters<typeof advanced.createMultiSigVault>[1]): Promise<Hex> {
    return advanced.createMultiSigVault(this, p);
  }
  /** Safe-style on-chain approve for a multi-sig vault. Signer pays gas; dashboards read the
   *  truth via `currentApprovalsCount(uuid)`. Parallel to the gas-free off-chain EIP-712 path.
   *
   *  Reads `getConfig(uuid).epoch` to bind the approval to the signer's intent — if a rotation
   *  lands first the tx reverts with `EpochChanged`. Pass `expectedEpoch` to skip the lookup. */
  approveMultiSig(uuid: number, expectedEpoch?: bigint): Promise<Hex> {
    return advanced.approveMultiSig(this, uuid, expectedEpoch);
  }
  pokeDeadMan(uuid: number): Promise<Hex> {
    return advanced.pokeDeadMan(this, uuid);
  }
  signMultiSigApproval(p: Parameters<typeof advanced.signMultiSigApproval>[1]): Promise<Hex> {
    return advanced.signMultiSigApproval(this, p);
  }
  accessMultiSig(p: Parameters<typeof advanced.accessMultiSig>[1]): Promise<Uint8Array> {
    return advanced.accessMultiSig(this, p);
  }
  payEscrow(p: Parameters<typeof advanced.payEscrow>[1]): Promise<Hex> {
    return advanced.payEscrow(this, p);
  }
  confirmEscrowDelivery(uuid: number): Promise<Hex> {
    return advanced.confirmEscrowDelivery(this, uuid);
  }
  /** Seller-side: claim funds + auto-grant buyer read after the listing timeout lapses. */
  claimEscrowAfterTimeout(p: Parameters<typeof advanced.claimEscrowAfterTimeout>[1]): Promise<Hex> {
    return advanced.claimEscrowAfterTimeout(this, p);
  }
  /** Arbiter-side: refund a disputed payment. */
  refundEscrow(p: Parameters<typeof advanced.refundEscrow>[1]): Promise<Hex> {
    return advanced.refundEscrow(this, p);
  }
  /** Creator-side: swap multi-sig signer set / threshold; bumps epoch — invalidates BOTH paths. */
  rotateMultiSigSigners(p: Parameters<typeof advanced.rotateMultiSigSigners>[1]): Promise<Hex> {
    return advanced.rotateMultiSigSigners(this, p);
  }

  /* ============================================================ */
  /* 0.5.0 Story IP integration — delegated to ./agent-story.ts    */
  /* (@cdr-kit/story is an optional peer dep; helpers lazy-load it)*/
  /* ============================================================ */
  /** Deploy a fresh SPG NFT collection — prerequisite for `registerIpAsset` / `publish` to mint
   *  new tokens. Returns the collection address; pass it as `spgNftContract` in later calls. */
  createSpgCollection(
    params: Parameters<typeof story.createSpgCollection>[1],
  ): ReturnType<typeof story.createSpgCollection> {
    return story.createSpgCollection(this, params);
  }
  registerIpAsset(params: Parameters<typeof story.registerIpAsset>[1]): ReturnType<typeof story.registerIpAsset> {
    return story.registerIpAsset(this, params);
  }
  attachLicenseTerms(params: Parameters<typeof story.attachLicenseTerms>[1]): ReturnType<typeof story.attachLicenseTerms> {
    return story.attachLicenseTerms(this, params);
  }
  mintLicenseTokens(params: Parameters<typeof story.mintLicenseTokens>[1]): ReturnType<typeof story.mintLicenseTokens> {
    return story.mintLicenseTokens(this, params);
  }
  publish(params: Parameters<typeof story.publish>[1]): ReturnType<typeof story.publish> {
    return story.publish(this, params);
  }
  /** Register a derivative IP — inherits parent's PIL terms. */
  registerDerivative(params: Parameters<typeof story.registerDerivative>[1]): ReturnType<typeof story.registerDerivative> {
    return story.registerDerivative(this, params);
  }
  /** Register fresh PIL terms (returns licenseTermsId) without attaching to a specific IP. */
  registerPilTerms(params: Parameters<typeof story.registerPilTerms>[1]): ReturnType<typeof story.registerPilTerms> {
    return story.registerPilTerms(this, params);
  }
  /** Wrap native IP → WIP (ERC-20 form, required for royalty payments). */
  wrapIp(params: Parameters<typeof story.wrapIp>[1]): ReturnType<typeof story.wrapIp> {
    return story.wrapIp(this, params);
  }
  /** Approve a WIP spender (typically the RoyaltyModule) to pull `amountWei`. */
  approveWip(params: Parameters<typeof story.approveWip>[1]): ReturnType<typeof story.approveWip> {
    return story.approveWip(this, params);
  }
}
