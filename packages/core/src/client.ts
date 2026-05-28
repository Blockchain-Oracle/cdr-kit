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
import { aeneid } from "@cdr-kit/contracts";

/** Story Aeneid testnet (chain 1315). */
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
  rpcUrl?: string;
  /** Story-API REST base URL (required by the CDR SDK). */
  apiUrl: string;
}

export interface CdrKitClient {
  cdr: CDRClient;
  publicClient: PublicClient;
  walletClient?: WalletClient;
  address?: Hex;
}

/** Build a cdr-kit client: viem public/wallet clients + the underlying CDR SDK client. */
export function createCdrKitClient(opts: CdrKitClientOptions): CdrKitClient {
  const rpcUrl = opts.rpcUrl ?? aeneid.rpcUrl;
  const publicClient =
    opts.publicClient ?? (createPublicClient({ chain: aeneidChain, transport: http(rpcUrl) }) as PublicClient);

  let walletClient = opts.walletClient;
  let address: Hex | undefined = walletClient?.account?.address;
  if (!walletClient && opts.privateKey) {
    const account = privateKeyToAccount(opts.privateKey);
    address = account.address;
    walletClient = createWalletClient({ account, chain: aeneidChain, transport: http(rpcUrl) });
  }

  const cdr = new CDRClient({ network: "testnet", publicClient, walletClient, apiUrl: opts.apiUrl });
  return { cdr, publicClient, walletClient, address };
}
