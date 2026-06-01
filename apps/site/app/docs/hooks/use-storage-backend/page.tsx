import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useStorageBackend"],
        title: "useStorageBackend",
        badges: <><Badge tone="primary">hook</Badge><Badge>new in 0.5</Badge></>,
        lede: <>Config-driven <code>CdrStorageProvider</code> factory. A dashboard switches backends at runtime by passing a JSON config (Pinata / Supabase / IPFS / read-only gateway / in-memory).</>,
        importLine: 'import { useStorageBackend } from "@cdr-kit/react"',
        sections: [
          { id: "signature", title: "Signature", content: <CodePanel title="type" language="ts" code={`type StorageBackendConfig =
  | { kind: "memory" }
  | { kind: "pinata"; jwt: string; gatewayUrl?: string }
  | { kind: "supabase"; supabaseUrl: string; key: string; bucket: string;
      pathPrefix?: string; bucketIsPublic?: boolean }
  | { kind: "gateway"; gatewayUrl: string }
  | { kind: "ipfs"; addUrl: string; gatewayUrl: string;
      headers?: Record<string, string> };

function useStorageBackend(config: StorageBackendConfig | undefined): CdrStorageProvider | undefined;`} /> },
          { id: "memoization", title: "Memoization", content: <p>The provider instance is memoized on <code>config</code> identity. Pass a stable config object (typically from your environment variables, not a fresh literal every render).</p> },
        ],
        prev: { href: "/docs/hooks/use-escrow-state", label: "useEscrowState" },
        next: { href: "/docs/contracts", label: "Condition library" },
      }}
    />
  );
}
