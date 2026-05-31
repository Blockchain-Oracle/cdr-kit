import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const PROVIDER_CODE = `import { CdrProvider } from "@cdr-kit/react";
import { wagmiConfig } from "./wagmi";

export function App({ children }) {
  return (
    <CdrProvider config={wagmiConfig} apiUrl={process.env.NEXT_PUBLIC_CDR_API_URL!}>
      {children}
    </CdrProvider>
  );
}`;

const GATE_CODE = `import { VaultGate } from "@cdr-kit/react";

export function SignalCard() {
  return (
    <VaultGate uuid={4200} auto fallback={<SubscribeButton />}>
      {(data) => <pre>{new TextDecoder().decode(data)}</pre>}
    </VaultGate>
  );
}`;

export default function QuickstartPage() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit", "Getting started", "Quickstart"],
        title: "Quickstart",
        badges: <Badge tone="primary">≈ 60 seconds</Badge>,
        lede: <>Install the React layer, wrap your app in a provider, drop in a <code>&lt;VaultGate&gt;</code>. That&apos;s it.</>,
        sections: [
          {
            id: "install",
            title: "Install",
            content: <CodePanel title="terminal" language="bash" code="$ pnpm add @cdr-kit/react @cdr-kit/core wagmi viem" />,
          },
          {
            id: "provider",
            title: "Wrap in <CdrProvider>",
            content: (
              <>
                <p>
                  <code>&lt;CdrProvider&gt;</code> wires <code>WagmiProvider</code>, react-query, and initializes the CDR
                  crypto WASM. Pass <code>config</code> + <code>apiUrl</code> for live mode, or <code>mockKit</code> for
                  offline dev.
                </p>
                <CodePanel title="App.tsx" code={PROVIDER_CODE} />
              </>
            ),
          },
          {
            id: "gate",
            title: "Gate your data",
            content: (
              <>
                <p>
                  <code>&lt;VaultGate&gt;</code> checks the on-chain condition, collects key shares, and hands you the
                  decrypted bytes. Pass a fallback for the &quot;not yet entitled&quot; state.
                </p>
                <CodePanel title="SignalCard.tsx" code={GATE_CODE} />
              </>
            ),
          },
          {
            id: "scaffold",
            title: "Or scaffold a starter",
            content: <CodePanel title="terminal" language="bash" code="$ npm create cdr-kit" />,
          },
        ],
        prev: { href: "/docs", label: "Introduction" },
        next: { href: "/docs/theming", label: "Theming" },
      }}
    />
  );
}
