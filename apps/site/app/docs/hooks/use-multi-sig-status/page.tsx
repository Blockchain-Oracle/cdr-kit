import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useMultiSigStatus"],
        title: "useMultiSigStatus",
        badges: <><Badge tone="primary">hook</Badge><Badge>new in 0.5</Badge></>,
        lede: <>Reads the configured signers + threshold + epoch for a <code>MultiSigCondition</code> vault. Sigs themselves live off-chain — combine this with your own collection state to render approval progress.</>,
        importLine: 'import { useMultiSigStatus } from "@cdr-kit/react"',
        sections: [
          { id: "signature", title: "Signature", content: <CodePanel title="type" language="ts" code={`function useMultiSigStatus(uuid: number, address?: Hex): {
  signers: readonly Hex[];
  threshold: number;
  epoch: bigint;
  isLoading: boolean;
};`} /> },
        ],
        prev: { href: "/docs/hooks/use-time-window-state", label: "useTimeWindowState" },
        next: { href: "/docs/hooks/use-escrow-state", label: "useEscrowState" },
      }}
    />
  );
}
