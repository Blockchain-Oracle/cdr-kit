# Story IP / PIL / Royalty — mechanics for our conditions

Source: `protocol-core-v1@main` + `docs.story.foundation/developers/deployed-smart-contracts`. Addresses in `cdr-protocol-truth.md`. Aeneid == mainnet addresses for core contracts (only `IpRoyaltyVaultImpl` differs). Pragma `0.8.26`.

## ipId = deterministic ERC-6551 account
`IPAssetRegistry.register(uint256 chainid, address tokenContract, uint256 tokenId) returns (address id)`.
`ipId(chainId, tokenContract, tokenId) view` is **computable before registration** (ERC-6551 account from fixed impl+salt). `isRegistered(address) view`.
Registration *may* charge `feeToken()/feeAmount()` — currently 0/unset on Aeneid; **read on-chain, unverified.**

## PIL terms + licenseTermsId
`PILTerms` struct (17 fields; note the fee field is **`defaultMintingFee`**, not `mintingFee`):
```solidity
struct PILTerms {
  bool transferable; address royaltyPolicy; uint256 defaultMintingFee; uint256 expiration;
  bool commercialUse; bool commercialAttribution; address commercializerChecker; bytes commercializerCheckerData;
  uint32 commercialRevShare; uint256 commercialRevCeiling;
  bool derivativesAllowed; bool derivativesAttribution; bool derivativesApproval; bool derivativesReciprocal;
  uint256 derivativeRevCeiling; address currency; string uri;
}
```
- `PILicenseTemplate.registerLicenseTerms(PILTerms) returns (uint256 licenseTermsId)` — global ID on the template, **deduped** (identical terms → same id). Read back: `getLicenseTerms(id) view`, find id: `getLicenseTermsId(PILTerms) view`.
- `LicensingModule.attachLicenseTerms(address ipId, address licenseTemplate, uint256 licenseTermsId)`.
- Check attachment (view): `LicenseRegistry.hasIpAttachedLicenseTerms(ipId, template, termsId) view returns (bool)`, plus `getAttachedLicenseTerms(ipId, index)` / `getAttachedLicenseTermsCount(ipId)`.

## Minting license tokens (the payment path)
```solidity
LicensingModule.mintLicenseTokens(
  address licensorIpId, address licenseTemplate, uint256 licenseTermsId,
  uint256 amount, address receiver,
  bytes royaltyContext, uint256 maxMintingFee, uint32 maxRevenueShare
) returns (uint256 startLicenseTokenId);
```
Pulls `defaultMintingFee * amount` in the terms' `currency` ERC-20 (typically **WIP** `0x1514…`) from caller → routes through `RoyaltyModule.payLicenseMintingFee` to the licensor IP's royalty vault (treasury fee skimmed). **Caller must `approve` the currency first.** SDK path: `wipClient.deposit` → `wipClient.approve(RoyaltyModule)` → `license.mintLicenseTokens`.

## ✅ Tier IS readable in a view (enables TierGateCondition)
`LicenseToken` (ERC721) public views:
```solidity
getLicenseTermsId(uint256 tokenId) view returns (uint256);     // <-- THE TIER
getLicensorIpId(uint256 tokenId) view returns (address);
getLicenseTemplate(uint256 tokenId) view returns (address);
getLicenseTokenMetadata(tokenId) view returns (LicenseTokenMetadata{licensorIpId, licenseTemplate, licenseTermsId, transferable});
isLicenseTokenRevoked(uint256 tokenId) view returns (bool);    // <-- revoked when licensor IP disputed/tagged
ownerOf / balanceOf / tokenOfOwnerByIndex (ERC721Enumerable)
```
**TierGate `checkReadCondition`**: take `tokenId` in `accessAuxData` → `ownerOf(tokenId)==caller` → `getLicensorIpId==expectedIpId` → `getLicenseTemplate==PILicenseTemplate` → `getLicenseTermsId(tokenId) ∈ allowedTierIds` → `!isLicenseTokenRevoked(tokenId)`. All pure view.

## ⚠️ No native per-token expiry
- `LicenseTokenMetadata` has **no expiry**; there is no `getExpiry(tokenId)`. `PILTerms.expiration` is NOT stored per minted token.
- IP-level expiry exists only for **derivatives**: `LicenseRegistry.getExpireTime(ipId) view` / `isExpiredNow(ipId) view` (child inherits soonest parent expiry). Not per-subscriber.
- ⇒ **SubscriptionCondition must track expiry itself**: `mapping(address => uint256) paidUntil` in our contract, renewable.

## ⚠️ A `view` condition CANNOT take payment — 2-step pattern is mandatory
`RoyaltyModule.payRoyaltyOnBehalf(receiverIpId, payerIpId, token, amount)` is **state-mutating** (`nonReentrant`, does `safeTransferFrom`). `mintLicenseTokens` is mutating. A `view` can't transfer, write storage, or emit. So:

1. **Mutating tx (off the condition path):** subscriber pays — one of:
   - (a) `LicensingModule.mintLicenseTokens(...)` (fee auto-routes to royalty vault), or
   - (b) `RoyaltyModule.payRoyaltyOnBehalf(...)` (WIP must be whitelisted: `isWhitelistedRoyaltyToken(token) view`), or
   - (c) our own `subscribe()` recording `paidUntil[caller] = block.timestamp + period`.
2. **`view` condition reads the resulting state:**
   - TierGate → license-token views above.
   - Subscription → our `paidUntil[caller] > block.timestamp` (since no native per-token expiry).
   - Revocable → `isLicenseTokenRevoked(tokenId)` and/or `LicenseRegistry.isExpiredNow(ipId)` and/or our own revoke flag. `PILTerms.transferable` controls whether the gate survives transfer — gate on `ownerOf==caller` to re-check each access.

IP-owner claims revenue: `IpRoyaltyVault.claimableRevenue(claimer, token) view` / `claimRevenueOnBehalf(claimer, token)`. `RoyaltyModule.ipRoyaltyVaults(ipId) view`, `totalRevenueTokensReceived(ipId, token) view`.
