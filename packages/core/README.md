<p align="center">
  <a href="https://cdrkit.xyz">
    <img src="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/icon.svg" alt="cdr-kit" width="80">
  </a>
</p>

# @cdr-kit/core

> Typed TypeScript SDK for Story CDR — condition encoders, the `CdrKitVault` flow, file storage adapters, error taxonomy + status union, mock kit.

This is the package every other cdr-kit package consumes. Everything is tree-shakable, every external integration is a lazy-loaded peer (Vite/Rollup-safe via `new Function("s", "return import(s)")`).

---

## Install

```bash
pnpm add @cdr-kit/core viem
```

---

## Mock mode (zero wallet, zero chain — tests + demos + docs)

```ts
import { createMockCdrKit } from "@cdr-kit/core";

const kit = createMockCdrKit({ threshold: 5, readDelayMs: 2400 });
const { uuid } = await kit.createVault({ data: new TextEncoder().encode("secret") });
const bytes = await kit.accessVault({
  uuid,
  onProgress: (p) => console.log(p.collected, "/", p.threshold),
});
```

Same status machine, same progress events as the live client. Used internally by cdrkit.xyz's docs demos.

---

## Live (Aeneid testnet)

```ts
import { createCdrKitClient, createVault, accessVault } from "@cdr-kit/core";
import { aeneid } from "@cdr-kit/contracts";

const client = createCdrKitClient({
  privateKey: process.env.WALLET_PRIVATE_KEY as `0x${string}`,
  rpcUrl: "https://aeneid.storyrpc.io",
});

const txHash = await createVault(client, {
  readConditionAddr: aeneid.openCondition,
  readConfig: "0x",
  valueWei: 0n,
});
// ... read uuid from VaultCreated event, then:
const bytes = await accessVault(client, { uuid });
```

---

## File storage adapters

Six production-ready adapters + 2 utility:

```ts
import {
  createPinataStorage,
  createSupabaseStorage,
  createIpfsStorage,
  createS3Storage,
  createStorachaStorage,
  createHeliaStorage,
  createMemoryStorage,
  createReadOnlyGatewayStorage,
  uploadFile,
  downloadFile,
} from "@cdr-kit/core";

// upload a >1KB payload (IPFS + CDR vault, single helper)
const { uuid, cid } = await uploadFile(client, {
  content: bytes,
  storage: createSupabaseStorage({ supabaseUrl, key, bucket: "cdr" }),
  readConditionAddr: aeneid.openCondition,
});

// read it back — pass skipCidVerification:true for non-IPFS storage handles
const { content } = await downloadFile(client, {
  uuid,
  storage,
  skipCidVerification: true,  // required for Supabase paths, S3 keys, …
});
```

> **0.7.1 note:** `downloadFile` accepts `skipCidVerification?: boolean`. Pass `true` for Supabase / S3 / any non-IPFS handle — the SDK's default multibase CID check throws on arbitrary path strings.

---

## Condition encoders

All Zod-validated — bad period / price / address inputs reject before tx:

```ts
import {
  encodeSubscriptionConfig,
  encodeTierGateConfig,
  encodeTierGateAux,
  encodeComposableConfig,
  encodeComposableAux,
  encodeTimeWindowConfig,
  encodeDeadManConfig,
  encodeEscrowConfig,
  encodeMultiSigConfig,
} from "@cdr-kit/core";
```

---

## Errors + status

- `CdrError` + `CdrErrors` factory — typed error class with discriminated `code` + cause chain
- `matchCdrStatus(status, handlers)` — exhaustive switch over `idle | connecting | paying | collecting-partials | ready | error | empty`

---

## Peer dependencies

- `viem` ≥ 2.21
- `@cdr-kit/contracts` ≥ 0.7.0
- `@piplabs/cdr-sdk` (vendored transitive)
- Optional: `@aws-sdk/client-s3`, `@storacha/client`, `helia` + `@helia/unixfs` — only if you use the corresponding adapter

---

## Links

- Full docs: <https://cdrkit.xyz/docs>
- npm: <https://www.npmjs.com/package/@cdr-kit/core>
- GitHub: <https://github.com/Blockchain-Oracle/cdr-kit>
- Story Protocol: <https://www.story.foundation>
