# Story E6 — Autonomous agent access (the demo money-shot)

**As** an AI agent with my own wallet, **I want** to discover a vault, decide to pay, subscribe, pull the data, and use it downstream — with no human in the loop **so that** cdr-kit proves agent-native confidential data exchange (core to the Application-track demo).

## Design
```ts
// @cdr-kit/agent
class CdrAgent {
  constructor(cfg: { privateKey, rpcUrl, apiUrl })   // own wallet
  discover(query?): Promise<VaultInfo[]>             // from CdrKitVault VaultCreated events / registry
  subscribe(uuid, opts?): Promise<void>              // 2-step via @cdr-kit/core
  access(uuid, accessAuxData?): Promise<Uint8Array>  // returns plaintext
  isActive(uuid): Promise<boolean>
}
```

## Acceptance criteria (BDD)

**Scenario: end-to-end autonomous flow**
- **Given** a funded agent wallet and a vault published on Aeneid
- **When** the agent runs `discover()` → picks a vault → `subscribe(uuid)` → `access(uuid)`
- **Then** it obtains the plaintext data **with zero human interaction**, and the on-chain payment is attributable to the agent's wallet.

**Scenario: agent uses the data downstream**
- **Given** the agent has accessed a dataset (e.g. JSON facts)
- **When** it completes a downstream task (e.g. answers a query / makes a decision using that data)
- **Then** the demo shows the task output depended on the vaulted data (proving real utility, not just a fetch).

**Scenario: respects entitlement**
- **Given** an agent that has not subscribed
- **When** it calls `access(uuid)`
- **Then** it receives `ConditionNotSatisfiedError`, then `subscribe()`, then succeeds — demonstrating the gate works.

**Scenario: latency handled headless**
- **Given** the ~7-min read
- **When** the agent accesses
- **Then** it awaits with a long timeout + logs progress; no premature failure.

## Demo deliverable
A recorded run (terminal log + minimal UI): agent discovers → subscribes (tx on Aeneid explorer) → waits → receives data → produces a downstream result. This clip is the Application-track centerpiece. Keep a fallback pre-recorded version given the 7-min latency.

## Constraints
Built on `@cdr-kit/core` (no logic duplication). Agent never needs the dashboard. ≤400 lines/file.
