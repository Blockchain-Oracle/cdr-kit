import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CDRClient } from "@piplabs/cdr-sdk";
import { aeneid, resolveAddresses, type Network } from "@cdr-kit/contracts";

/** Story Aeneid testnet (chain 1315). Kept as a named export for backwards compat. */
export const aeneidChain = defineChain({
  id: aeneid.chainId,
  name: "Story Aeneid",
  nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 },
  rpcUrls: { default: { http: [aeneid.rpcUrl] } },
});

export interface CdrKitClientOptions {
  /** Private key (testnet only) — used to derive a wallet client if one isn't supplied. */
  privateKey?: Hex;
  walletClient?: WalletClient;
  publicClient?: PublicClient;
  /** Override the RPC URL (default: the network's canonical RPC from @cdr-kit/contracts). */
  rpcUrl?: string;
  /** Story-API REST base URL (required by the CDR SDK; default: the network's canonical apiUrl). */
  apiUrl?: string;
  /** Target network. Default "aeneid". "mainnet" throws today (not yet deployed). */
  network?: Network;
}

export interface CdrKitClient {
  cdr: CDRClient;
  publicClient: PublicClient;
  walletClient?: WalletClient;
  address?: Hex;
  network: Network;
}

function chainFor(network: Network) {
  if (network === "aeneid") return aeneidChain;
  // resolveAddresses() will throw for unsupported networks — but if a future network is added we
  // build its chain dynamically from the address bundle so we don't need a branch per network.
  const addrs = resolveAddresses(network);
  return defineChain({
    id: addrs.chainId as number,
    name: network,
    nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 },
    rpcUrls: { default: { http: [addrs.rpcUrl as string] } },
  });
}

/** Build a cdr-kit client: viem public/wallet clients + the underlying CDR SDK client. */
export function createCdrKitClient(opts: CdrKitClientOptions = {}): CdrKitClient {
  const network: Network = opts.network ?? "aeneid";
  // Calling resolveAddresses(network) on "mainnet" throws — propagate cleanly so consumers
  // see "mainnet not deployed" right at client construction, not later inside a tx call.
  const addrs = resolveAddresses(network);
  const rpcUrl = opts.rpcUrl ?? (addrs.rpcUrl as string);
  const apiUrl = opts.apiUrl ?? (addrs.apiUrl as string);
  const chain = chainFor(network);

  const publicClient =
    opts.publicClient ?? (createPublicClient({ chain, transport: http(rpcUrl) }) as PublicClient);

  let walletClient = opts.walletClient;
  let address: Hex | undefined = walletClient?.account?.address;
  if (!walletClient && opts.privateKey) {
    const account = privateKeyToAccount(opts.privateKey);
    address = account.address;
    walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });
  }

  const cdr = new CDRClient({ network: "testnet", publicClient, walletClient, apiUrl });
  return { cdr, publicClient, walletClient, address, network };
}
