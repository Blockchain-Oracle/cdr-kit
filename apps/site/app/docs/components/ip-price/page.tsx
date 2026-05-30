import { IpPrice } from "@cdr-kit/react-ui";
import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";

const FIVE_IP = BigInt(5) * BigInt(10) ** BigInt(18);

const CODE = `import { IpPrice } from "@cdr-kit/react-ui";

<IpPrice wei={5n * 10n ** 18n} period="/ 30d" />
<IpPrice wei={null} />            {/* "License-gated" */}`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react-ui", "DX primitives", "IpPrice"],
        title: "<IpPrice>",
        badges: <Badge tone="primary">DX primitive</Badge>,
        lede: <>Formats <code>wei</code> as <code>n IP</code> with an optional period suffix. Pass <code>null</code> for license-gated vaults — renders the standard alt label.</>,
        importLine: 'import { IpPrice } from "@cdr-kit/react-ui"',
        sections: [
          {
            id: "preview",
            title: "Live preview",
            content: (
              <Demo
                preview={
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center" }}>
                    <IpPrice wei={FIVE_IP} period="/ 30d" />
                    <IpPrice wei={null} />
                  </div>
                }
                code={CODE}
              />
            ),
          },
          {
            id: "props",
            title: "Props",
            content: (
              <PropsTable rows={[
                { name: "wei", type: "bigint | null", required: true, description: "Price in wei. null renders \"License-gated\"." },
                { name: "period", type: "string", description: "Suffix appended after the IP value (e.g. \"/ 30d\")." },
                { name: "decimals", type: "number", defaultValue: "4", description: "Max significant decimal digits in the formatted output." },
              ]} />
            ),
          },
        ],
        prev: { href: "/docs/components/explorer-link", label: "ExplorerLink" },
        next: { href: "/docs/components/cdr-network-chip", label: "CdrNetworkChip" },
      }}
    />
  );
}
