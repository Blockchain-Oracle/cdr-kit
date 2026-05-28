# Story E1 — SubscriptionCondition

**As** a data owner, **I want** buyers to pay a recurring fee for time-boxed access that auto-expires **so that** I earn recurring revenue without billing infra. **As** a buyer, **I want** to subscribe/renew and have access lapse automatically.

Why net-new: demo's `FixedFeeCondition` is pay-once; Story has **no native per-token expiry** → we track `paidUntil` ourselves (`../../context/research/story-ip-royalty.md`). Pure-`view` gate + separate mutating `subscribe` (2-step, D5).

## Design
```solidity
// state keyed by uint32 uuid
struct Plan { address creator; uint256 pricePerPeriod; uint256 period; address payee; bool royaltyRouted; }
mapping(uint32 => Plan) plan;
mapping(uint32 => mapping(address => uint256)) paidUntil;

enum Mode { NativeIP, WipRoyalty }   // D12: one mode per plan, never both
// D14 canonical factory entrypoint: config = abi.encode(uint256 pricePerPeriod, uint256 period, address payee, uint8 mode, address licensorIpId)
function setConfigFromFactory(uint32 uuid, address creator, bytes calldata config) external; // onlyVault (D8); reverts AlreadyConfigured if creator[uuid]!=0 (D13); decodes config into the typed plan; if WipRoyalty, checks isWhitelistedRoyaltyToken here
function subscribe(uint32 uuid, uint256 periods, uint256 maxPricePerPeriod) external payable; // nonReentrant; slippage guard; cap periods
function renew(uint32 uuid, uint256 periods, uint256 maxPricePerPeriod) external payable;     // paidUntil += periods*period from max(now, current)
function checkReadCondition(uint32 uuid, bytes, bytes, address caller) external view returns (bool) {
    return paidUntil[uuid][caller] > block.timestamp;
}
```

## Acceptance criteria (BDD)

**Scenario: subscribe grants access for the paid window**
- **Given** a vault registered with pricePerPeriod=P, period=30 days
- **When** a buyer calls `subscribe(uuid, 1)` with `msg.value ≥ P`
- **Then** `paidUntil[uuid][buyer] == block.timestamp + 30 days` **and** `checkReadCondition(uuid, "0x", "0x", buyer) == true`.

**Scenario: access lapses after expiry**
- **Given** a subscription that has passed its `paidUntil`
- **When** `checkReadCondition` is called for that buyer
- **Then** it returns `false` (and a fork `read` reverts).

**Scenario: renew extends from the later of now/current expiry**
- **Given** an active subscription
- **When** `renew(uuid, 1)` is called
- **Then** `paidUntil` increases by one period from `max(now, currentExpiry)` (no lost time, no stacking-from-past).

**Scenario: underpayment reverts; excess refunded**
- **Given** pricePerPeriod=P
- **When** `subscribe(uuid, 2)` is called with `msg.value < 2P` → **Then** revert `InsufficientPayment`; with `msg.value > 2P` → **Then** excess refunded via checked `call`.

**Scenario: royalty-routed payment (Story coupling)**
- **Given** a plan with `royaltyRouted=true` and a licensor ipId
- **When** a buyer subscribes
- **Then** payment is routed via `RoyaltyModule.payRoyaltyOnBehalf` (WIP), claimable by the IP owner from its royalty vault.

**Scenario: real round-trip (fork)**
- **Given** a CDR vault using SubscriptionCondition as read condition on Aeneid
- **When** buyer subscribes then `accessCDR`
- **Then** the buyer recovers the plaintext; an unsubscribed wallet's read reverts.

**Scenario: price-change cannot grief a buyer (slippage guard)**
- **Given** a buyer submits `subscribe(uuid, 1, maxPricePerPeriod)`
- **When** the creator front-runs by raising `pricePerPeriod` above `maxPricePerPeriod`
- **Then** the buyer's tx reverts `PriceExceedsMax` (no surprise overcharge). Existing subs are unaffected (the gate only reads `paidUntil`).

**Scenario: only the factory can configure (D8)**
- **Given** a freshly allocated uuid
- **When** any non-factory address calls `setConfig` → **Then** revert `NotVault`. **When** the `view` is checked on an unconfigured uuid → **Then** returns `false` (never reverts).

## Constraints
View never mutates/pays and returns `false` on unconfigured uuid. `setConfig` is `onlyVault` (D8). `subscribe`/`renew`: `nonReentrant` + strict CEI (set `paidUntil` BEFORE any external call; refund last); cap `periods`; WIP path = `safeTransferFrom` + `forceApprove(RoyaltyModule)`, check `isWhitelistedRoyaltyToken` at `setConfig`. ≤400 lines. Unit + fork tests.
