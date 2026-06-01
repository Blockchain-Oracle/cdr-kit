import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";

// Hardcoded until @cdr-kit/contracts@0.5.0 publishes (apps/site consumes ^0.4.0 from npm).
const DEAD_MAN_ADDRESS = "0x37226f97e184843aB0b8d4f08A55969801B97766";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/contracts", "Conditions", "DeadManSwitchCondition"],
        title: "DeadManSwitchCondition",
        badges: <><Badge tone="live">deployed</Badge><Badge>new in 0.5</Badge></>,
        lede: <>Auto-unlock to heir(s) (or public) if the creator stops calling <code>poke()</code> within <code>duration</code>. The wallet-recovery / estate-planning / leak-on-disappearance primitive Story docs reference.</>,
        importLine: `address = ${DEAD_MAN_ADDRESS}`,
        sections: [
          {
            id: "config",
            title: "Config shape",
            content: (
              <PropsTable rows={[
                { name: "duration", type: "uint64", required: true, description: "Heartbeat window length (seconds OR blocks). Must be > 0." },
                { name: "heirs", type: "address[]", required: true, description: "Allowed readers post-unlock if publicAfterUnlock = false. Empty array forces publicAfterUnlock to true." },
                { name: "blockBased", type: "bool", required: true, description: "true = interpret duration as block count." },
                { name: "creatorCanReadWhileLocked", type: "bool", required: true, description: "Creator reads their own vault pre-unlock (default true via agent helper)." },
                { name: "publicAfterUnlock", type: "bool", required: true, description: "true = anyone reads post-unlock; false = restricted to heirs." },
              ]} />
            ),
          },
          {
            id: "trapdoor",
            title: "The trapdoor",
            content: <p>Post-unlock, the creator gets NO special treatment. If <code>publicAfterUnlock = false</code> AND the creator isn&apos;t in <code>heirs</code>, they lose read access permanently at unlock — by design. <code>agent.createDeadManVault</code> defaults <code>creatorCanReadWhileLocked = true</code> and recommends adding the creator to <code>heirs</code> for post-unlock access.</p>,
          },
          {
            id: "poke",
            title: "poke()",
            content: <p>Creator-only. Cannot be called after <code>unlockAt</code> (one-way trapdoor — reviving would let a late-poking creator block heirs forever). Most operational risk is forgetting to poke; consider a self-hosted cron or Gelato Automate for long durations.</p>,
          },
        ],
        prev: { href: "/docs/contracts/time-window-condition", label: "TimeWindowCondition" },
        next: { href: "/docs/contracts/conditional-escrow-condition", label: "ConditionalEscrowCondition" },
      }}
    />
  );
}
