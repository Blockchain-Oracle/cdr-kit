import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";

// Hardcoded until @cdr-kit/contracts@0.5.0 publishes (apps/site consumes ^0.4.0 from npm).
const TIME_WINDOW_ADDRESS = "0x67911435F262e7e4EC4F7FEB4e868a67b9dd90b1";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/contracts", "Conditions", "TimeWindowCondition"],
        title: "TimeWindowCondition",
        badges: <><Badge tone="live">deployed</Badge><Badge>new in 0.5</Badge></>,
        lede: <>Read access is allowed only during <code>[startTs, endTs]</code>. <code>endTs == 0</code> means open-ended (release-on-date pattern). Block-based mode (<code>blockBased: true</code>) is preferred for short horizons.</>,
        importLine: `address = ${TIME_WINDOW_ADDRESS}`,
        sections: [
          {
            id: "config",
            title: "Config shape",
            content: (
              <PropsTable rows={[
                { name: "startTs", type: "uint64", required: true, description: "Start timestamp (or block number if blockBased)." },
                { name: "endTs", type: "uint64", required: true, description: "End (0 = open-ended)." },
                { name: "blockBased", type: "bool", required: true, description: "true = interpret startTs/endTs as block.number; false = block.timestamp." },
              ]} />
            ),
          },
          {
            id: "presets",
            title: "Agent presets",
            content: (
              <ul>
                <li><code>releaseOnDate(startTs)</code> → <code>(startTs, 0, false)</code> — open-ended after a date.</li>
                <li><code>availableDuring(startTs, endTs)</code> → <code>(startTs, endTs, false)</code> — bounded window.</li>
                <li><code>releaseAfterBlocks(blockNum)</code> → <code>(0, blockNum, true)</code> — block-based release.</li>
              </ul>
            ),
          },
        ],
        prev: { href: "/docs/contracts/cdr-kit-vault", label: "CdrKitVault" },
        next: { href: "/docs/contracts/dead-man-switch-condition", label: "DeadManSwitchCondition" },
      }}
    />
  );
}
