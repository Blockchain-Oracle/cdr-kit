import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const SIG = `function usePublish(): {
  publish: (
    agent: { publish: (p: PublishParams) => Promise<PublishResult> },
    params: PublishParams,
  ) => Promise<PublishResult>;
  isLoading: boolean;
  error?: Error;
  result?: PublishResult;
};

interface PublishParams {
  data: Uint8Array;
  spgNftContract: Hex;
  pilTerms: unknown;        // PILFlavor.commercialUse({...}) etc.
  ipMetadata?: { ipMetadataURI?: string; ipMetadataHash?: Hex; nftMetadataURI?: string; nftMetadataHash?: Hex; };
}

interface PublishResult {
  ipId: Hex;
  tokenId: bigint;
  licenseTermsId: bigint;
  vaultUuid: number;
  vaultTxHash: Hex;
  ipRegisterTxHash: Hex;
  writeTxHash: Hex;
}`;

const EXAMPLE = `import { CdrAgent } from "@cdr-kit/agent";
import { PILFlavor } from "@cdr-kit/story";
import { usePublish } from "@cdr-kit/react";
import { useAccount, useWalletClient } from "wagmi";

function PublishButton({ secret }: { secret: string }) {
  const { data: walletClient } = useWalletClient();
  const { publish, isLoading, result, error } = usePublish();

  const onClick = async () => {
    if (!walletClient) return;
    const agent = new CdrAgent({
      privateKey: "0x...", // server-side; in browser, pass walletClient.account
      network: "aeneid",
    });
    await publish(agent, {
      data: new TextEncoder().encode(secret),
      spgNftContract: "0xYourSpgCollection",
      pilTerms: PILFlavor.commercialUse({
        defaultMintingFee: 1_000_000_000_000_000_000n,
        commercialRevShare: 5,
      }),
    });
  };

  return (
    <>
      <button disabled={isLoading} onClick={onClick}>
        {isLoading ? "publishing…" : "publish + license-gate"}
      </button>
      {result && (
        <pre>
{\`ipId:          \${result.ipId}
licenseTermsId: \${result.licenseTermsId}
vaultUuid:      \${result.vaultUuid}\`}
        </pre>
      )}
      {error && <span>{error.message}</span>}
    </>
  );
}`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "usePublish"],
        title: "usePublish",
        badges: (
          <>
            <Badge tone="primary">hook</Badge>
            <Badge>new in 0.5</Badge>
            <Badge>one-shot</Badge>
            <Badge>Story IP</Badge>
          </>
        ),
        lede: (
          <>
            Render-side wrapper for <code>agent.publish()</code> — the agent-as-publisher one-shot
            that collapses register-IP + register-PIL-terms + attach-terms + create-license-gated-vault
            + write-encrypted-data into a single call. Returns every artifact the buyer needs to
            subscribe + read.
          </>
        ),
        importLine: 'import { usePublish } from "@cdr-kit/react"',
        sections: [
          { id: "signature", title: "Signature", content: <CodePanel title="type" language="ts" code={SIG} /> },
          { id: "example", title: "Example", content: <CodePanel title="tsx" language="tsx" code={EXAMPLE} /> },
          {
            id: "agent-required",
            title: "Why does it take an `agent` argument?",
            content: (
              <p>
                <code>agent.publish()</code> needs a wallet client + private key for the
                multi-step orchestration (4 contract writes across IP-registry, PIL-template,
                CDR-precompile). The React hook stays headless — you construct the{" "}
                <code>CdrAgent</code> however your app does (server-side env, browser RPC over the
                connected wallet) and the hook handles loading/error/result state around it.
              </p>
            ),
          },
          {
            id: "buyer",
            title: "Buyer flow",
            content: (
              <p>
                After <code>publish</code> resolves, share <code>{`{ ipId, licenseTermsId, vaultUuid }`}</code>{" "}
                with the buyer (URL param, QR, on-chain event). They call <code>agent.wrapIp</code> →{" "}
                <code>agent.approveWip</code> → <code>useMintLicenseToken.mint</code> →{" "}
                <code>agent.accessLicenseGated</code> to pay + decrypt. See{" "}
                <a href="/docs/story#buyer">/docs/story</a> for the full buyer code.
              </p>
            ),
          },
        ],
        prev: { href: "/docs/hooks/use-attach-license-terms", label: "useAttachLicenseTerms" },
        next: { href: "/docs/storage", label: "Storage adapters" },
      }}
    />
  );
}
