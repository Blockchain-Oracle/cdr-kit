import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const PINATA_CODE = `import { createPinataStorage, uploadFile } from "@cdr-kit/core";

const storage = createPinataStorage({ jwt: process.env.PINATA_JWT! });
const { uuid, cid, txHashes } = await uploadFile(client, {
  content: fileBytes,
  storage,
  readConditionAddr,
  readConditionData,
});`;

const SUPABASE_CODE = `import { createSupabaseStorage } from "@cdr-kit/core";

const storage = createSupabaseStorage({
  supabaseUrl: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  bucket: "cdr-secrets",
  pathPrefix: "vaults/",       // optional, default "cdr/"
  bucketIsPublic: false,        // download uses /authenticated/ when private
});`;

const READ_ONLY_CODE = `import { createReadOnlyGatewayStorage, downloadFile } from "@cdr-kit/core";

// Buyer-side: read from any public IPFS gateway. Throws on upload() — by design.
const storage = createReadOnlyGatewayStorage({ gatewayUrl: "https://gateway.pinata.cloud" });
const { content } = await downloadFile(client, { uuid, storage });`;

const IPFS_CODE = `import { createIpfsStorage } from "@cdr-kit/core";

// Self-hosted Kubo, or any pinning service with a multipart POST + JSON CID response.
const storage = createIpfsStorage({
  addUrl: "http://kubo:5001/api/v0/add",
  gatewayUrl: "http://kubo:8080",
  headers: { Authorization: "Bearer ..." },
});`;

const MEMORY_CODE = `import { createMemoryStorage } from "@cdr-kit/core";

// Unit tests, CI, mocks. Content-addressed, returns a real CIDv1.
const storage = createMemoryStorage();`;

const S3_CODE = `import { createS3Storage } from "@cdr-kit/core";

// Works against AWS S3, Cloudflare R2, MinIO, or any S3-compatible store.
// Lazy-loads @aws-sdk/client-s3 via dynamic import — install it yourself.
const storage = await createS3Storage({
  bucket: "cdr-secrets",
  region: "auto",                                     // R2: "auto"; AWS: "us-east-1" etc.
  endpoint: "https://<acct>.r2.cloudflarestorage.com", // omit for AWS
  accessKeyId: process.env.S3_ACCESS_KEY_ID!,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  publicUrlBase: "https://<acct>.r2.dev/cdr-secrets",  // for browser-readable downloads
  prefix: "cdr/",
});`;

const STORACHA_CODE = `import { createStorachaStorage } from "@cdr-kit/core";

// Storacha-server (UCAN-backed pinning over @web3-storage/w3up-client).
// Install: pnpm add @web3-storage/w3up-client
const storage = await createStorachaStorage({
  key: process.env.STORACHA_KEY!,
  spaceDid: process.env.STORACHA_SPACE_DID!,
  proof: process.env.STORACHA_PROOF!,    // base64 UCAN delegation
  gatewayUrl: "https://w3s.link",         // optional, default w3s.link
});`;

const HELIA_CODE = `import { createHeliaStorage } from "@cdr-kit/core";

// Browser-side embedded IPFS via Helia — no remote pinner, the user is the node.
// Install: pnpm add helia @helia/unixfs
// Pin @peculiar/webcrypto: 1.7.0 in pnpm.overrides (Helia's wasm setup is fragile).
const storage = await createHeliaStorage({
  gatewayUrl: "https://ipfs.io",  // optional, only used by downloadFile if user is offline
});`;

