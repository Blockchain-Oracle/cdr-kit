import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const SIG = `function useRegisterIp(client: StoryClient | undefined): {
  registerIp: (params: {
    spgNftContract: Hex;
    recipient?: Hex;
    ipMetadataURI?: string;
    ipMetadataHash?: Hex;
  }) => Promise<{ ipId: Hex; tokenId: bigint; txHash: Hex }>;
  isLoading: boolean;
  error?: Error;
};`;

const EXAMPLE = `import { useStoryClient, useRegisterIp } from "@cdr-kit/react";

function RegisterButton() {
  const client = useStoryClient();
  const { registerIp, isLoading, error } = useRegisterIp(client);
  return (
    <button
      disabled={!client || isLoading}
      onClick={async () => {
        const { ipId, tokenId } = await registerIp({
          spgNftContract: "0xYourSpgCollection",
          ipMetadataURI: "ipfs://bafy...",
        });
        console.log("registered IP", ipId, "tokenId", tokenId);
      }}
    >
      {isLoading ? "registering…" : "register IP"}
    </button>
  );
}`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useRegisterIp"],
        title: "useRegisterIp",
        badges: (
          <>
            <Badge tone="primary">hook</Badge>
            <Badge>new in 0.5</Badge>
            <Badge>Story IP</Badge>
          </>
        ),
        lede: (
          <>
            Mint a fresh NFT (via your SPG collection) and register it as a Story IP asset in a
            single tx. Pair with <code>useAttachLicenseTerms</code> to make the IP licensable, then{" "}
            <code>useMintLicenseToken</code> on the buyer side.
          </>
        ),
        importLine: 'import { useRegisterIp } from "@cdr-kit/react"',
        sections: [
          { id: "signature", title: "Signature", content: <CodePanel title="type" language="ts" code={SIG} /> },
          { id: "example", title: "Example", content: <CodePanel title="tsx" language="tsx" code={EXAMPLE} /> },
          {
            id: "prereq",
            title: "Prerequisites",
            content: (
              <p>
                You need an existing SPG NFT collection. Create one via Story&apos;s registration
                workflows (<code>registrationWorkflows.createCollection</code>) or use a previously
                deployed collection address. The connected wallet must be allowed to mint into it.
              </p>
            ),
          },
        ],
        prev: { href: "/docs/hooks/use-story-client", label: "useStoryClient" },
        next: { href: "/docs/hooks/use-mint-license-token", label: "useMintLicenseToken" },
      }}
    />
  );
}
