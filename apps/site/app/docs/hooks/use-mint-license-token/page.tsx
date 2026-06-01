import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const SIG = `function useMintLicenseToken(client: StoryClient | undefined): {
  mint: (params: {
    licensorIpId: Hex;
    licenseTermsId: bigint;
    amount?: bigint;          // default 1n
    receiver?: Hex;           // default connected wallet
    maxMintingFee?: bigint;   // default 0n (be careful with commercial flavors!)
  }) => Promise<{ licenseTokenIds: bigint[]; txHash: Hex }>;
  isLoading: boolean;
  error?: Error;
};`;

const EXAMPLE = `import { useStoryClient, useMintLicenseToken } from "@cdr-kit/react";

function BuyAccess({ ipId, licenseTermsId, priceWei }) {
  const client = useStoryClient();
  const { mint, isLoading } = useMintLicenseToken(client);
  return (
    <button
      disabled={!client || isLoading}
      onClick={async () => {
        const { licenseTokenIds } = await mint({
          licensorIpId: ipId,
          licenseTermsId,
          amount: 1n,
          maxMintingFee: priceWei,  // cap exposure if seller changes price mid-tx
        });
        // licenseTokenIds[0] is the buyer's proof — pass as accessAuxData to read
        // a license-gated CDR vault via agent.accessLicenseGated(...).
      }}
    >
      {isLoading ? "minting…" : \`Buy license (\${priceWei} wei)\`}
    </button>
  );
}`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useMintLicenseToken"],
        title: "useMintLicenseToken",
        badges: (
          <>
            <Badge tone="primary">hook</Badge>
            <Badge>new in 0.5</Badge>
            <Badge>Story IP</Badge>
          </>
        ),
        lede: (
          <>
            Buyer-side helper: mint Story license token(s) against an IP&apos;s{" "}
            <code>licenseTermsId</code>. For commercial flavors the mint is the <b>payment</b> —
            the fee flows from the buyer&apos;s wallet via WIP. The returned token id is the proof
            the buyer holds the license; pass it as <code>accessAuxData</code> to read a
            license-gated CDR vault.
          </>
        ),
        importLine: 'import { useMintLicenseToken } from "@cdr-kit/react"',
        sections: [
          { id: "signature", title: "Signature", content: <CodePanel title="type" language="ts" code={SIG} /> },
          { id: "example", title: "Example", content: <CodePanel title="tsx" language="tsx" code={EXAMPLE} /> },
          {
            id: "wip",
            title: "WIP wrap + approval",
            content: (
              <p>
                Commercial PIL flavors charge in WIP (the ERC-20 wrap of native IP). Before
                <code>mint</code> succeeds, the buyer wallet needs (1) enough WIP to cover the
                fee × amount and (2) an allowance for the RoyaltyModule. Call <code>agent.wrapIp</code>{" "}
                + <code>agent.approveWip</code> in the buyer flow, or wire matching hooks if you
                build them in your dashboard.
              </p>
            ),
          },
          {
            id: "maxfee",
            title: "Always set maxMintingFee",
            content: (
              <p>
                Default <code>maxMintingFee</code> is <code>0n</code> — which means commercial
                mints will revert! Pass the buyer-facing price you displayed in the UI to cap the
                exposure if the seller changes the fee mid-tx.
              </p>
            ),
          },
        ],
        prev: { href: "/docs/hooks/use-register-ip", label: "useRegisterIp" },
        next: { href: "/docs/hooks/use-attach-license-terms", label: "useAttachLicenseTerms" },
      }}
    />
  );
}
