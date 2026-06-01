import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";
import { TimeWindowBadgeDemo } from "@/components/docs/demos/time-window-badge-demo";
import "../components.css";

const CODE = `import { TimeWindowBadge } from "@cdr-kit/react";

<TimeWindowBadge uuid={5101} />

// Render-prop for custom presentation:
<TimeWindowBadge uuid={5101}>
  {({ isOpen, opensInMs, closesInMs }) =>
    isOpen
      ? <span>open · closes in {Math.floor(closesInMs / 60_000)}m</span>
      : <span>opens in {Math.floor(opensInMs / 3_600_000)}h</span>
  }
</TimeWindowBadge>`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Components", "TimeWindowBadge"],
        title: "<TimeWindowBadge>",
        badges: <><Badge tone="primary">new in 0.5</Badge><Badge>headless</Badge></>,
        lede: <>Status badge for <code>TimeWindowCondition</code>-gated vaults: <code>opens in 3d 4h</code>, <code>closes in 2h 15m</code>, or <code>closed</code>. Ticks every second client-side, no extra RPC traffic after the first read.</>,
        importLine: 'import { TimeWindowBadge } from "@cdr-kit/react"',
        sections: [
          {
            id: "preview",
            title: "Live preview",
            content: <Demo preview={<TimeWindowBadgeDemo />} code={CODE} badge={<Badge>cycles</Badge>} />,
          },
          {
            id: "props",
            title: "Props",
            content: (
              <PropsTable rows={[
                { name: "uuid", type: "number", required: true, description: "TimeWindowCondition-gated vault uuid." },
                { name: "children", type: "(state: TimeWindowState) => ReactNode", description: "Optional render-prop. Receives { startTs, endTs, blockBased, isOpen, opensInMs, closesInMs, isLoading }." },
              ]} />
            ),
          },
          {
            id: "block-based",
            title: "Block-based windows",
            content: <p>For windows configured with <code>blockBased: true</code>, the client-side <code>opensInMs</code>/<code>closesInMs</code> return <code>0</code> — block.number can&apos;t be ticked client-side cheaply. Render the raw block bounds from the state object instead.</p>,
          },
        ],
        prev: { href: "/docs/components/heartbeat-timer", label: "HeartbeatTimer" },
        next: { href: "/docs/components/multi-sig-approval-tracker", label: "MultiSigApprovalTracker" },
      }}
    />
  );
}
