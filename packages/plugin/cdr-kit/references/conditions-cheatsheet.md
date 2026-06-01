# CDR conditions cheatsheet

Loaded by the plugin's skills when more depth is needed than fits in a 500-line SKILL.md. Mirror the live ABIs in `@cdr-kit/contracts.generated`.

## Table of contents

- [Deployed addresses (Aeneid)](#deployed-addresses-aeneid)
- [Read conditions](#read-conditions)
  - [openCondition](#opencondition)
  - [subscriptionCondition](#subscriptioncondition)
  - [tierGateCondition](#tiergatecondition)
  - [composableCondition](#composablecondition)
  - [licenseReadCondition](#licensereadcondition)
- [Write conditions](#write-conditions)
  - [creatorWriteCondition](#creatorwritecondition)
  - [ownerWriteCondition](#ownerwritecondition)
- [Encoding patterns](#encoding-patterns)
- [Common gotchas](#common-gotchas)

## Deployed addresses (Aeneid)

| Condition | Address |
|---|---|
| `openCondition` | `0x36fB2e2d10efd1E905b7779A684F34B9c775b62B` |
| `subscriptionCondition` | `0xB75Cc6571ac7E0ee30A519192740fc471e187458` |
| `tierGateCondition` | `0xdA704Faf61b2FFB37205d7Eb8C1D26BD3090455f` |
| `composableCondition` | `0x74F2f94e7867b07ECDFbcc667050CBec1dE2800B` |
| `licenseReadCondition` | `0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3` |
| `creatorWriteCondition` | `0x85CEB332445ca1d3D1975d6929cA6BED25195b2F` |
| `ownerWriteCondition` | `0x4C9bFC96d7092b590D497A191826C3dA2277c34B` |
| `cdrKitVault` (factory) | `0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C` |

(One source of truth: `@cdr-kit/contracts`'s `aeneid` constant. Never hardcode.)

## Read conditions

### openCondition

- `readConditionData`: `"0x"` (empty)
- `accessAuxData` at read time: `"0x"`
- Use for: public hints, teaser data, gating where the gate is a different on-chain check

### subscriptionCondition

- `readConditionData`: ABI-encoded `(uint256 pricePerPeriod, uint256 period, address payee, uint8 mode, address licensorIpId)`
  - `pricePerPeriod`: wei per period
  - `period`: seconds (86400=1d, 604800=1wk, 2592000≈1mo)
  - `payee`: where subscription payments go
  - `mode`: `0`=native IP, `1`=WIP (ERC20 wrapped IP)
  - `licensorIpId`: Story IP asset for revenue routing (can be `address(0)`)
- `accessAuxData` at read time: `"0x"`
- Check: `paidUntil(uuid, subscriber) > block.timestamp`
- Subscribe via `subscribe(uuid, periods, maxPricePerPeriod)` payable

### tierGateCondition

- `readConditionData`: ABI-encoded `(address token, uint256 minBalance)`
- `accessAuxData` at read time: `"0x"`
- Check: `IERC20(token).balanceOf(caller) >= minBalance` (or `ERC721.balanceOf` for NFT tiers)

### composableCondition

- `readConditionData`: ABI-encoded `(address[] children, bytes[] childConfigs, uint8 logic)` where `logic` is `0`=AND, `1`=OR
- Each child evaluated in order; first short-circuit wins for OR / first failure wins for AND
- `accessAuxData` is forwarded to every child — design child encodings to ignore aux data they don't use

### licenseReadCondition

- `readConditionData`: ABI-encoded `(address licenseTokenContract, address ipId)` where `licenseTokenContract = 0xFe3838BFb30B34170F00030B52eA4893d8aAC6bC` (Aeneid LicenseToken)
- `accessAuxData` at read time: ABI-encoded `(uint256[] licenseTokenIds)`
- Check: at least one of `licenseTokenIds` is owned by caller AND tied to `ipId`
- Reader must mint a license token first via Story's `LicensingModule.mintLicenseTokens` (handled by `@cdr-kit/story` in 0.5.0)

## Write conditions

### creatorWriteCondition

- `writeConditionData`: `"0x"`
- Check: `caller == NFT.ownerOf(vaultTokenId)`
- The default for almost every flow

### ownerWriteCondition

- `writeConditionData`: ABI-encoded `(address owner)`
- Check: `caller == owner`
- Use for demo vaults / one-shot uploads

## Encoding patterns

```ts
import { encodeAbiParameters, parseEther } from "viem";

// subscription
const subConfig = encodeAbiParameters(
  [
    { type: "uint256", name: "pricePerPeriod" },
    { type: "uint256", name: "period" },
    { type: "address", name: "payee" },
    { type: "uint8", name: "mode" },
    { type: "address", name: "licensorIpId" },
  ],
  [parseEther("5"), 30n * 86400n, payee, 0 /* native IP */, ipId],
);

// tier-gate
const tierConfig = encodeAbiParameters(
  [{ type: "address" }, { type: "uint256" }],
  [tokenAddr, 100n],
);

// license-read
const licenseConfig = encodeAbiParameters(
  [{ type: "address" }, { type: "address" }],
  ["0xFe3838BFb30B34170F00030B52eA4893d8aAC6bC", ipId],
);

// accessAuxData for license-read at read time
const aux = encodeAbiParameters([{ type: "uint256[]" }], [[licenseTokenId]]);
```

## Common gotchas

1. **Don't pass `writeConditionData` for `creatorWriteCondition`** — it ignores the data; pass `"0x"`.
2. **`subscriptionCondition` mode `1` (WIP) requires the reader to wrap IP first** — `@cdr-kit/story@^0.5.0` exposes the wrap+approve helpers. Until then, reader does it manually via `@story-protocol/core-sdk`'s `wipClient.deposit` + `approve`.
3. **`licenseReadCondition` will revert on read** (not just return false) if the reader doesn't own the token — partial collection won't even start.
4. **`composableCondition` AND-logic is short-circuit** — order children by failure-likelihood (cheapest-to-fail first) to save read gas.
