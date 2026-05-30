import { VaultCard, IpPrice } from "@cdr-kit/react-ui";
import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";

const FIVE_IP = BigInt(5) * BigInt(10) ** BigInt(18);

const CODE = `import { VaultCard, IpPrice } from "@cdr-kit/react-ui";

<VaultCard
  uuid={4200}
  condition="subscription"
  title="ETH/USD alpha signal"
  description="Hourly directional signal, threshold-encrypted."
  dataType="signal"
  creatorName="0xc183…96E2"
  price={<IpPrice wei={5n * 10n ** 18n} period="/ 30d" />}
  href="/vault/4200"
/>`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react-ui", "Components", "VaultCard"],
        title: "<VaultCard>",
        badges: <Badge tone="primary">styled</Badge>,
        lede: <>Marketplace card with a CSS pointer-tracking spotlight on hover. Renders the condition badge, title, description, optional data type, creator, and price.</>,
        importLine: 'import { VaultCard } from "@cdr-kit/react-ui"',
        sections: [
          {
            id: "preview",
            title: "Live preview",
            content: (
              <Demo
                preview={
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, width: "100%", maxWidth: 380 }}>
                    <VaultCard
                      uuid={4200}
                      condition="subscription"
                      title="ETH/USD alpha signal"
                      description="Hourly directional signal, threshold-encrypted. Subscribers decrypt the latest window."
                      dataType="signal"
                      creatorName="0xc183…96E2"
                      price={<IpPrice wei={FIVE_IP} period="/ 30d" />}
                    />
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
                { name: "uuid", type: "number", required: true, description: "The CDR vault id (rendered in the corner)." },
                { name: "condition", type: "ConditionKind", required: true, description: "Drives the colored ConditionBadge in the card header." },
                { name: "title", type: "string", required: true, description: "Card heading." },
                { name: "description", type: "string", required: true, description: "2-line clamped body description." },
                { name: "dataType", type: "string", description: "Small chip in the meta row (e.g. \"signal\", \"dataset\")." },
                { name: "creatorName", type: "string", description: "Truncated address or display name in the footer." },
                { name: "price", type: "ReactNode", description: "Right-aligned footer price slot — pair with <IpPrice />." },
                { name: "href", type: "string", description: "Render the card as an <a> linking to the vault detail page." },
              ]} />
            ),
          },
        ],
        prev: { href: "/docs/components/subscribe-button", label: "SubscribeButton" },
        next: { href: "/docs/components/copy-button", label: "CopyButton" },
      }}
    />
  );
}
