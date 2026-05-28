# Story E4 — SDK 2-step access flow + latency UX

**As** a developer, **I want** one SDK call that handles pay→wait→decrypt with progress **so that** I don't hand-roll the 2-step pattern or block my UI for ~7 minutes. (`view` can't pay → mutating tx then `view` reads result; reads take ~7 min — `../../context/research/`.)

## Design
```ts
// @cdr-kit/core
async subscribeAndAccess(uuid, { periods=1, onProgress }): Promise<Uint8Array> {
  onProgress?.({ step: 'paying' });
  const hash = await writeContract(subscriptionCondition, 'subscribe', [uuid, periods], { value });
  await waitForTransactionReceipt({ hash });
  onProgress?.({ step: 'collecting-partials' });
  const { dataKey } = await consumer.accessCDR({ uuid, accessAuxData, timeoutMs: 420_000,
                       onPartial: (n, total) => onProgress?.({ step:'collecting-partials', n, total }) });
  onProgress?.({ step: 'ready' });
  return dataKey;
}
async accessVault(uuid, { accessAuxData, onProgress }): Promise<Uint8Array>   // when already entitled
```

## Acceptance criteria (BDD)

**Scenario: happy path with progress**
- **Given** an entitled (or about-to-subscribe) wallet
- **When** `subscribeAndAccess(uuid)` runs
- **Then** `onProgress` fires `paying` → `collecting-partials` (with counts) → `ready`, and the returned bytes equal the original payload.

**Scenario: long latency tolerated**
- **Given** validator partials take several minutes
- **When** accessing
- **Then** the call uses a long timeout (≥ 420s) and does NOT throw prematurely; if it exceeds timeout it throws a typed `PartialCollectionTimeoutError` the caller can retry.

**Scenario: condition not satisfied**
- **Given** a wallet that hasn't paid
- **When** `accessVault(uuid)` is called
- **Then** it surfaces a typed `ConditionNotSatisfiedError` (not a raw revert), so UIs can prompt to subscribe.

**Scenario: large payload auto-routes to file**
- **Given** a payload > 1KB
- **When** uploaded via the SDK
- **Then** it uses `uploadFile` (AES body to IPFS, key under CDR) transparently; download reverses it.

**Scenario: WASM lifecycle**
- **Given** `initWasm()` has not run
- **When** any encrypt/decrypt is attempted
- **Then** the SDK calls `initWasm` lazily (or throws a clear "provider not initialized" error in React), never an opaque WASM error.

## Constraints
No edge runtime. Typed errors re-exported. Vitest with mocked viem transport for unit; a single gated live e2e (long timeout, funded Aeneid wallet). ≤400 lines/file.
