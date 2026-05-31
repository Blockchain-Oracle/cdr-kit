import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useVault"],
        title: "useVault",
        badges: <Badge tone="primary">hook</Badge>,
        lede: <>Resolve a vault&apos;s on-chain metadata from its <code>uuid</code> via the <code>CdrKitVault</code> factory (token id, IP id, creator, license terms id).</>,
        importLine: 'import { useVault } from "@cdr-kit/react"',
        sections: [{ id: "signature", title: "Signature", content: <CodePanel title="type" language="ts" code={`function useVault(uuid: number): {
  tokenId?: bigint;
  info?: { /* factory getVaultInfo struct */ };
  isLoading: boolean;
  error?: Error;
};`} /> }],
        prev: { href: "/docs/hooks/use-discover-vaults", label: "useDiscoverVaults" },
        next: { href: "/docs/hooks/use-vault-events", label: "useVaultEvents" },
      }}
    />
  );
}
