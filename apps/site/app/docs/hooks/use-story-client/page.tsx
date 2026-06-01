import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const SIG = `function useStoryClient(chainId?: number): StoryClient | undefined;`;

const EXAMPLE = `import { useStoryClient } from "@cdr-kit/react";

function Publish() {
  const client = useStoryClient();              // bound to the connected wagmi wallet
  if (!client) return <p>connect a wallet to publish</p>;
  // client is the StoryClient from @story-protocol/core-sdk —
  // pass it to useRegisterIp, useMintLicenseToken, etc.
  return <RegisterButton client={client} />;
}`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useStoryClient"],
        title: "useStoryClient",
        badges: (
          <>
            <Badge tone="primary">hook</Badge>
            <Badge>new in 0.5</Badge>
            <Badge>Story IP</Badge>
          </>
        ),
        lede: (
          <>
            Lazy-load and memoize a <code>StoryClient</code> from <code>@story-protocol/core-sdk</code>{" "}
            bound to the connected wagmi wallet. Returns <code>undefined</code> until the wallet
            connects and the lazy import resolves. Pair with <code>useRegisterIp</code>,{" "}
            <code>useMintLicenseToken</code>, <code>useAttachLicenseTerms</code>, or any other Story
            SDK call.
          </>
        ),
        importLine: 'import { useStoryClient } from "@cdr-kit/react"',
        sections: [
          {
            id: "signature",
            title: "Signature",
            content: <CodePanel title="type" language="ts" code={SIG} />,
          },
          {
            id: "example",
            title: "Example",
            content: <CodePanel title="tsx" language="tsx" code={EXAMPLE} />,
          },
          {
            id: "lazy",
            title: "Lazy-loaded peer dep",
            content: (
              <p>
                <code>@cdr-kit/story</code> is an optional peer dep on <code>@cdr-kit/react</code>{" "}
                — the hook does a dynamic <code>import(&quot;@cdr-kit/story&quot;)</code> on first
                call, so dashboards that never publish IP don&apos;t pay the bundle cost. If the
                peer dep isn&apos;t installed, the hook throws with a clear install hint.
              </p>
            ),
          },
          {
            id: "chain",
            title: "Custom chain",
            content: (
              <p>
                The default <code>chainId</code> is 1315 (Story Aeneid). Pass an explicit value to
                bind the client to a different chain (e.g. Story mainnet once it ships).
              </p>
            ),
          },
        ],
        prev: { href: "/docs/hooks/use-storage-backend", label: "useStorageBackend" },
        next: { href: "/docs/hooks/use-register-ip", label: "useRegisterIp" },
      }}
    />
  );
}
