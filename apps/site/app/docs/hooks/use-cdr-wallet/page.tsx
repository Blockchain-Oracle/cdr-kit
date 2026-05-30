import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useCdrWallet"],
        title: "useCdrWallet",
        badges: <Badge tone="primary">hook</Badge>,
        lede: <>Lightweight wallet connect for the simple path: pairs with <code>&lt;CdrProvider&gt;</code>&apos;s built-in injected connector. Bring your own wallet stack (Privy / RainbowKit) for the rich path.</>,
        importLine: 'import { useCdrWallet } from "@cdr-kit/react"',
        sections: [{ id: "signature", title: "Signature", content: <div className="win doc-code"><div className="win-bar"><span className="lights"><i /><i /><i /></span><span className="win-title">type</span></div><div className="code"><pre><code>{`function useCdrWallet(): {
  address?: Hex;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
};`}</code></pre></div></div> }],
        prev: { href: "/docs/hooks/use-creator-vaults", label: "useCreatorVaults" },
        next: { href: "/docs/agent-kit", label: "Agent kit" },
      }}
    />
  );
}
