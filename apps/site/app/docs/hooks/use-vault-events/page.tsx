import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useVaultEvents"],
        title: "useVaultEvents",
        badges: <Badge tone="primary">hook</Badge>,
        lede: <>Live subscription to <code>VaultCreated</code> events on the factory. Returns events accumulated since mount — pair with <code>useDiscoverVaults</code> for backfill + live.</>,
        importLine: 'import { useVaultEvents } from "@cdr-kit/react"',
        sections: [{ id: "signature", title: "Signature", content: <div className="win doc-code"><div className="win-bar"><span className="lights"><i /><i /><i /></span><span className="win-title">type</span></div><div className="code"><pre><code>{`function useVaultEvents(): {
  tokenId: bigint;
  uuid: number;
  ipId: Hex;
  creator: Hex;
}[];`}</code></pre></div></div> }],
        prev: { href: "/docs/hooks/use-vault", label: "useVault" },
        next: { href: "/docs/hooks/use-creator-vaults", label: "useCreatorVaults" },
      }}
    />
  );
}
