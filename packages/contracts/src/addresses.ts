/// Single source of truth for deployed addresses. Verified on-chain 2026-05-28.
/// CDR-kit contract addresses are filled in by the deploy script (scripts/Deploy.s.sol).

export const aeneid = {
  chainId: 1315,
  rpcUrl: "https://aeneid.storyrpc.io",
  // Story CDR
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

/// CDR precompile calls to allocate/write/read OOG under eth_estimateGas — always set an explicit
/// gas limit (see context/research/cdr-protocol-truth.md, live finding #2).
export const CDR_GAS_LIMIT = 2_000_000n;

/// Event topic0 for CDR's VaultAllocated (read your uuid from your own tx receipt; uuid is global).
export const VAULT_ALLOCATED_TOPIC =
  "0xf1370099e56e061a64615edc07c1d17e36a20585cdc9b288bf0259a528365d0a";

export type AeneidAddresses = typeof aeneid;