const ROUTING_CODE = `import { shouldUseFile, getInlineLimit } from "@cdr-kit/core";

const limit = await getInlineLimit(client);   // reads CDR.maxEncryptedDataSize() once + caches
if (shouldUseFile(content, limit)) {
  await uploadFile(client, { content, storage, readConditionAddr, readConditionData });
} else {
  await writeVaultData(client, { uuid, dataKey: content });
}`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/core", "Storage adapters"],
        title: "Storage adapters",
        badges: <><Badge tone="primary">@cdr-kit/core</Badge><Badge>0.5</Badge></>,
        lede: <>CDR vaults route payloads by size: <code>≤ 1 KB</code> goes inline on-chain, larger payloads go off-chain with a CDR-secured key reference. The off-chain path needs a <code>CdrStorageProvider</code> — <b>8 ship in <code>@cdr-kit/core</code></b> (5 core + 3 ecosystem: S3-compat / Storacha / Helia). All speak the same 2-method interface: <code>upload(bytes) → cid</code>, <code>download(cid) → bytes</code>.</>,
        importLine: 'import { createPinataStorage, createSupabaseStorage, /* ... */ } from "@cdr-kit/core"',
        sections: [
          {
            id: "decision",
            title: "Pick the right adapter",
            content: (
              <ul>
                <li><b>Buyer-only / dashboards</b> → <code>createReadOnlyGatewayStorage</code> (no pin creds needed, throws on upload).</li>
                <li><b>Hosted IPFS pinning</b> → <code>createPinataStorage</code> (JWT, default Pinata gateway).</li>
                <li><b>Already-have-Supabase shops</b> → <code>createSupabaseStorage</code> (bucket + service-role key, bare REST — no <code>@supabase/supabase-js</code> dep).</li>
                <li><b>Self-hosted Kubo / custom pinner</b> → <code>createIpfsStorage</code> (multipart POST + JSON CID response).</li>
                <li><b>AWS S3 / R2 / MinIO</b> → <code>createS3Storage</code> (signed-URL downloads, lazy-loads <code>@aws-sdk/client-s3</code>).</li>
                <li><b>UCAN-backed pinning</b> → <code>createStorachaStorage</code> (peer-dep <code>@web3-storage/w3up-client</code>).</li>
                <li><b>Browser-embedded IPFS</b> → <code>createHeliaStorage</code> (peer-dep <code>helia</code>, user is the node).</li>
                <li><b>Tests / CI</b> → <code>createMemoryStorage</code> (content-addressed, real CIDv1).</li>
              </ul>
            ),
          },
          {
            id: "pinata",
            title: "createPinataStorage",
            content: <CodePanel title="ts" language="ts" code={PINATA_CODE} />,
          },
          {
            id: "supabase",
            title: "createSupabaseStorage",
            content: (
              <>
                <CodePanel title="ts" language="ts" code={SUPABASE_CODE} />
                <p>The &quot;CID&quot; is the bucket-relative path the object was uploaded to. Supabase doesn&apos;t speak IPFS, but <code>CdrStorageProvider</code> only requires a string round-trip handle.</p>
              </>
            ),
          },
          {
            id: "gateway",
            title: "createReadOnlyGatewayStorage",
            content: (
              <>
                <CodePanel title="ts" language="ts" code={READ_ONLY_CODE} />
                <p>For dashboards that consume but never produce. Pair with a seller using <code>createPinataStorage</code> (or any IPFS pinner) on the write side.</p>
              </>
            ),
          },
          {
            id: "ipfs",
            title: "createIpfsStorage",
            content: <CodePanel title="ts" language="ts" code={IPFS_CODE} />,
          },
          {
            id: "memory",
            title: "createMemoryStorage",
            content: <CodePanel title="ts" language="ts" code={MEMORY_CODE} />,
          },
          {
            id: "routing",
            title: "Inline cap + routing",
            content: (
              <>
                <p>CDR sizes payloads at write time. The hard cap comes from the on-chain <code>CDR.maxEncryptedDataSize()</code> (currently ≈ 1 KB after TDH2 overhead). <code>getInlineLimit(client)</code> reads it once + caches; <code>shouldUseFile(content, limit)</code> picks the routing.</p>
                <CodePanel title="ts" language="ts" code={ROUTING_CODE} />
              </>
            ),
          },
          {
            id: "s3",
            title: "createS3Storage",
            content: (
              <>
                <p>Works against AWS S3, Cloudflare R2, or any S3-compatible store. The SDK is loaded lazily via dynamic import so non-S3 deployments don&apos;t pay the bundle cost. Install <code>@aws-sdk/client-s3</code> yourself in your project.</p>
                <CodePanel title="ts" language="ts" code={S3_CODE} />
              </>
            ),
          },
          {
            id: "storacha",
            title: "createStorachaStorage",
            content: (
              <>
                <p>UCAN-backed pinning service. Lazy-loads <code>@web3-storage/w3up-client</code>; install it yourself. The agent address must be authorized for the Space via a base64 UCAN proof.</p>
                <CodePanel title="ts" language="ts" code={STORACHA_CODE} />
              </>
            ),
          },
          {
            id: "helia",
            title: "createHeliaStorage",
            content: (
              <>
                <p>Browser-side embedded IPFS. The user&apos;s tab IS the IPFS node — no remote pinner needed. Lazy-loads <code>helia</code> + <code>@helia/unixfs</code>. Pin <code>@peculiar/webcrypto: 1.7.0</code> in <code>pnpm.overrides</code> (Helia&apos;s WASM init is sensitive to webcrypto version drift).</p>
                <CodePanel title="ts" language="ts" code={HELIA_CODE} />
              </>
            ),
          },
        ],
        prev: { href: "/docs/hooks/use-storage-backend", label: "useStorageBackend" },
        next: { href: "/docs/contracts", label: "Condition library" },
      }}
    />
  );
}
