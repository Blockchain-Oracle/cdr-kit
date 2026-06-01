import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";

// Hardcoded until @cdr-kit/contracts@0.5.0 publishes (apps/site consumes ^0.4.0 from npm).
// 0x61061c… is the 0.5 redeploy with on-chain `approve()` path added; previous 0xb22EBF…
// retired (off-chain-only — same epoch + sig logic but no on-chain approve fn).
const MULTI_SIG_ADDRESS = "0x61061CCb8BD4C9E0AfF67ed4d2226f0Fc140FB87";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/contracts", "Conditions", "MultiSigCondition"],
        title: "MultiSigCondition",
        badges: <><Badge tone="live">deployed</Badge><Badge tone="primary">first-of-kind</Badge><Badge>new in 0.5</Badge></>,
        lede: <>N-of-M read gate with <b>two parallel approval paths</b>: off-chain EIP-712 sigs (gas-free; buyer collects + submits at read time) OR Safe-style on-chain <code>approve()</code> (signers pay gas; dashboards read chain truth). A read passes when EITHER path meets <code>threshold</code>. First-of-kind in the CDR ecosystem.</>,
        importLine: `address = ${MULTI_SIG_ADDRESS}`,
        sections: [
          {
            id: "config",
            title: "Config shape",
            content: (
              <PropsTable rows={[
                { name: "signers", type: "address[]", required: true, description: "Allowed signers. MUST be sorted strictly ascending (agent helper auto-sorts)." },
                { name: "threshold", type: "uint16", required: true, description: "Minimum sigs required (1 ≤ threshold ≤ signers.length)." },
              ]} />
            ),
          },
          {
            id: "eip712",
            title: "EIP-712 Approval",
            content: (
              <ul>
                <li>Domain: <code>cdr-kit:MultiSigCondition</code>, version <code>1</code>, chainId 1315, verifyingContract = condition address.</li>
                <li>Type: <code>Approval(uint32 uuid, address caller, uint64 epoch, uint64 deadline)</code>.</li>
                <li><code>caller</code> binding prevents sig replay against a different reader; <code>epoch</code> rotation invalidates in-flight sigs.</li>
              </ul>
            ),
          },
          {
            id: "onchain-approve",
            title: "On-chain approve() — the Safe-style path",
            content: (
              <>
                <p>For dashboards that prefer chain-truth over off-chain sig collection, signers call <code>approve(uuid)</code> on-chain. Each approval costs ~50k gas. <code>currentApprovalsCount(uuid)</code> returns the count for the active epoch — read it directly in your UI via <code>useMultiSigStatus</code>.</p>
                <p>Storage shape (epoch-scoped, so rotation auto-invalidates): <code>hasApproved[uuid][epoch][signer]</code> + <code>approvalsCount[uuid][epoch]</code>. Emits <code>Approved(uuid, signer, epoch)</code> for indexers.</p>
              </>
            ),
          },
          {
            id: "rotation",
            title: "rotateSigners()",
            content: <p>Creator-only. Validates the new signer set + threshold, bumps <code>epoch</code> — invalidates BOTH off-chain sigs (signed against the old epoch) AND on-chain approvals (the count under the old epoch key no longer matters since reads check the new epoch). Use this to remove a compromised signer immediately.</p>,
          },
          {
            id: "limitations",
            title: "Limitations",
            content: <p>EIP-1271 (Safe / contract-wallet signers) not supported in 0.5 — <code>ecrecover</code> handles EOAs only. Workaround: have a Safe-owned EOA sign on behalf and register that EOA.</p>,
          },
        ],
        prev: { href: "/docs/contracts/conditional-escrow-condition", label: "ConditionalEscrowCondition" },
        next: { href: "/docs/contracts/cdr-kit-vault", label: "CdrKitVault" },
      }}
    />
  );
}
