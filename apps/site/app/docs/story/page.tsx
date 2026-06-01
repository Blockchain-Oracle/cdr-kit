import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const PUBLISH_CODE = `import { CdrAgent } from "@cdr-kit/agent";
import { PILFlavor } from "@cdr-kit/story";

const agent = new CdrAgent({ privateKey: process.env.CDR_PRIVATE_KEY!, network: "aeneid" });

const result = await agent.publish({
  data: new TextEncoder().encode("the secret data"),
  spgNftContract: "0xYourSpgCollection",
  pilTerms: PILFlavor.commercialUse({
    defaultMintingFee: 1_000_000_000_000_000_000n,  // 1 WIP per license
    commercialRevShare: 5,                            // 5% derivative revenue
  }),
});

// → { ipId, tokenId, licenseTermsId, vaultUuid,
//     vaultTxHash, ipRegisterTxHash, writeTxHash }`;

const BUYER_CODE = `// Buyer flow once they have { ipId, licenseTermsId, vaultUuid }:
await agent.wrapIp({ amountWei: 1_000_000_000_000_000_000n });
await agent.approveWip({ spender: ROYALTY_MODULE, amountWei: 1_000_000_000_000_000_000n });

const { licenseTokenIds } = await agent.mintLicenseTokens({
  licensorIpId: ipId,
  licenseTermsId,
  amount: 1n,
  maxMintingFee: 1_000_000_000_000_000_000n,
});

const bytes = await agent.accessLicenseGated({
  uuid: vaultUuid,
  licenseTokenId: licenseTokenIds[0]!,
});`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/story", "Overview"],
        title: "@cdr-kit/story",
        badges: <><Badge tone="primary">@cdr-kit/story</Badge><Badge>0.5</Badge></>,
        lede: <>Thin TypeScript wrappers over <code>@story-protocol/core-sdk</code>: register an IP asset, attach PIL license terms, mint license tokens, register derivatives, wrap IP into WIP. Plus the headline <code>agent.publish()</code> one-shot that collapses register-IP + attach-terms + create-license-gated-vault + write-encrypted-data into a single agent call.</>,
        importLine: 'import { PILFlavor, createStoryClient } from "@cdr-kit/story"',
        sections: [
          {
            id: "publish",
            title: "agent.publish() — the one-shot",
            content: (
              <>
                <p>Collapses 4 normally-separate Story SDK calls into a single agent method. Returns the IP / license / vault artifacts a buyer needs to subscribe + read.</p>
                <CodePanel title="ts" language="ts" code={PUBLISH_CODE} />
              </>
            ),
          },
          {
            id: "buyer",
            title: "Buyer flow",
            content: (
              <>
                <p>Once the seller publishes, share <code>{`{ ipId, licenseTermsId, vaultUuid }`}</code> with buyers (URL, QR, whatever). Buyer wraps IP → mints license token → reads vault:</p>
                <CodePanel title="ts" language="ts" code={BUYER_CODE} />
              </>
            ),
          },
          {
            id: "flavors",
            title: "PIL flavors",
            content: (
              <ul>
                <li><code>PILFlavor.nonCommercialSocialRemixing()</code> — open-source / free public IP (0 fee, 0 rev share).</li>
                <li><code>PILFlavor.commercialUse({"{ defaultMintingFee, commercialRevShare }"})</code> — paid one-off use, no derivatives.</li>
                <li><code>PILFlavor.commercialRemix({"{ defaultMintingFee, commercialRevShare }"})</code> — paid use + derivative works allowed, revenue flows back.</li>
                <li><code>PILFlavor.creativeCommonsAttribution()</code> — CC-BY style (0 fee, attribution required).</li>
              </ul>
            ),
          },
          {
            id: "individual",
            title: "Lower-level wrappers",
            content: (
              <p>If <code>publish()</code> doesn&apos;t fit, the individual wrappers stay accessible from the agent: <code>registerIpAsset</code>, <code>attachLicenseTerms</code>, <code>mintLicenseTokens</code>, <code>registerDerivative</code>, <code>registerPilTerms</code>, <code>wrapIp</code>, <code>approveWip</code>. Each is a thin <code>@story-protocol/core-sdk</code> wrapper with normalized return shapes.</p>
            ),
          },
          {
            id: "react",
            title: "React hooks",
            content: (
              <p><code>@cdr-kit/react</code> exposes <code>useStoryClient</code> (memoized client bound to the wagmi wallet), <code>useRegisterIp</code>, <code>useAttachLicenseTerms</code>, <code>useMintLicenseToken</code>, and <code>usePublish</code> (the one-shot delegator). Both <code>@cdr-kit/agent</code> and <code>@cdr-kit/story</code> are optional peer deps on the React package — pay only when you publish.</p>
            ),
          },
          {
            id: "skill",
            title: "Design skill",
            content: (
              <p>See <a href="https://github.com/Blockchain-Oracle/cdr-kit/blob/main/packages/plugin/cdr-kit/skills/design-publish-with-story/SKILL.md"><code>design-publish-with-story</code></a> SKILL.md for the decision tree on picking PIL flavor, prerequisites (SPG NFT collection), common failure modes, and the agent / CLI / MCP triangulation.</p>
            ),
          },
        ],
        prev: { href: "/docs/agent-kit", label: "Agent kit" },
        next: { href: "/docs/contracts", label: "Condition library" },
      }}
    />
  );
}
