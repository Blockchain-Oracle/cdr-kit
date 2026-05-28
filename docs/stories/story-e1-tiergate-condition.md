# Story E1 — TierGateCondition (the Story-IP moat)

**As** an IP owner, **I want** different content unlocked by *which license tier* a buyer holds (preview vs commercial vs exclusive) **so that** access maps to PIL terms — something Lit/TACo cannot do. Feasible because `LicenseToken.getLicenseTermsId(tokenId)` is a `view` (`../../context/research/story-ip-royalty.md`).

## Design
```solidity
struct Gate { address ipId; mapping(uint256 => bool) allowedTerms; }   // allowed licenseTermsIds
mapping(uint32 => Gate) gate;
address immutable LICENSE_TOKEN;   // constructor-injected (live = 0xC064… era LicenseToken 0xFe38…); never hardcoded
address immutable PIL_TEMPLATE;    // constructor-injected
address immutable factory;         // CdrKitVault — onlyVault (D8)

// D14 canonical entrypoint: config = abi.encode(address ipId, uint256[] allowedTermsIds)
function setConfigFromFactory(uint32 uuid, address creator, bytes calldata config) external; // onlyVault; AlreadyConfigured guard (D13); decodes into gate[uuid]

function checkReadCondition(uint32 uuid, bytes calldata accessAuxData, bytes, address caller) external view returns (bool) {
    uint256 tokenId = abi.decode(accessAuxData, (uint256));
    Gate storage g = gate[uuid];
    if (ILicenseToken(LICENSE_TOKEN).ownerOf(tokenId) != caller) return false;
    if (ILicenseToken(LICENSE_TOKEN).getLicensorIpId(tokenId) != g.ipId) return false;
    if (ILicenseToken(LICENSE_TOKEN).getLicenseTemplate(tokenId) != PIL_TEMPLATE) return false;
    if (ILicenseToken(LICENSE_TOKEN).isLicenseTokenRevoked(tokenId)) return false;
    return g.allowedTerms[ILicenseToken(LICENSE_TOKEN).getLicenseTermsId(tokenId)];
}
```

## Acceptance criteria (BDD)

**Scenario: correct tier unlocks**
- **Given** a gate for ipId X allowing termsId = COMMERCIAL
- **And** caller owns a license token of (ipId X, COMMERCIAL, PIL template), not revoked
- **When** `checkReadCondition(uuid, abi.encode(tokenId), "0x", caller)`
- **Then** returns `true`.

**Scenario: wrong tier rejected**
- **Given** the same gate (allows only COMMERCIAL)
- **When** caller presents a PREVIEW-tier license token
- **Then** returns `false`.

**Scenario: not the owner / wrong IP / wrong template rejected**
- **Given** any of: `ownerOf(tokenId) != caller`, `getLicensorIpId != X`, `getLicenseTemplate != PIL`
- **When** checked → **Then** `false`.

**Scenario: revoked license rejected**
- **Given** a license token whose licensor IP was disputed (`isLicenseTokenRevoked == true`)
- **When** checked → **Then** `false`.

**Scenario: real tiered round-trip (fork)**
- **Given** an IP with two PIL terms (preview, commercial) attached, a vault gated to commercial-only on Aeneid
- **When** a wallet mints a commercial license then `accessCDR` with that tokenId in `accessAuxData`
- **Then** it recovers plaintext; a wallet holding only a preview license reverts on read.

## Constraints
Pure view, returns `false` on unconfigured uuid (never reverts). `setConfig` `onlyVault` (D8); addresses constructor-injected, not hardcoded. Decode `accessAuxData` defensively via a `this.`-external `try/catch` helper (`abi.decode` PANICS and can't be caught inline → bad input must deterministically return `false`, not bubble an opaque precompile revert). **Gate is point-in-time** (`ownerOf==caller` re-checked each access defeats transfer-away; a transfer during the ~7-min read doesn't help the new owner since plaintext already flows to the original qualified caller — document this). ≤400 lines. Unit + fork tests against real LicenseToken.
