import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useEscrowState"],
        title: "useEscrowState",
        badges: <><Badge tone="primary">hook</Badge><Badge>new in 0.5</Badge></>,
        lede: <>The buyer-side state machine for <code>ConditionalEscrowCondition</code>: listing + paid status + delivery + timeout countdown, plus the two write actions (<code>pay</code>, <code>confirmDelivery</code>).</>,
        importLine: 'import { useEscrowState } from "@cdr-kit/react"',
        sections: [
          { id: "signature", title: "Signature", content: <CodePanel title="type" language="ts" code={`function useEscrowState(uuid: number, buyer: Hex | undefined, address?: Hex): {
  seller?: Hex;
  price?: bigint;
  timeoutSecs?: bigint;
  arbiter?: Hex;
  paidAt: bigint;       // 0 = unpaid
  delivered: boolean;
  timeoutAt?: bigint;
  timeoutInMs: number;
  pay: () => Promise<Hex>;
  confirmDelivery: () => Promise<Hex>;
  isLoading: boolean;
};`} /> },
        ],
        prev: { href: "/docs/hooks/use-multi-sig-status", label: "useMultiSigStatus" },
        next: { href: "/docs/hooks/use-storage-backend", label: "useStorageBackend" },
      }}
    />
  );
}
