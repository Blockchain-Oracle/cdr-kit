import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";
import { SubscribeButtonDemo } from "@/components/gallery/subscribe-button-demo";

const CODE = `import { CdrProvider } from "@cdr-kit/react";
import { createMockCdrKit } from "@cdr-kit/core";
import { SubscribeButton } from "@cdr-kit/react-ui";

<CdrProvider mockKit={createMockCdrKit()}>
  <SubscribeButton
    uuid={4200}
    priceWei={5n * 10n ** 18n}
    priceLabel="5 $IP"
  />
</CdrProvider>`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react-ui", "Components", "SubscribeButton"],
        title: "<SubscribeButton>",
        badges: <><Badge tone="primary">styled</Badge><Badge>mock-ready</Badge></>,
        lede: <>Batteries-included CTA. Wraps <code>useSubscribeAndAccess</code>, renders an inline <code>AccessStepper</code> through the wait phases, then shows the decrypted JSON when access is granted.</>,
        importLine: 'import { SubscribeButton } from "@cdr-kit/react-ui"',
        sections: [
          {
            id: "preview",
            title: "Live preview",
            content: <Demo preview={<SubscribeButtonDemo />} code={CODE} badge={<Badge>mock kit</Badge>} />,
          },
          {
            id: "props",
            title: "Props",
            content: (
              <PropsTable rows={[
                { name: "uuid", type: "number", required: true, description: "The CDR vault id to subscribe to." },
                { name: "priceWei", type: "bigint", required: true, description: "Total value (wei) sent to subscribe. Use the maxPricePerPeriod from your condition config." },
                { name: "priceLabel", type: "string", required: true, description: "Human-readable price rendered on the button (e.g. \"5 $IP\")." },
                { name: "periods", type: "bigint", defaultValue: "1n", description: "Number of subscription periods to pay for in this call." },
                { name: "subscriptionCondition", type: "Hex", description: "Override the default deployed SubscriptionCondition address." },
                { name: "onAccess", type: "(bytes: Uint8Array) => void", description: "Called with the decrypted bytes once the flow completes." },
              ]} />
            ),
          },
        ],
        prev: { href: "/docs/components/access-stepper", label: "AccessStepper" },
        next: { href: "/docs/components/vault-card", label: "VaultCard" },
      }}
    />
  );
}
