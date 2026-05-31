import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useVaultEvents"],
        title: "useVaultEvents",
        badges: <Badge tone="primary">hook</Badge>,
        lede: <>Live subscription to <code>VaultCreated</code> events on the factory. Returns events accumulated since mount — pair with <code>useDiscoverVaults</code> for backfill + live.</>,
        importLine: 'import { useVaultEvents } from "@cdr-kit/react"',
        sections: [{ id: "signature", title: "Signature", content: <CodePanel title="type" language="ts" code={`function useVaultEvents(): {
  tokenId: bigint;
  uuid: number;
  ipId: Hex;
  creator: Hex;
}[];`} /> }],
        prev: { href: "/docs/hooks/use-vault", label: "useVault" },
        next: { href: "/docs/hooks/use-creator-vaults", label: "useCreatorVaults" },
      }}
    />
  );
}
