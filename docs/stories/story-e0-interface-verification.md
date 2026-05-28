# Story E0 — Interface + round-trip verification (THE GATE)

**As** the cdr-kit team, **I need** to empirically confirm the real on-chain CDR condition interface and a full vault round-trip on Aeneid **so that** every contract we write targets the correct ABI (the official docs show a stale 3-param interface; the deployed demo uses 4-param uuid-first — getting this wrong means every tx reverts).

Blocks: all other epics. Detail: `../../context/research/cdr-protocol-truth.md`.

## Acceptance criteria (BDD)

**Scenario: confirm the condition interface selector**
- **Given** a trivial `OpenCondition` implementing the 4-param `checkRead/WriteCondition(uint32, bytes, bytes, address)`
- **When** it is deployed to Aeneid and used as a vault's read+write condition via `CDR.allocate`
- **Then** a subsequent `write` and `read` succeed (no revert), proving the precompile calls the 4-param selector.

**Scenario: the 3-param shape fails (negative control)**
- **Given** a condition implementing the docs' 3-param `checkReadCondition(address, bytes, bytes)`
- **When** used as a read condition and a read is attempted
- **Then** the read reverts — documenting that the docs interface is wrong, recorded in the test as the rationale.

**Scenario: full round-trip on a fork**
- **Given** a Foundry fork test against `--fork-url $AENEID_RPC`
- **When** the flow `allocate(updatable=false, writeCond, readCond, writeData, readData)` → `write(uuid, …)` → `read(uuid, …)` runs with a passing condition
- **Then** the round-trip completes and the decrypted value equals the input.

**Scenario: live addresses + fees verified** ✅ (done 2026-05-28)
- **Given** the candidate addresses
- **When** queried on Aeneid
- **Then** `allocateFee()` = 0; live `LICENSE_READ_CONDITION` = `0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3` (the cdr-demo `0xD429…` is NOT deployed); interface is 4-param (selector `0x8db3eb17` in dispatcher). These are written into `@cdr-kit/contracts` as the single source of truth (re-read `allocateFee` + registration fee at runtime). OQ1/OQ2 closed.

**Scenario: OQ6 — does allocate() preflight revert on a false/reverting condition? (make-or-break)**
- **Given** two dummy conditions deployed to Aeneid: one whose `checkRead/WriteCondition` returns `false`, one that reverts
- **When** `CDR.allocate(...)` is called with each as the condition
- **Then** record whether `allocate` succeeds or reverts in each case. If it reverts on a reverting/false condition, the **revert-safe-on-unconfigured-uuid invariant (D8) is mandatory** for every condition — capture the result in `decision-log.md` (close OQ6).

**Scenario: OQ7 — is there a vaultOwner(uuid) getter on the CDR precompile?**
- **Given** the CDR precompile at `0xCC…05`
- **When** we probe for an `allocator`/`vaultOwner(uint32)` view (ABI/bytecode scan + eth_call)
- **Then** record yes/no. If yes, the factory-less `setConfig` path can be made safe by gating on it; if no, factory-only config (D8) is the only safe path. Close OQ7.

**Scenario: factory-only configuration (negative control for D8)**
- **Given** a condition deployed with an immutable `factory` address and an `onlyVault setConfig`
- **When** an address that is NOT the factory calls `setConfig(uuid, …)`
- **Then** it reverts `NotVault`; and a condition `view` on an unconfigured uuid returns `false` (never reverts).

**Scenario: scaffold is enforced**
- **Given** the monorepo (pnpm + turbo + tsdown + foundry + ESLint flat `max-lines:400` + lefthook + CI matrix)
- **When** CI runs on a PR
- **Then** lint/typecheck/test/build + `forge test` all pass, and any file > 400 lines fails lint.

## Notes
If the on-chain interface differs from BOTH documented shapes, STOP and update `cdr-protocol-truth.md` + the `ICdrCondition` interface before proceeding. This story must close green before E1.
