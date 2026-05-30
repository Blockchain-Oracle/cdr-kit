import { aeneid } from "@cdr-kit/contracts";
import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/contracts", "Conditions", "CreatorWriteCondition"],
        title: "CreatorWriteCondition",
        badges: <Badge tone="live">deployed</Badge>,
        lede: <>The default write gate when you mint through <code>CdrKitVault</code>: only the original creator (vault NFT owner) can write encrypted payloads. Factory-aware variant of <code>OwnerWriteCondition</code>.</>,
        importLine: `address = ${aeneid.creatorWriteCondition}`,
        sections: [
          { id: "config", title: "Config", content: <p>No config bytes required — the factory wires the creator at allocation time.</p> },
        ],
        prev: { href: "/docs/contracts/open-condition", label: "OpenCondition" },
        next: { href: "/docs/contracts/cdr-kit-vault", label: "CdrKitVault" },
      }}
    />
  );
}
