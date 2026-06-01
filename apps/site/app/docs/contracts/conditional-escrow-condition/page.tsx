import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";

// Hardcoded until @cdr-kit/contracts@0.5.0 publishes (apps/site consumes ^0.4.0 from npm).
const ESCROW_ADDRESS = "0x7fcDe02DB7c14fD3587aB2fED064a1D8355b7584";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/contracts", "Conditions", "ConditionalEscrowCondition"],
        title: "ConditionalEscrowCondition",
        badges: <><Badge tone="live">deployed</Badge><Badge>new in 0.5</Badge></>,
        lede: <>Buyer pays → confirms delivery → seller paid + buyer reads. Optional arbiter can refund. Seller can <code>claimAfterTimeout(buyer)</code> if the buyer goes silent.</>,
        importLine: `address = ${ESCROW_ADDRESS}`,
        sections: [
          {
            id: "config",
            title: "Config shape",
            content: (
              <PropsTable rows={[
                { name: "seller", type: "address", required: true, description: "Receives funds on confirmDelivery / claimAfterTimeout." },
                { name: "price", type: "uint128", required: true, description: "Listing price in wei (native IP)." },
                { name: "timeoutSecs", type: "uint64", required: true, description: "Seconds after paidAt before the seller can claim unilaterally." },
                { name: "arbiter", type: "address", required: true, description: "Optional dispute resolver. address(0) = no refund path." },
              ]} />
            ),
          },
          {
            id: "flow",
            title: "Flow",
            content: (
              <ol>
                <li><code>pay(uuid)</code> — buyer escrows the price (excess refunded same tx).</li>
                <li><code>confirmDelivery(uuid)</code> — buyer signs off → seller paid + buyer reads.</li>
                <li><code>claimAfterTimeout(uuid, buyer)</code> — seller only, after <code>paidAt + timeoutSecs</code>.</li>
                <li><code>arbiterRefund(uuid, buyer)</code> — arbiter only; resets paidAt and refunds the buyer.</li>
              </ol>
            ),
          },
          {
            id: "intrinsic",
            title: "Intrinsic CDR limitation",
            content: <p>CDR has no confidential compute — once a buyer reads, they hold plaintext forever. The dispute path can revoke future access but cannot &quot;un-read.&quot; Document this in your buyer UX.</p>,
          },
        ],
        prev: { href: "/docs/contracts/dead-man-switch-condition", label: "DeadManSwitchCondition" },
        next: { href: "/docs/contracts/multi-sig-condition", label: "MultiSigCondition" },
      }}
    />
  );
}
