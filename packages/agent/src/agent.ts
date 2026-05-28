import { parseAbiItem, type Hex } from "viem";
import { createCdrKitClient, accessVault, subscribeAndAccess, type CdrKitClient } from "@cdr-kit/core";
import { aeneid } from "@cdr-kit/contracts";
import { consola } from "consola";

export interface CdrAgentOptions {
  /** Agent's own wallet key (testnet). */
  privateKey: Hex;
  rpcUrl?: string;
  /** Story-API REST base URL. */
  apiUrl: string;
  /** Factory to discover vaults from (defaults to the deployed CdrKitVault). */
  vault?: Hex;
}

export interface DiscoveredVault {
  tokenId: bigint;
  uuid: number;
  ipId: Hex;
  creator: Hex;
}

const VAULT_CREATED = parseAbiItem(
  "event VaultCreated(uint256 indexed tokenId, uint32 indexed uuid, address indexed ipId, address creator, uint256 licenseTermsId)",
);

/** An autonomous agent that discovers, pays for, and reads CDR vaults from its own wallet. */
export class CdrAgent {
  readonly client: CdrKitClient;
  private readonly vault: Hex;
  private readonly log = consola.withTag("cdr-agent");

  constructor(opts: CdrAgentOptions) {
    this.client = createCdrKitClient({ privateKey: opts.privateKey, rpcUrl: opts.rpcUrl, apiUrl: opts.apiUrl });
    this.vault = opts.vault ?? (aeneid.cdrKitVault as Hex);
  }

  get address(): Hex | undefined {
    return this.client.address;
  }

  /**
   * Discover vaults by scanning the factory's VaultCreated events. Defaults to a bounded recent
   * window to stay within public-RPC eth_getLogs limits; pass `fromBlock` for a wider scan or use
   * an indexer in production.
   */
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

  /** Subscribe (pay) then access — fully autonomous, no human in the loop. */
  async subscribeAndAccess(p: {
    uuid: number;
    periods: bigint;
    maxPricePerPeriod: bigint;
    value: bigint;
    subscriptionCondition?: Hex;
  }): Promise<Uint8Array> {
    this.log.info(`subscribing to vault ${p.uuid} from ${this.address}`);
    return subscribeAndAccess(this.client, {
      subscriptionCondition: p.subscriptionCondition ?? (aeneid.subscriptionCondition as Hex),
      uuid: p.uuid,
      periods: p.periods,
      maxPricePerPeriod: p.maxPricePerPeriod,
      value: p.value,
      onProgress: (s) => this.log.info(`  ${s}`),
    });
  }

  /** Read + decrypt a vault the agent is already entitled to. */
  async access(uuid: number, accessAuxData?: Hex): Promise<Uint8Array> {
    return accessVault(this.client, { uuid, accessAuxData });
  }
}
