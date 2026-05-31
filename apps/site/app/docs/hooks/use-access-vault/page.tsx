import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const SIG = `function useAccessVault(uuid: number): {
  access: (accessAuxData?: Hex) => Promise<Uint8Array>;
  status: "idle" | "collecting-partials" | "ready" | "error";
  data?: Uint8Array;
  error?: CdrError;
  progress?: { collected: number; threshold: number };  // mock-mode only
};`;

export default function UseAccessVaultPage() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useAccessVault"],
        title: "useAccessVault",
        badges: <Badge tone="primary">hook</Badge>,
        lede: <>Imperative access to one vault. Returns a discriminated status + the decrypted bytes when ready. The state machine behind <code>&lt;VaultGate&gt;</code> and <code>&lt;Vault&gt;</code>.</>,
        importLine: 'import { useAccessVault } from "@cdr-kit/react"',
        sections: [
          {
            id: "signature",
            title: "Signature",
            content: <CodePanel title="type" code={SIG} language="ts" />,
          },
          {
            id: "states",
            title: "States",
            content: (
              <ul>
                <li><code>idle</code> — initial; call <code>access()</code> to begin.</li>
                <li><code>collecting-partials</code> — the ~15s threshold read.</li>
                <li><code>ready</code> — <code>data</code> populated.</li>
                <li><code>error</code> — see <code>error</code> for the typed reason.</li>
              </ul>
            ),
          },
        ],
        prev: { href: "/docs/components/empty-vaults", label: "EmptyVaults" },
        next: { href: "/docs/hooks/use-subscribe-and-access", label: "useSubscribeAndAccess" },
      }}
    />
  );
}
