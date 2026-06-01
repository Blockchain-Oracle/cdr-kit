/// Single source of truth for deployed addresses. Verified on-chain 2026-05-28.
/// CDR-kit contract addresses are filled in by the deploy script (scripts/Deploy.s.sol).

import type { Hex } from "viem";

export const aeneid = {
  chainId: 1315,
  rpcUrl: "https://aeneid.storyrpc.io",
  apiUrl: "http://172.192.41.96:1317",
  // Story CDR
  dkg: "0xCcCcCC0000000000000000000000000000000004",
  cdr: "0xCCCcCC0000000000000000000000000000000005",
  licenseReadCondition: "0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3", // live (NOT 0xD429…)
  ownerWriteCondition: "0x4C9bFC96d7092b590D497A191826C3dA2277c34B",
  // Story IP core
  ipAssetRegistry: "0x77319B4031e6eF1250907aa00018B8B1c67a244b",
  licenseRegistry: "0x529a750E02d8E2f15649c13D69a465286a780e24",
  licensingModule: "0x04fbd8a2e56dd85CFD5500A4A4DfA955B9f1dE6f",
  licenseToken: "0xFe3838BFb30B34170F00030B52eA4893d8aAC6bC",
  pilTemplate: "0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316",
  royaltyModule: "0xD2f60c40fEbccf6311f8B47c4f2Ec6b040400086",
  royaltyPolicyLap: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
  royaltyWorkflows: "0x9515faE61E0c0447C6AC6dEe5628A2097aFE1890",
  registrationWorkflows: "0xbe39E1C756e921BD25DF86e7AAa31106d1eb0424",
  /// Mock ERC20 used by Story tests + as a whitelisted revenue token.
  merc20: "0xF2104833d386a2734a4eB3B8ad6FC6812F29E38E",
  /// Wrapped IP (ERC-20 form of native IP); license-mint fees flow in WIP via the Royalty module.
  wip: "0x1514000000000000000000000000000000000000",
  // cdr-kit (deployed to Aeneid 2026-05-28)
  openCondition: "0x36fB2e2d10efd1E905b7779A684F34B9c775b62B",
  cdrKitVault: "0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C",
  creatorWriteCondition: "0x85CEB332445ca1d3D1975d6929cA6BED25195b2F",
  subscriptionCondition: "0xB75Cc6571ac7E0ee30A519192740fc471e187458",
  tierGateCondition: "0xdA704Faf61b2FFB37205d7Eb8C1D26BD3090455f",
  composableCondition: "0x74F2f94e7867b07ECDFbcc667050CBec1dE2800B",
  defaultLicenseTermsId: 2536,
} as const;

/// Mainnet placeholder. All addresses null until Story CDR mainnet deploys.
/// `resolveAddresses("mainnet")` throws a clear error today; flipping this to populated
/// addresses + a real chainId is a one-line change when the deployment happens.
export const mainnet = {
  chainId: null,
  rpcUrl: null,
  apiUrl: null,
  dkg: null,
  cdr: null,
  licenseReadCondition: null,
  ownerWriteCondition: null,
  ipAssetRegistry: null,
  licenseRegistry: null,
  licensingModule: null,
  licenseToken: null,
  pilTemplate: null,
  royaltyModule: null,
  royaltyPolicyLap: null,
  royaltyWorkflows: null,
  registrationWorkflows: null,
  merc20: null,
  wip: null,
  openCondition: null,
  cdrKitVault: null,
  creatorWriteCondition: null,
  subscriptionCondition: null,
  tierGateCondition: null,
  composableCondition: null,
  defaultLicenseTermsId: null,
} as const;

export type Network = "aeneid" | "mainnet";

export const networks = { aeneid, mainnet };

/// CDR precompile calls to allocate/write/read OOG under eth_estimateGas — always set an explicit
/// gas limit (see context/research/cdr-protocol-truth.md, live finding #2).
export const CDR_GAS_LIMIT = 2_000_000n;

/// Event topic0 for CDR's VaultAllocated (read your uuid from your own tx receipt; uuid is global).
export const VAULT_ALLOCATED_TOPIC =
  "0xf1370099e56e061a64615edc07c1d17e36a20585cdc9b288bf0259a528365d0a";

export type AeneidAddresses = typeof aeneid;

/// Resolve the address bundle for a network. Throws clearly if the network isn't deployed yet
/// so consumers see "mainnet not deployed" instead of cryptic null-deref runtime errors.
export function resolveAddresses(network: Network = "aeneid"): AeneidAddresses {
  if (network === "aeneid") return aeneid;
  if (network === "mainnet") {
    throw new Error(
      "cdr-kit: Story mainnet is not yet deployed. Use --network aeneid (default).",
    );
  }
  throw new Error(`cdr-kit: unknown network "${network as string}". Use "aeneid" or "mainnet".`);
}

/// Convenience cast — most callers want viem's Hex type for address fields.
export const aeneidAddr = (key: keyof AeneidAddresses): Hex => aeneid[key] as unknown as Hex;
