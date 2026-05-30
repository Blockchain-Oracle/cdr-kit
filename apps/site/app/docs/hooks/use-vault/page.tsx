import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useVault"],
        title: "useVault",
        badges: <Badge tone="primary">hook</Badge>,
        lede: <>Resolve a vault&apos;s on-chain metadata from its <code>uuid</code> via the <code>CdrKitVault</code> factory (token id, IP id, creator, license terms id).</>,
        importLine: 'import { useVault } from "@cdr-kit/react"',
        sections: [{ id: "signature", title: "Signature", content: <div className="win doc-code"><div className="win-bar"><span className="lights"><i /><i /><i /></span><span className="win-title">type</span></div><div className="code"><pre><code>{`function useVault(uuid: number): {
  tokenId?: bigint;
  info?: { /* factory getVaultInfo struct */ };
  isLoading: boolean;
  error?: Error;
};`}</code></pre></div></div> }],
        prev: { href: "/docs/hooks/use-discover-vaults", label: "useDiscoverVaults" },
        next: { href: "/docs/hooks/use-vault-events", label: "useVaultEvents" },
      }}
    />
  );
}
