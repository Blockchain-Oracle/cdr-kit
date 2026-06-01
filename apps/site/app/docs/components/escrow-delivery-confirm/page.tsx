import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";
import { EscrowDeliveryConfirmDemo } from "@/components/docs/demos/escrow-delivery-confirm-demo";
import "../components.css";

const CODE = `import { EscrowDeliveryConfirm } from "@cdr-kit/react";

<EscrowDeliveryConfirm uuid={8812} buyer={connectedAddress} />

// Render-prop for the dashboard:
<EscrowDeliveryConfirm uuid={8812} buyer={connectedAddress}>
  {({ paid, delivered, timeoutInMs, confirmDelivery, pay }) => (
    paid === 0n
      ? <button onClick={() => pay()}>Pay listing price</button>
      : delivered
        ? <span>delivered ✓</span>
        : <button onClick={() => confirmDelivery()}>Confirm delivery</button>
  )}
</EscrowDeliveryConfirm>`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Components", "EscrowDeliveryConfirm"],
        title: "<EscrowDeliveryConfirm>",
        badges: <><Badge tone="primary">new in 0.5</Badge><Badge>headless</Badge></>,
        lede: <>Buyer-side flow for <code>ConditionalEscrowCondition</code>: pay → confirm delivery → seller paid + buyer reads. Surfaces the timeout countdown after which the seller can claim unilaterally.</>,
        importLine: 'import { EscrowDeliveryConfirm } from "@cdr-kit/react"',
        sections: [
          {
            id: "preview",
            title: "Live preview",
            content: <Demo preview={<EscrowDeliveryConfirmDemo />} code={CODE} badge={<Badge>mock</Badge>} />,
          },
          {
            id: "props",
            title: "Props",
            content: (
              <PropsTable rows={[
                { name: "uuid", type: "number", required: true, description: "ConditionalEscrowCondition-gated vault uuid." },
                { name: "buyer", type: "Hex | undefined", description: "Address whose paidAt/delivered state to read. Usually the connected wallet." },
                { name: "children", type: "(state) => ReactNode", description: "Render-prop. Receives the full EscrowState including seller, price, timeoutSecs, arbiter, paidAt, delivered, timeoutInMs, plus pay() and confirmDelivery() actions." },
              ]} />
            ),
          },
          {
            id: "intrinsic",
            title: "Intrinsic CDR limitation",
            content: <p>Once a buyer pays + confirms + reads, they hold plaintext forever. The dispute path (arbiter refund) can revoke future access but cannot &quot;un-read.&quot; Document this in your buyer UX.</p>,
          },
        ],
        prev: { href: "/docs/components/multi-sig-signer", label: "MultiSigSigner" },
        next: { href: "/docs/components/condition-badge", label: "ConditionBadge" },
      }}
    />
  );
}
