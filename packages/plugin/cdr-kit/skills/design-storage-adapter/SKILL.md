---
name: design-storage-adapter
description: Pick the right cdr-kit storage backend for a CDR file vault (Pinata / Supabase / IPFS-Kubo / read-only gateway / Helia / Storacha / Synapse). Use this skill whenever the user mentions storage, IPFS, pinning, Pinata, Supabase, S3, R2, web3.storage, Storacha, Helia, gateways, or asks "where does the file body go" / "how does cdr-kit store the encrypted payload" / "how do I upload a >1KB file to a CDR vault".
license: MIT
---

# Design a cdr-kit storage adapter

CDR vaults route payloads by size: **≤ ~1KB → inline on-chain**, **> ~1KB → off-chain body + CDR-secured key reference**. The off-chain path needs a storage backend that implements `CdrStorageProvider { upload(bytes) → cid; download(cid) → bytes }`. This skill picks the right one.

## When to use

- "Which storage should I use for my CDR vault?"
- "How do I wire Pinata / Supabase / R2 / web3.storage / Helia to cdr-kit?"
- "Why is my upload failing — wrong storage shape?"
- "How big is the inline cap?"
- "Can I read a CDR file vault without pinning credentials?"
- "Buyer-side dashboard — what storage should we configure?"

## The 6 official adapters

All ship from `@cdr-kit/core` (`createMemoryStorage`, `createIpfsStorage`, `createPinataStorage`, `createSupabaseStorage`, `createReadOnlyGatewayStorage`) — the 3 SDK-heavy ones (Helia browser preset, S3-compat, Storacha-server) ship as separate `@cdr-kit-ecosystem/*` packages once available.

| Adapter | Use when | Backend | Auth | Notes |
|---|---|---|---|---|
| `createMemoryStorage` | Unit tests, CI, mocks | In-process Map | none | Content-addressed; returns real CIDv1; no network |
| `createIpfsStorage` | Self-hosted Kubo, custom pinner | Any IPFS HTTP API + gateway | Bearer/JWT in `headers` | Generic; parses CID from `Hash` / `cid` / `IpfsHash` keys |
| `createPinataStorage` | Indie / hosted pinning | Pinata pinning + gateway | JWT (Pinata key) | Convenience wrapper over `createIpfsStorage` |
| `createSupabaseStorage` | Already-have-Supabase shops | Supabase Storage bucket | service-role or anon key | Path-in-bucket as the "cid"; bare REST (no `@supabase/supabase-js` dep) |
| `createReadOnlyGatewayStorage` | Buyer dashboards, no upload | Any IPFS gateway | none | Throws on `upload()`; for read-only consumers |
| Helia (browser preset) | Browser-side dogfooded IPFS | Embedded Helia node | none | Requires `@peculiar/webcrypto: 1.7.0` pnpm override |
| Storacha-server | UCAN-backed pinning | `@storacha/client` | UCAN delegation env vars | Public IPFS, robust |
| S3-compat (R2 / S3 / MinIO) | Enterprise / private | `@aws-sdk/client-s3` | IAM keys | Browser uploads need server-side signed URLs |

## Pick by use case (decision tree)

1. **Buying — read only?** → `createReadOnlyGatewayStorage` (any public gateway: `ipfs.io`, `cf-ipfs.com`, `w3s.link`).
2. **Selling — fastest path to hosted IPFS?** → `createPinataStorage` (get a JWT at `app.pinata.cloud/keys`, takes 2 min).
3. **Selling — already have Supabase?** → `createSupabaseStorage`. Bucket must exist; RLS rules apply per your service-role vs anon key.
4. **Self-host IPFS node?** → `createIpfsStorage({ addUrl: 'http://kubo:5001/api/v0/add', gatewayUrl: 'http://kubo:8080', headers })`.
5. **Enterprise / private (S3, R2)** → `@cdr-kit-ecosystem/storage-s3` (planned). Until then, write a 60-LOC adapter implementing `CdrStorageProvider` directly.
6. **Tests / CI?** → `createMemoryStorage`.

## Wiring examples

### Pinata (creator side)
```ts
import { createPinataStorage, uploadFile } from "@cdr-kit/core";
const storage = createPinataStorage({ jwt: process.env.PINATA_JWT! });
await uploadFile(client, { content, storage, readConditionAddr, readConditionData });
```

### Supabase (creator side)
```ts
import { createSupabaseStorage } from "@cdr-kit/core";
const storage = createSupabaseStorage({
  supabaseUrl: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  bucket: "cdr-secrets",
  pathPrefix: "vaults/", // optional, default "cdr/"
});
```

### Read-only gateway (buyer side)
```ts
import { createReadOnlyGatewayStorage, downloadFile } from "@cdr-kit/core";
const storage = createReadOnlyGatewayStorage({ gatewayUrl: "https://gateway.pinata.cloud" });
const { content } = await downloadFile(client, { uuid, storage });
```

## The inline cap

The 1KB cap is the documented practical limit. For the on-chain truth, call `getInlineLimit(client)` (added in 0.5.0) — it reads `CDR.maxEncryptedDataSize()` and caches the result. Below the cap → inline (`writeVaultData`); above → file path (`uploadFile`). Routing helper:

```ts
import { shouldUseFile, getInlineLimit } from "@cdr-kit/core";
const limit = await getInlineLimit(client);
const useFile = shouldUseFile(content, limit);
```

## Common failure modes

- **Pinata upload returns no CID.** Check the JWT scope — needs pinning permissions, not just admin read.
- **Supabase 403.** Bucket RLS doesn't grant the anon key write access — use the service-role key, or update RLS.
- **Browser CORS on download.** Public IPFS gateways often block direct browser requests; proxy through a server route OR use Pinata's dedicated subdomain gateway.
- **CID changes between upload and download.** The storage adapter returned a path-as-CID (Supabase, custom) but a buyer is trying an IPFS gateway URL. Use the SAME adapter on both sides.
- **`download` returns "cannot upload" on the consumer side.** The buyer wired `createReadOnlyGatewayStorage` then accidentally called `uploadFile` — wire `createPinataStorage` for write paths instead.

## Don't

- Don't write a fresh adapter when one of the 6 already fits — `CdrStorageProvider` is a 2-method interface; the existing adapters cover ~95% of cases.
- Don't put pinning JWTs in browser-shipped code. Route through a server proxy. The JWT can drain your Pinata account.
- Don't use `createMemoryStorage` in production — it's process-local and resets on restart.
