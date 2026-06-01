import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";
import { HeartbeatTimerDemo } from "@/components/docs/demos/heartbeat-timer-demo";
import "../components.css";

const CODE = `import { HeartbeatTimer, useDeadManTimer } from "@cdr-kit/react";

// Default headless render — countdown + extend button:
<HeartbeatTimer uuid={4242} />

// Custom render — full control via render-prop:
<HeartbeatTimer uuid={4242}>
  {({ remainingMs, isCritical, isUnlocked, poke }) => (
    <div className={isCritical ? "warn" : ""}>
      {isUnlocked ? "unlocked" : \`unlocks in \${remainingMs / 1000}s\`}
      <button onClick={() => poke()}>extend now</button>
    </div>
  )}
</HeartbeatTimer>`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Components", "HeartbeatTimer"],
        title: "<HeartbeatTimer>",
        badges: <><Badge tone="primary">new in 0.5</Badge><Badge>headless</Badge></>,
        lede: <>Countdown to <code>DeadManSwitchCondition.unlockAt</code> with a creator-side <code>poke()</code> button. Flips into <code>critical</code> mode once &lt; 25% of the window remains, so the UI can prompt the creator before silence becomes irreversible.</>,
        importLine: 'import { HeartbeatTimer } from "@cdr-kit/react"',
        sections: [
          {
            id: "preview",
            title: "Live preview",
            content: <Demo preview={<HeartbeatTimerDemo />} code={CODE} badge={<Badge>mock</Badge>} />,
          },
          {
            id: "props",
            title: "Props",
            content: (
              <PropsTable rows={[
                { name: "uuid", type: "number", required: true, description: "DeadManSwitchCondition-gated vault uuid." },
                { name: "children", type: "(state: DeadManTimer) => ReactNode", description: "Optional render-prop. Receives { unlocksAt, duration, remainingMs, isUnlocked, isCritical, poke, isLoading }." },
              ]} />
            ),
          },
          {
            id: "hook",
            title: "Hook variant",
            content: <p>Skip the component and consume <code>useDeadManTimer(uuid)</code> directly. Returns the same state object the render-prop receives.</p>,
          },
        ],
        prev: { href: "/docs/components/empty-vaults", label: "EmptyVaults" },
        next: { href: "/docs/components/time-window-badge", label: "TimeWindowBadge" },
      }}
    />
  );
}
