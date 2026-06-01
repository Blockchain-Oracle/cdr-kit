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
        lede: <>CDR vaults route payloads by size: <code>≤ 1 KB</code> goes inline on-chain, larger payloads go off-chain with a CDR-secured key reference. The off-chain path needs a <code>CdrStorageProvider</code> — five ship in <code>@cdr-kit/core</code>, plus the SDK&apos;s own four (Helia / Storacha / Synapse / Gateway). All speak the same 2-method interface: <code>upload(bytes) → cid</code>, <code>download(cid) → bytes</code>.</>,
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
            id: "ecosystem",
            title: "Ecosystem adapters (planned)",
            content: (
              <p>S3-compat (R2, MinIO), Storacha-server (UCAN-backed pinning), and Helia (browser-side embedded IPFS) ship in 0.5 as separate optional dependencies. Pin <code>@peculiar/webcrypto: 1.7.0</code> in <code>pnpm.overrides</code> when using the Helia preset.</p>
            ),
          },
        ],
        prev: { href: "/docs/hooks/use-storage-backend", label: "useStorageBackend" },
        next: { href: "/docs/contracts", label: "Condition library" },
      }}
    />
  );
}
