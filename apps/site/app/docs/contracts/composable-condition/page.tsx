import { aeneid } from "@cdr-kit/contracts";
import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/contracts", "Conditions", "ComposableCondition"],
        title: "ComposableCondition",
        badges: <><Badge tone="live">deployed</Badge><Badge>boolean</Badge></>,
        lede: <>Boolean AND / OR over child conditions, up to 8 deep. Compose &quot;Subscription <code>OR</code> Tier&quot; or &quot;Royalty <code>AND</code> License&quot; — natively, on chain, in one read check.</>,
        importLine: `address = ${aeneid.composableCondition}`,
        sections: [
          {
            id: "config",
            title: "Config shape",
            content: (
              <ul>
                <li><code>mode: uint8</code> — 0 = AND, 1 = OR.</li>
                <li><code>children: address[]</code> — child condition addresses (1–8).</li>
              </ul>
            ),
          },
          {
            id: "aux",
            title: "accessAuxData",
            content: <p>ABI-encoded <code>bytes[]</code> of per-child aux, aligned to the configured children order.</p>,
          },
        ],
        prev: { href: "/docs/contracts/tier-gate-condition", label: "TierGateCondition" },
        next: { href: "/docs/contracts/open-condition", label: "OpenCondition" },
      }}
    />
  );
}
