import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useTimeWindowState"],
        title: "useTimeWindowState",
        badges: <><Badge tone="primary">hook</Badge><Badge>new in 0.5</Badge></>,
        lede: <>Reads a <code>TimeWindowCondition</code> vault&apos;s <code>[startTs, endTs]</code> window + ticks a 1-second client-side timer to surface <code>opensInMs</code>/<code>closesInMs</code>.</>,
        importLine: 'import { useTimeWindowState } from "@cdr-kit/react"',
        sections: [
          { id: "signature", title: "Signature", content: <CodePanel title="type" language="ts" code={`function useTimeWindowState(uuid: number, address?: Hex): {
  startTs?: bigint;
  endTs?: bigint;      // 0 = open-ended after startTs
  blockBased?: boolean;
  isOpen: boolean;
  opensInMs: number;    // 0 if already open or unconfigured
  closesInMs: number;   // 0 if open-ended or already closed
  isLoading: boolean;
};`} /> },
          { id: "block-based", title: "Block-based windows", content: <p>For <code>blockBased: true</code> windows, <code>opensInMs</code>/<code>closesInMs</code> return <code>0</code> — <code>block.number</code> isn&apos;t ticked client-side. Read the raw block bounds from the result object.</p> },
        ],
        prev: { href: "/docs/hooks/use-dead-man-timer", label: "useDeadManTimer" },
        next: { href: "/docs/hooks/use-multi-sig-status", label: "useMultiSigStatus" },
      }}
    />
  );
}
