import { aeneid } from "@cdr-kit/contracts";
import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/contracts", "Conditions", "OpenCondition"],
        title: "OpenCondition",
        badges: <Badge tone="live">deployed</Badge>,
        lede: <>Always returns <code>true</code>. Use as a fallback / sanity gate, or as the read condition for genuinely public data.</>,
        importLine: `address = ${aeneid.openCondition}`,
        sections: [{ id: "config", title: "Config", content: <p>No config bytes required — pass <code>0x</code>.</p> }],
        prev: { href: "/docs/contracts/composable-condition", label: "ComposableCondition" },
        next: { href: "/docs/contracts/creator-write-condition", label: "CreatorWriteCondition" },
      }}
    />
  );
}
