import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useCreateVault"],
        title: "useCreateVault",
        badges: <Badge tone="primary">hook</Badge>,
        lede: <>Seller-side: call the <code>CdrKitVault</code> factory to mint the NFT, register the IP asset, allocate the CDR slot, and configure the read condition — in one transaction.</>,
        importLine: 'import { useCreateVault } from "@cdr-kit/react"',
        sections: [{ id: "signature", title: "Signature", content: <div className="win doc-code"><div className="win-bar"><span className="lights"><i /><i /><i /></span><span className="win-title">type</span></div><div className="code"><pre><code>{`function useCreateVault(): (params: {
  readConditionAddr: Hex;
  readConfig: Hex;
  childConditions?: Hex[];
  childConfigs?: Hex[];
  licenseTermsId?: bigint;
  value?: bigint;
  gas?: bigint;
  vault?: Hex;
}) => Promise<Hash>;`}</code></pre></div></div> }],
        prev: { href: "/docs/hooks/use-subscribe-and-access", label: "useSubscribeAndAccess" },
        next: { href: "/docs/hooks/use-discover-vaults", label: "useDiscoverVaults" },
      }}
    />
  );
}
