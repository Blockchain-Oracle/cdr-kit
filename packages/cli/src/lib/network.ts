import { resolveAddresses, type AeneidAddresses, type Network } from "@cdr-kit/contracts";

export interface ResolvedNetwork {
  network: Network;
  chainId: number;
  rpcUrl: string;
  apiUrl: string;
  addresses: AeneidAddresses;
}

/**
 * Resolve a network from a flag-or-env. Precedence: explicit arg > `CDR_NETWORK` env > "aeneid".
 * Throws clearly on mainnet (not yet deployed) so the failure surfaces at config time, not deep
 * inside an RPC call.
 */
export function resolveNetwork(flag?: string): ResolvedNetwork {
  const raw = (flag ?? process.env.CDR_NETWORK ?? "aeneid").toLowerCase();
  if (raw !== "aeneid" && raw !== "mainnet") {
    throw new Error(`cdr-kit: unknown network "${raw}". Use --network aeneid (default) or mainnet.`);
  }
  const network = raw as Network;
  const addresses = resolveAddresses(network); // throws on mainnet today
  const rpcUrl = process.env.CDR_RPC_URL ?? (addresses.rpcUrl as string);
  const apiUrl = process.env.CDR_API_URL ?? (addresses.apiUrl as string);
  return {
    network,
    chainId: addresses.chainId as number,
    rpcUrl,
    apiUrl,
    addresses,
  };
}
