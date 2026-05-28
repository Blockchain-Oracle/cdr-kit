# Story E2 — CdrKitVault factory (the security keystone)

**As** a vault creator, **I want** one transaction that creates a CDR vault, registers it as a Story IP asset, attaches license terms, and configures my chosen condition **so that** there is no front-running window and the UX is one click. This contract is what makes `register()` safe (D8) — it is the trusted `onlyVault` configurer for every condition.

Generalizes the demo's `CDRVaultNFT` (vendored at `../../context/reference/vendored/cdr-demo-contracts/CDRVaultNFT.sol:163-200`): pluggable condition + configurable PIL terms instead of hardcoded license-read + default non-commercial term.

## Design
```solidity
ICdrCondition public immutable WRITE_CONDITION;   // fixed creator-only write gate (D15); not pluggable in MVP

function createVault(
    address readConditionAddr,                                // a deployed cdr-kit condition
    bytes calldata readConfig,                                // D14 abi-encoded layout for that condition
    address[] calldata childConditions,                       // empty unless readCondition is Composable
    bytes[] calldata childConfigs,                            // per-child D14 configs (same length)
    uint256 licenseTermsId                                    // 0 = default
) external payable returns (uint256 tokenId, uint32 uuid, address ipId);
//  1 mint ERC721 to this contract (stays IP owner)
//  2 ipId = IPAssetRegistry.register(chainid, this, tokenId)
//  3 uuid = CDR.allocate{value: msg.value}(false, address(WRITE_CONDITION), readConditionAddr, "", "")
//      (preflight staticcalls the conditions for an UNCONFIGURED uuid → both MUST return false, not revert — D8)
//  4 WRITE_CONDITION.setConfigFromFactory(uuid, msg.sender, "")
//  5 if childConditions.length > 0: for each, ICdrConfigurable(child).setConfigFromFactory(uuid, msg.sender, childConfigs[i])  // children FIRST (D14)
//  6 ICdrConfigurable(readConditionAddr).setConfigFromFactory(uuid, msg.sender, readConfig)   // atomic, onlyVault, AlreadyConfigured (D13)
//  7 LicensingModule.attachLicenseTerms(ipId, PIL_TEMPLATE, termsId)
//  8 store tokenId↔uuid↔ipId↔creator↔termsId; emit VaultCreated(tokenId, uuid, ipId, creator, termsId)

function mintLicenseTokens(uint256 tokenId, uint256 amount, address receiver) external returns (uint256 startId); // onlyCreator
function getCreatorVaults(address) external view returns (uint256[]);
function getVaultInfo(uint256 tokenId) external view returns (uint32 uuid, address ipId, address creator, uint256 termsId);
function vaultToToken(uint32 uuid) external view returns (uint256);
```
Each condition implements `setConfigFromFactory(uint32 uuid, address creator, bytes config)` guarded by `onlyVault` (immutable factory addr passed to its constructor); it records `creator` from the arg (never from `config`, D14) and decodes the rest of `config` into its own params.

### CreatorWriteCondition (D15 — the fixed MVP write gate)
A minimal `ICdrConfigurable` write condition the factory deploys/owns; generalizes the demo's `VaultWriteCondition` but is NOT a free-overwrite `setCreator`. `config == ""` (creator from the arg). Subject to the **identical layer-1 rules** as read conditions: `onlyVault`, `AlreadyConfigured(creator[uuid]!=0)`, and `checkWriteCondition` returns `false` on an unconfigured uuid (never reverts). `checkWriteCondition(uuid, …, caller) == (caller == creator[uuid])`. `checkReadCondition` returns `false` (write-only). MVP has no per-uuid write story beyond this; pluggable writes = Phase 2.

## Acceptance criteria (BDD)

**Scenario: one-tx vault creation**
- **Given** a chosen condition + PIL terms id
- **When** `createVault(...)` is called with `msg.value == CDR.allocateFee()` (currently 0)
- **Then** an NFT is minted, the IP is registered (`ipId` returned), the CDR vault is allocated (`uuid` returned), the condition is configured for that uuid, license terms are attached, and `VaultCreated` is emitted (so `discover()` can index it).

**Scenario: no front-running window (the D8/D13 guarantee)**
- **Given** the vault is created
- **When** an attacker tries to `setConfigFromFactory(uuid, …)` directly (not via the factory)
- **Then** it reverts `NotVault`. **And** a second `setConfigFromFactory` for an already-configured uuid reverts `AlreadyConfigured` (single-write, D13). **And** if OQ7 confirms a `vaultOwner(uuid)` getter, the condition also asserts `CDR.vaultOwner(uuid)==msg.sender` so a *rogue* factory cannot configure a uuid it didn't allocate.

**Scenario: uuid is unconfigured during allocate's preflight**
- **Given** `createVault` calls `CDR.allocate` BEFORE `setConfigFromFactory` (the uuid doesn't exist until allocate returns)
- **When** allocate's preflight staticcalls `checkRead/WriteCondition` on the not-yet-configured uuid
- **Then** both return `false` (never revert) so `allocate` succeeds; the uuid becomes configured only after `setConfigFromFactory` later in the SAME tx — verified by fork test.

**Scenario: allocate fee is read at runtime**
- **Given** `CDR.allocateFee()` may be nonzero on a future deployment
- **When** the dashboard prepares `createVault`
- **Then** it reads `getAllocateFee()` and sends exactly that as `msg.value`; underpayment reverts.

**Scenario: tiered license minting**
- **Given** a vault whose IP has commercial PIL terms attached
- **When** the creator calls `mintLicenseTokens(tokenId, 1, buyer)`
- **Then** a license token of that tier is minted to the buyer (usable with `TierGateCondition`), and minting fees route through Story's RoyaltyModule.

**Scenario: factory-less path is discouraged, not silently unsafe**
- **Given** a power user bypasses the factory (architecture §4 Option B)
- **When** they self-`setConfig`
- **Then** either it's gated on a verified `vaultOwner(uuid)` (if OQ7 confirms the getter exists) or the SDK marks the path "trust-on-first-use, front-runnable" and steers them to the factory.

## Constraints
Holds NFTs to remain IP owner (demo pattern). Addresses constructor-injected from `@cdr-kit/contracts`. CEI; `nonReentrant` on `createVault` (external calls to CDR + Story). ≤400 lines. Foundry unit + Aeneid fork test of the full createVault→subscribe→accessCDR round-trip.
