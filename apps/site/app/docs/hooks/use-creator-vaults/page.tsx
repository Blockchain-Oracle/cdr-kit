import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useCreatorVaults"],
        title: "useCreatorVaults",
        badges: <Badge tone="primary">hook</Badge>,
        lede: <>Returns the token ids owned by a given creator address — wraps the factory&apos;s <code>getCreatorVaults(address)</code>. Standard wagmi <code>useReadContract</code> result shape.</>,
        importLine: 'import { useCreatorVaults } from "@cdr-kit/react"',
        sections: [{ id: "signature", title: "Signature", content: <div className="win doc-code"><div className="win-bar"><span className="lights"><i /><i /><i /></span><span className="win-title">type</span></div><div className="code"><pre><code>{`function useCreatorVaults(creator?: Hex): {
  data?: readonly bigint[];
  isLoading: boolean;
  error?: Error;
  // …plus the rest of wagmi's useReadContract return
};`}</code></pre></div></div> }],
        prev: { href: "/docs/hooks/use-vault-events", label: "useVaultEvents" },
        next: { href: "/docs/hooks/use-cdr-wallet", label: "useCdrWallet" },
      }}
    />
  );
}
