# Story E1 — ComposableCondition (composability)

**As** a vault creator, **I want** to combine conditions with AND/OR (e.g. "hold a commercial license AND it's before the embargo lifts", or "subscribed OR on the allowlist") **so that** I express real policies. Hits the Technical-track criterion "composable vault systems interacting with other contracts" verbatim.

## Design
```solidity
enum Mode { AND, OR }
struct Combo { Mode mode; address[] children; }   // NO childData — children store their own per-uuid state (R3 fix)
mapping(uint32 => Combo) combo;

// D14 canonical entrypoint: parent config = abi.encode(uint8 mode, address[] children)
// childConfigs are NOT stored here — they are a separate CdrKitVault.createVault param; the FACTORY configures each child
// for this uuid FIRST (child.setConfigFromFactory(uuid, creator, childConfigs[i])), THEN this parent. Stateful children
// (Subscription/TierGate) read their OWN uuid state and ignore conditionData → so the parent passes "" as conditionData.
function setConfigFromFactory(uint32 uuid, address creator, bytes calldata config) external; // onlyVault (D8); AlreadyConfigured (D13); records creator from the ARG (not config); require children.length <= MAX_CHILDREN (8), reject any child whose code == this (no Composable-of-Composable in v1)

function checkReadCondition(uint32 uuid, bytes calldata accessAuxData, bytes, address caller) external view returns (bool) {
    Combo storage c = combo[uuid];
    if (c.children.length == 0) return false;                 // unconfigured uuid → false, never revert
    bytes[] memory auxPerChild;
    try this.decodeAux(accessAuxData, c.children.length) returns (bytes[] memory a) { auxPerChild = a; }
    catch { return false; }                                   // malformed aux → false (abi.decode panics; must be caught externally)
    for (uint i; i < c.children.length; i++) {
        bool ok;
        try ICdrCondition(c.children[i]).checkReadCondition(uuid, auxPerChild[i], "", caller) returns (bool r) { ok = r; }
        catch { ok = false; }                                 // a reverting/non-conforming child = false, don't abort the whole eval
        if (c.mode == Mode.OR && ok) return true;
        if (c.mode == Mode.AND && !ok) return false;
    }
    return c.mode == Mode.AND;   // AND: all passed; OR: none passed
}
```

## Acceptance criteria (BDD)

**Scenario: AND requires all children**
- **Given** a combo AND[ TierGate(commercial), TimeLock(before T) ]
- **When** caller holds commercial license **and** now < T → **Then** `true`; if either fails → **Then** `false`.

**Scenario: OR requires any child**
- **Given** a combo OR[ Subscription, Revocable(allowlist) ]
- **When** caller is subscribed **or** allowlisted → **Then** `true`; when neither → **Then** `false`.

**Scenario: per-child accessAuxData routed correctly**
- **Given** children needing different aux (TierGate needs tokenId, MultiSig needs sigs)
- **When** caller passes `abi.encode(bytes[])` aligned to child order
- **Then** each child receives its own aux slice; mismatched length reverts/returns false safely.

**Scenario: nested composition**
- **Given** a child that is itself a ComposableCondition
- **When** evaluated → **Then** it recurses correctly (bounded depth; document gas + a max-children cap to avoid DoS).

**Scenario: real round-trip (fork)**
- **Given** a vault using ComposableCondition AND[TierGate, TimeLock] on Aeneid
- **When** a qualifying wallet accesses within the window → **Then** plaintext recovered; outside window or wrong tier → read reverts.

## Constraints
Pure view; `try/catch` staticcall children (no state; failed child = `false`). `setConfig` `onlyVault` (D8). **Cap `children.length ≤ 8` AND ban Composable-of-Composable in v1** (depth bomb): reject any child whose runtime code matches this contract at `setConfig`. Children must be pre-configured for the same uuid (re-states D8 per child). Defensive decode via external `try/catch` helper. Returns `false` on unconfigured uuid. ≤400 lines. Unit + fork tests.

> Note: the `nested composition` scenario above is deferred to Phase 2 — v1 bans Composable-of-Composable to bound gas. Keep the scenario as a Phase-2 target.
