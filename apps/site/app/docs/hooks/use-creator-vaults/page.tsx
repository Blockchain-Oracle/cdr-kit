import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useCreatorVaults"],
        title: "useCreatorVaults",
        badges: <Badge tone="primary">hook</Badge>,
        lede: <>Returns the token ids owned by a given creator address — wraps the factory&apos;s <code>getCreatorVaults(address)</code>. Standard wagmi <code>useReadContract</code> result shape.</>,
        importLine: 'import { useCreatorVaults } from "@cdr-kit/react"',
        sections: [{ id: "signature", title: "Signature", content: <CodePanel title="type" language="ts" code={`function useCreatorVaults(creator?: Hex): {
  data?: readonly bigint[];
  isLoading: boolean;
  error?: Error;
  // …plus the rest of wagmi's useReadContract return
};`} /> }],
        prev: { href: "/docs/hooks/use-vault-events", label: "useVaultEvents" },
        next: { href: "/docs/hooks/use-cdr-wallet", label: "useCdrWallet" },
      }}
    />
  );
}
