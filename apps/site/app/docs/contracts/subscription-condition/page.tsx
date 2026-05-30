import { aeneid } from "@cdr-kit/contracts";
import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/contracts", "Conditions", "SubscriptionCondition"],
        title: "SubscriptionCondition",
        badges: <><Badge tone="live">deployed</Badge><Badge>recurring</Badge></>,
        lede: <>Recurring paid access. The buyer calls <code>subscribe(uuid, periods, maxPricePerPeriod)</code> with the right <code>value</code>; subsequent reads pass until the subscription expires.</>,
        importLine: `address = ${aeneid.subscriptionCondition}`,
        sections: [
          {
            id: "config",
            title: "Config shape",
            content: (
              <PropsTable rows={[
                { name: "pricePerPeriod", type: "uint256", required: true, description: "Price in wei per subscription period." },
                { name: "period", type: "uint256", required: true, description: "Period length in seconds." },
                { name: "payee", type: "address", required: true, description: "Where subscription value is routed." },
                { name: "mode", type: "uint8", required: true, description: "0 = native IP, 1 = WIP royalty routing." },
                { name: "licensorIpId", type: "address", description: "Required in royalty mode; 0x0 in native mode." },
              ]} />
            ),
          },
        ],
        prev: { href: "/docs/contracts", label: "Condition library" },
        next: { href: "/docs/contracts/tier-gate-condition", label: "TierGateCondition" },
      }}
    />
  );
}
