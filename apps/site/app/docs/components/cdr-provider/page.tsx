import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";

export default function CdrProviderPage() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Components", "CdrProvider"],
        title: "CdrProvider",
        badges: <Badge tone="primary">component</Badge>,
        lede: (
          <>
            Batteries-included root provider. Wires <code>WagmiProvider</code>, react-query, and initializes the CDR
            crypto WASM. Use <code>CdrConfigProvider</code> directly if you already have your own wagmi stack
            (Privy / RainbowKit).
          </>
        ),
        importLine: 'import { CdrProvider } from "@cdr-kit/react"',
        sections: [
          {
            id: "props",
            title: "Props",
            content: (
              <PropsTable
                rows={[
                  { name: "apiUrl", type: "string", required: true, description: "Story-API REST base — keeper endpoint for partial collection." },
                  { name: "mockKit", type: "MockCdrKit", description: "Pass createMockCdrKit() for offline dev. When set, no chain/wallet is touched." },
                  { name: "config", type: "Config (wagmi)", description: "Optional wagmi config. A minimal default with an injected connector ships if omitted." },
                  { name: "queryClient", type: "QueryClient", description: "Optional TanStack Query client." },
                  { name: "appearance", type: "CdrAppearance", description: "CSS custom properties applied to the cdr-kit root (see Theming)." },
                ]}
              />
            ),
          },
        ],
        prev: { href: "/docs/theming", label: "Theming" },
        next: { href: "/docs/components/vault-gate", label: "VaultGate" },
      }}
    />
  );
}
