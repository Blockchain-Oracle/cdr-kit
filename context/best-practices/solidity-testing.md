# Solidity + Bindings + Testing

## Toolchain: Foundry (+ wagmi CLI bindings)
- **Foundry** for a new protocol (Rust-fast, Solidity-native tests, audit standard). ⚠️ Hardhat 3 (Rust core, native Solidity tests) closed the gap but Foundry still wins here. Foundry-only keeps it simple (avoid the Foundry-test + Hardhat-deploy hybrid).
- Pragma `0.8.26` to match CDR demo + Story core.
- OpenZeppelin for ERC721/ERC721Enumerable (CDRVaultNFT uses these), MerkleProof, etc.

## Bindings: ⚠️ @wagmi/cli (typechain is legacy for viem stacks)
Generate typed bindings + React hooks from Foundry artifacts into `packages/contracts`:
```ts
// wagmi.config.ts
import { defineConfig } from '@wagmi/cli'
import { foundry, react } from '@wagmi/cli/plugins'
export default defineConfig({
  out: 'packages/contracts/src/generated.ts',
  plugins: [
    foundry({
      project: './contracts',
      include: ['*Condition.sol/**','CdrKitVault.sol/**'],
      deployments: { /* ConditionName: { 1315: '0x...' } */ },
      forge: { build: true, clean: true },
    }),
    react(),   // emits useRead*/useWrite* hooks consumed by @cdr-kit/react
  ],
})
```

## Condition-contract rules (from reading the real ones)
- Implement the **4-param uuid-first** interface (see `../research/cdr-protocol-truth.md`): `checkRead/WriteCondition(uint32 uuid, bytes accessAuxData, bytes conditionData, address caller) view returns (bool)`. **Re-verify on-chain before deploy** (docs show the wrong 3-param shape).
- Conditions are **pure `view`** → no payment, no state writes, no events. Anything stateful (subscribe/pay/revoke/heartbeat) is a SEPARATE mutating function on the same contract; the `view` only reads the result. (2-step pattern — `../research/story-ip-royalty.md`.)
- Per-vault state keyed by `uint32 uuid` (the CDR vault id), e.g. `mapping(uint32 => Config)`. Register with the uuid returned by `CDR.allocate`.
- `conditionData` = static config at allocate; `accessAuxData` = dynamic per call (tokenId, Merkle proof, signatures). Decode defensively.
- Custom-errors over `require` strings (gas + the demo's style). Idempotent registration guards (`AlreadyRegistered`).
- For payable patterns (FixedFee-style): pull-payment / `withdraw()` over push; check-effects-interactions; refund excess via low-level `call` with success check.
- Reentrancy: `view` conditions are safe; the mutating pay/withdraw functions need CEI and/or `nonReentrant` (Story's RoyaltyModule itself is `nonReentrant`).

## Testing
- **Foundry**: `contracts/test/*.t.sol` co-located; `forge test`; fuzz via `testFuzz_*`; invariants in `test/invariant/`. **Fork-test against Aeneid** (`forge test --fork-url $AENEID_RPC`) to validate against the REAL CDR precompile + Story core + the true condition interface — this is how we catch the 3-param/4-param issue early.
- Reference demo tests to mirror: `WhitelistCondition.t.sol`, `DeadManSwitchCondition.t.sol` (vendored).
- Coverage target: every condition contract gets unit + a fork test proving a real `CDR.allocate` → `write` → `read` round-trip succeeds/reverts as expected.

## TS testing
- **Vitest** (not Jest): co-located `*.test.ts`, `vitest --coverage` (v8). For `@cdr-kit/react`: `@testing-library/react` + happy-dom; mock viem transports, don't hit live RPC in unit tests (reserve live RPC for a small e2e suite given the ~7-min read latency — use long timeouts + a funded testnet wallet).
