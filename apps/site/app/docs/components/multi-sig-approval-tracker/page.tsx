import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";
import { MultiSigApprovalTrackerDemo } from "@/components/docs/demos/multi-sig-approval-tracker-demo";
import "../components.css";

const CODE = `import { MultiSigApprovalTracker } from "@cdr-kit/react";

// signedBy is the list of signers who have already produced a sig OFF-CHAIN
// (the contract is stateless on approvals — no per-signer tx).
<MultiSigApprovalTracker
  uuid={7331}
  signedBy={["0xAlice...", "0xBob..."]}
/>`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Components", "MultiSigApprovalTracker"],
        title: "<MultiSigApprovalTracker>",
        badges: <><Badge tone="primary">new in 0.5</Badge><Badge>headless</Badge></>,
        lede: <>X of Y approved + epoch — the read-side dashboard for <code>MultiSigCondition</code>. Combines the on-chain signer set with the off-chain set of collected sigs to render approval progress.</>,
        importLine: 'import { MultiSigApprovalTracker } from "@cdr-kit/react"',
        sections: [
          {
            id: "preview",
            title: "Live preview",
            content: <Demo preview={<MultiSigApprovalTrackerDemo />} code={CODE} badge={<Badge>mock</Badge>} />,
          },
          {
            id: "props",
            title: "Props",
            content: (
              <PropsTable rows={[
                { name: "uuid", type: "number", required: true, description: "MultiSigCondition-gated vault uuid." },
                { name: "signedBy", type: "readonly Hex[]", defaultValue: "[]", description: "Off-chain set of signers who have produced a sig (the contract stores no approvals — this comes from your sig-collection UI)." },
                { name: "children", type: "(state) => ReactNode", description: "Render-prop. Receives { signers, threshold, epoch, signedCount, isReady, isLoading }." },
              ]} />
            ),
          },
          {
            id: "rotation",
            title: "Epoch rotation",
            content: <p>Each call to <code>rotateSigners()</code> bumps <code>epoch</code>. The tracker re-reads on rotation; UI should prompt for a fresh sig collection because in-flight sigs against the previous epoch are invalidated.</p>,
          },
        ],
        prev: { href: "/docs/components/time-window-badge", label: "TimeWindowBadge" },
        next: { href: "/docs/components/escrow-delivery-confirm", label: "EscrowDeliveryConfirm" },
      }}
    />
  );
}
