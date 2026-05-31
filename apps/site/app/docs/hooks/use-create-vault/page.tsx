import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useCreateVault"],
        title: "useCreateVault",
        badges: <Badge tone="primary">hook</Badge>,
        lede: <>Seller-side: call the <code>CdrKitVault</code> factory to mint the NFT, register the IP asset, allocate the CDR slot, and configure the read condition — in one transaction.</>,
        importLine: 'import { useCreateVault } from "@cdr-kit/react"',
        sections: [{ id: "signature", title: "Signature", content: <CodePanel title="type" language="ts" code={`function useCreateVault(): (params: {
  readConditionAddr: Hex;
  readConfig: Hex;
  childConditions?: Hex[];
  childConfigs?: Hex[];
  licenseTermsId?: bigint;
  value?: bigint;
  gas?: bigint;
  vault?: Hex;
}) => Promise<Hash>;`} /> }],
        prev: { href: "/docs/hooks/use-subscribe-and-access", label: "useSubscribeAndAccess" },
        next: { href: "/docs/hooks/use-discover-vaults", label: "useDiscoverVaults" },
      }}
    />
  );
}
