import { aeneid } from "@cdr-kit/contracts";
import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/contracts", "Conditions", "TierGateCondition"],
        title: "TierGateCondition",
        badges: <><Badge tone="live">deployed</Badge><Badge>licensed</Badge></>,
        lede: <>Gate by a held Story IP license-token tier. The buyer passes the tokenId of their license as <code>accessAuxData</code>; the condition verifies ownership + that the tier is in the allowed set.</>,
        importLine: `address = ${aeneid.tierGateCondition}`,
        sections: [
          {
            id: "config",
            title: "Config shape",
            content: (
              <ul>
                <li><code>ipId: address</code> — the IP asset the license must reference.</li>
                <li><code>allowedTermsIds: uint256[]</code> — accepted PIL terms ids (≥1).</li>
              </ul>
            ),
          },
          {
            id: "aux",
            title: "accessAuxData",
            content: <p>ABI-encoded <code>uint256</code> tokenId of the license the caller holds.</p>,
          },
        ],
        prev: { href: "/docs/contracts/subscription-condition", label: "SubscriptionCondition" },
        next: { href: "/docs/contracts/composable-condition", label: "ComposableCondition" },
      }}
    />
  );
}
