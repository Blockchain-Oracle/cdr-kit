import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useCdrWallet"],
        title: "useCdrWallet",
        badges: <Badge tone="primary">hook</Badge>,
        lede: <>Lightweight wallet connect for the simple path: pairs with <code>&lt;CdrProvider&gt;</code>&apos;s built-in injected connector. Bring your own wallet stack (Privy / RainbowKit) for the rich path.</>,
        importLine: 'import { useCdrWallet } from "@cdr-kit/react"',
        sections: [{ id: "signature", title: "Signature", content: <CodePanel title="type" language="ts" code={`function useCdrWallet(): {
  address?: Hex;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
};`} /> }],
        prev: { href: "/docs/hooks/use-creator-vaults", label: "useCreatorVaults" },
        next: { href: "/docs/agent-kit", label: "Agent kit" },
      }}
    />
  );
}
