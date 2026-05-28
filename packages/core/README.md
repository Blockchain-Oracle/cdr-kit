# @cdr-kit/core

Typed TypeScript SDK for **Story Protocol's Confidential Data Rails (CDR)**: condition encoders, the `CdrKitVault` flow, and the two-step *pay → access* helpers. Typed error taxonomy + a discriminated read status.

```bash
npm install @cdr-kit/core
```

## Mock mode (no wallet, no chain — tests & demos)

```ts
import { createMockCdrKit } from "@cdr-kit/core";

const kit = createMockCdrKit({ threshold: 4, readDelayMs: 800 });
const { uuid } = await kit.createVault({ data: new TextEncoder().encode("secret") });
const bytes = await kit.accessVault({ uuid, onProgress: (p) => console.log(p.collected, "/", p.threshold) });
```

## Live (Aeneid testnet)

```ts
import { createCdrKitClient, createVault, accessVault, encodeSubscriptionConfig } from "@cdr-kit/core";

const client = createCdrKitClient({ privateKey: process.env.PRIVATE_KEY, apiUrl: process.env.STORY_API_URL });

const readConfig = encodeSubscriptionConfig({ token, recipient, pricePerPeriod, periodLength });
const txHash = await createVault(client, { vault, readConditionAddr, readConfig });
const bytes = await accessVault(client, { uuid });
```

- **Encoders:** `encodeSubscriptionConfig`, `encodeTierGateConfig`/`encodeTierGateAux`, `encodeComposableConfig`/`encodeComposableAux` — all Zod-validated (reject bad period/price/address).
- **Flow:** `createVault`, `writeVaultData`, `accessVault`, `subscribeAndAccess`.
- **Errors / status:** `CdrError` + `CdrErrors` factory; `matchCdrStatus` over the `idle | connecting | paying | collecting-partials | ready | error | empty` union.

> Testnet only. CDR reads have ~15s latency (worst case minutes) and an ~1KB inline cap — large payloads go through the file path.
