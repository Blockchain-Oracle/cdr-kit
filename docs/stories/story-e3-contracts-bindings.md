# Story E3 — @cdr-kit/contracts (typed bindings + address source of truth)

**As** an SDK/app developer, **I want** typed ABIs, addresses, and read/write hooks generated from the Foundry artifacts **so that** I never hand-write an ABI or hardcode an address, and the whole monorepo has one source of truth for what's deployed where.

## Design
- `@wagmi/cli` with the `foundry` + `react` plugins reads `contracts/out/**`, emits `packages/contracts/src/generated.ts` (ABIs + `useRead*/useWrite*` hooks).
- A hand-maintained `addresses.ts` (per chainId) holds the **verified** addresses; `generated.ts` `deployments` map references it. Aeneid (1315) seeds:
  - Story core: IPAssetRegistry `0x7731…244b`, LicensingModule `0x04fb…dE6f`, LicenseToken `0xFe38…C6bC`, PILicenseTemplate `0x2E89…d316`, RoyaltyModule `0xD2f6…0086`, WIP `0x1514…0000`.
  - CDR precompile `0xCC…05`; LICENSE_READ_CONDITION `0xC064…f7a3` (live; NOT `0xD429…`).
  - cdr-kit deployed addrs (CdrKitVault + conditions) filled after E1/E2 deploy.
- Pure TS package (no React runtime dep); `@cdr-kit/react` re-exports/wraps the generated hooks.

## Acceptance criteria (BDD)

**Scenario: bindings regenerate from artifacts**
- **Given** a change to a Solidity contract
- **When** `pnpm wagmi generate` runs (and in CI on contract change)
- **Then** `generated.ts` updates with the new ABI + hooks, typed end-to-end, no manual edits.

**Scenario: single address source of truth**
- **Given** any package needs a contract address
- **When** it imports from `@cdr-kit/contracts`
- **Then** it gets the verified address for the active chainId; no address is hardcoded anywhere else in the monorepo. CI greps for `0x[0-9a-fA-F]{40}` literals **with an allowlist** of `packages/contracts/src/addresses.ts`, the Foundry deploy script, and test fixtures (so the check is implementable, not a false-positive on the source of truth itself).

**Scenario: published cleanly**
- **Given** the package is published
- **When** `publint` + `attw --pack` run in CI
- **Then** both pass (correct `exports`, dual ESM/CJS types).

## Constraints
Generated file may exceed 400 lines — exempt `generated.ts` from `max-lines` (it's codegen) but keep hand-written files ≤400. ≤ the wagmi-cli version pinned. Addresses verified on-chain before publish.
