import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";

// Hardcoded until @cdr-kit/contracts@0.5.0 publishes (apps/site consumes ^0.4.0 from npm).
const MULTI_SIG_ADDRESS = "0xb22EBF0481950A3c0e528A5902C4c5C69184fB78";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/contracts", "Conditions", "MultiSigCondition"],
        title: "MultiSigCondition",
        badges: <><Badge tone="live">deployed</Badge><Badge tone="primary">first-of-kind</Badge><Badge>new in 0.5</Badge></>,
        lede: <>N-of-M EIP-712 read gate. Signers approve OFF-CHAIN — buyer collects <code>threshold</code>-many sigs and submits them as <code>accessAuxData = abi.encode(deadline, sigs[])</code>. No <code>approve()</code> tx per signer, no per-signer gas. First-of-kind in the CDR ecosystem.</>,
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
            id: "rotation",
            title: "rotateSigners()",
            content: <p>Creator-only. Validates the new signer set + threshold, bumps <code>epoch</code> — all sigs against the previous epoch are now invalid. Use this to remove a compromised signer immediately.</p>,
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
