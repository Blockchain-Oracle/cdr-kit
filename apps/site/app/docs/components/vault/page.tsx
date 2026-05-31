import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const CODE = `<Vault uuid={4200} auto>
  <Vault.Locked>   <SubscribeButton /> </Vault.Locked>
  <Vault.Loading>  <CdrSkeleton lines={3} /> </Vault.Loading>
  <Vault.Unlocked> {(data) => <SignalView bytes={data} />} </Vault.Unlocked>
</Vault>`;

export default function VaultCompoundPage() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Components", "Vault"],
        title: "Vault",
        badges: <><Badge tone="primary">component</Badge><Badge>compound</Badge></>,
        lede: (
          <>
            Compound component — Clerk&apos;s <code>SignedIn</code> / <code>SignedOut</code> pattern adapted to CDR. A
            single access drives the shared state; <code>Vault.Locked</code>, <code>Vault.Loading</code>, and{" "}
            <code>Vault.Unlocked</code> render against it.
          </>
        ),
        importLine: 'import { Vault } from "@cdr-kit/react"',
        sections: [
          {
            id: "usage",
            title: "Usage",
            content: (
              <CodePanel title="SignalView.tsx" code={CODE} />
            ),
          },
          {
            id: "slots",
            title: "Slots",
            content: (
              <ul>
                <li><code>Vault.Locked</code> — status is <code>idle</code> or <code>error</code>.</li>
                <li><code>Vault.Loading</code> — status is <code>paying</code> or <code>collecting-partials</code>. Optional render-prop receives <code>{`{ collected, threshold }`}</code>.</li>
                <li><code>Vault.Unlocked</code> — status is <code>ready</code>. Render-prop receives the decrypted bytes.</li>
              </ul>
            ),
          },
        ],
        prev: { href: "/docs/components/vault-gate", label: "VaultGate" },
        next: { href: "/docs/components/cdr-inspector", label: "CdrInspector" },
      }}
    />
  );
}
