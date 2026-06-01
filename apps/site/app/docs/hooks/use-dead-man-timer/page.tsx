import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useDeadManTimer"],
        title: "useDeadManTimer",
        badges: <><Badge tone="primary">hook</Badge><Badge>new in 0.5</Badge></>,
        lede: <>Live countdown to <code>DeadManSwitchCondition.unlockAt</code> + a creator-only <code>poke()</code> action. The data source for <code>&lt;HeartbeatTimer&gt;</code>.</>,
        importLine: 'import { useDeadManTimer } from "@cdr-kit/react"',
        sections: [
          { id: "signature", title: "Signature", content: <CodePanel title="type" language="ts" code={`function useDeadManTimer(uuid: number, address?: Hex): {
  unlocksAt?: bigint;
  duration?: bigint;
  blockBased?: boolean;
  remainingMs: number;
  isUnlocked: boolean;
  isCritical: boolean;   // < 25% of duration left
  poke: () => Promise<Hex>;
  isLoading: boolean;
};`} /> },
          { id: "address-override", title: "Address override", content: <p>The default reads from <code>aeneid.deadManSwitchCondition</code>. Pass <code>address</code> to point at a custom deployment (e.g. mainnet once it ships).</p> },
        ],
        prev: { href: "/docs/hooks/use-cdr-wallet", label: "useCdrWallet" },
        next: { href: "/docs/hooks/use-time-window-state", label: "useTimeWindowState" },
      }}
    />
  );
}
