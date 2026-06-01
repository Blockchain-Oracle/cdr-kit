import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const SIGN_CODE = `import { MultiSigSigner } from "@cdr-kit/react";

// Default render — button → on click signs EIP-712 → shows the sig + copy button.
<MultiSigSigner uuid={7331} />

// With a custom caller (default = connected wallet) and 30-min deadline:
<MultiSigSigner
  uuid={7331}
  caller="0xBuyerWhoWillSubmit"
  deadline={BigInt(Math.floor(Date.now() / 1000) + 1800)}
/>

// Render-prop for full custom UI:
<MultiSigSigner uuid={7331}>
  {({ sign, signature, isLoading, error, onSign }) => (
    signature
      ? <span>Sig: {signature}</span>
      : <button disabled={isLoading} onClick={onSign}>
          {isLoading ? "signing…" : "Approve read"}
        </button>
  )}
</MultiSigSigner>`;

const SUBMIT_CODE = `// Buyer side — once threshold-many sigs collected from different signers:
import { CdrAgent } from "@cdr-kit/agent";

const bytes = await agent.accessMultiSig({
  uuid: 7331,
  deadline,                  // MUST match every sig's deadline
  sigs: [sigFromAlice, sigFromBob],  // sorted by signer address ASC
});`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Components", "MultiSigSigner"],
        title: "<MultiSigSigner>",
        badges: (
          <>
            <Badge tone="primary">new in 0.5</Badge>
            <Badge>headless</Badge>
            <Badge>signer-side</Badge>
          </>
        ),
        lede: (
          <>
            Producer half of the off-chain dual-path <code>MultiSigCondition</code> flow: a button that
            signs an EIP-712 <code>Approval(uuid, caller, epoch, deadline)</code> and surfaces the 65-byte sig
            for the signer to share with the buyer. Pair with <code>agent.accessMultiSig({"{ uuid, deadline, sigs[] }"})</code>{" "}
            on the buyer side to submit threshold-many sigs as <code>accessAuxData</code>. The complementary{" "}
            <code>&lt;MultiSigApprovalTracker&gt;</code> is the buyer-side aggregator.
          </>
        ),
        importLine: 'import { MultiSigSigner } from "@cdr-kit/react"',
        sections: [
          {
            id: "usage",
            title: "Usage",
            content: <CodePanel title="tsx" language="tsx" code={SIGN_CODE} />,
          },
          {
            id: "props",
            title: "Props",
            content: (
              <PropsTable
                rows={[
                  { name: "uuid", type: "number", required: true, description: "MultiSigCondition-gated vault uuid." },
                  {
                    name: "caller",
                    type: "Hex",
                    description:
                      "Optional override — defaults to the connected wallet. The sig is bound to this address; only this caller can use it via accessAuxData (anyone else fails ecrecover).",
                  },
                  {
                    name: "deadline",
                    type: "bigint",
                    description:
                      "Optional unix-seconds expiry. Default: 1 hour from when the user clicks Sign. The buyer's `accessMultiSig` call MUST pass the same deadline used at signing time.",
                  },
                  {
                    name: "children",
                    type: "(state) => ReactNode",
                    description:
                      "Render-prop. Receives { sign, signature, isLoading, error, onSign }. `onSign` is a bound zero-arg helper that calls `sign(...)` with the component's caller+deadline.",
                  },
                ]}
              />
            ),
          },
          {
            id: "submit",
            title: "Submit threshold-many sigs",
            content: (
              <>
                <p>
                  Once <code>threshold</code>-many signers have produced sigs, the buyer (or any caller) builds the
                  combined <code>accessAuxData</code> and reads the vault. <code>agent.accessMultiSig</code> handles the
                  abi-encoding; sigs must be ordered by recovered signer address ascending (the contract enforces a
                  strict-ascending dedupe).
                </p>
                <CodePanel title="ts" language="ts" code={SUBMIT_CODE} />
              </>
            ),
          },
          {
            id: "rotation",
            title: "Epoch rotation invalidates in-flight sigs",
            content: (
              <p>
                The hook fetches the current <code>epoch</code> from <code>getConfig(uuid)</code> immediately before
                signing. If <code>rotateSigners</code> lands between sign and submit, the contract recomputes the
                digest with the new epoch — <code>ecrecover</code> returns a different address and the sig is
                rejected. The signer can re-sign against the new epoch if they still want to authorize the new set
                (use the &quot;re-sign&quot; button in the default render, or call <code>sign()</code> again).
              </p>
            ),
          },
          {
            id: "hook",
            title: "Hook variant",
            content: (
              <p>
                Skip the component and use <code>useSignMultiSigApproval(uuid)</code> directly — returns{" "}
                <code>{`{ sign, signature, isLoading, error }`}</code>. Useful when the sign trigger lives in a
                non-button surface (drag-and-drop, gesture, programmatic flow).
              </p>
            ),
          },
        ],
        prev: { href: "/docs/components/multi-sig-approval-tracker", label: "MultiSigApprovalTracker" },
        next: { href: "/docs/components/escrow-delivery-confirm", label: "EscrowDeliveryConfirm" },
      }}
    />
  );
}
