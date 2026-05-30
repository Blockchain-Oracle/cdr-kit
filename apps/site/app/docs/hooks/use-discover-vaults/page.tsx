import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useDiscoverVaults"],
        title: "useDiscoverVaults",
        badges: <Badge tone="primary">hook</Badge>,
        lede: <>One-shot historical scan of the factory&apos;s <code>VaultCreated</code> events. Paginates inside a bounded RPC window. For live feeds, pair with <code>useVaultEvents</code>.</>,
        importLine: 'import { useDiscoverVaults } from "@cdr-kit/react"',
        sections: [{ id: "signature", title: "Signature", content: <div className="win doc-code"><div className="win-bar"><span className="lights"><i /><i /><i /></span><span className="win-title">type</span></div><div className="code"><pre><code>{`function useDiscoverVaults(opts?: {
  fromBlock?: bigint;
  enabled?: boolean;  // skip the scan entirely (mock mode)
}): {
  vaults: VaultCreatedEvent[];
  isLoading: boolean;
  error?: Error;
};`}</code></pre></div></div> }],
        prev: { href: "/docs/hooks/use-create-vault", label: "useCreateVault" },
        next: { href: "/docs/hooks/use-vault", label: "useVault" },
      }}
    />
  );
}
