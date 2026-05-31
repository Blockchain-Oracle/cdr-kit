import { Badge } from "@/components/primitives/badge";
import { Breadcrumb, Callout, DocTitle, H2, PrevNext, PropsTable } from "@/components/docs/parts";
import { Demo } from "@/components/docs/demo";
import { CodePanel } from "@/components/docs/code-panel";
import { Toc } from "@/components/docs/toc";
import { VaultGateDemo } from "@/components/docs/demos/vault-gate-demo";

const CODE = `import { CdrProvider, VaultGate } from "@cdr-kit/react";
import { createMockCdrKit } from "@cdr-kit/core";

export function SignalCard() {
  return (
    <CdrProvider mockKit={createMockCdrKit()}>
      <VaultGate
        uuid={4200}
        fallback={<SubscribeButton price="5 $IP" />}
        loading={<CdrSkeleton lines={3} />}>
        {(data) => <pre>{new TextDecoder().decode(data)}</pre>}
      </VaultGate>
    </CdrProvider>
  );
}`;

const TOC = [
  { id: "preview", label: "Live preview" },
  { id: "usage", label: "Usage" },
  { id: "props", label: "Props" },
  { id: "states", label: "States" },
  { id: "mock", label: "Mock mode" },
];

export default function VaultGatePage() {
  return (
    <>
      <main className="doc">
        <Breadcrumb parts={["@cdr-kit/react", "Components", "VaultGate"]} />
        <DocTitle
          title="VaultGate"
          badges={
            <>
              <Badge tone="primary">component</Badge>
              <Badge>mock-ready</Badge>
            </>
          }
        />
        <p className="doc-lede">
          A declarative gate. Wrap it around the data you want to protect; it checks the vault&apos;s on-chain read condition,
          collects key shares, and renders the <b>decrypted bytes</b> via a render-prop once access is granted.
        </p>
        <div className="doc-imports">
          <span className="badge mono">import {`{ VaultGate }`} from &quot;@cdr-kit/react&quot;</span>
        </div>

        <Callout>
          <b>Mock by default.</b> Every example on this page runs against an in-memory CDR — no wallet, no chain, no testnet
          funds. Swap <code>mockKit</code> for <code>config</code> + <code>apiUrl</code> to go live on Aeneid.
        </Callout>

        <H2 id="preview">Live preview</H2>
        <p>
          Press subscribe to run the full mock flow — condition check, payment, threshold key-share collection, and local
          decryption. It mirrors the real 2-step <code>subscribeAndAccess</code> path against the actual{" "}
          <code>createMockCdrKit()</code> from <code>@cdr-kit/core</code>.
        </p>
        <Demo preview={<VaultGateDemo />} code={CODE} badge={<Badge>mock kit</Badge>} />

        <H2 id="usage">Usage</H2>
        <p>
          The simplest gate: pass a <code>uuid</code> and a render-prop. With <code>auto</code>, <code>VaultGate</code>{" "}
          requests access on mount; without it, it waits for an imperative trigger from the access hook.
        </p>
        <CodePanel title="SignalCard.tsx" code={`<VaultGate uuid={4200} auto fallback={<SubscribeButton />}>
  {(data) => <SignalView bytes={data} />}
</VaultGate>`} />

        <H2 id="props">Props</H2>
        <PropsTable
          rows={[
            {
              name: "uuid",
              type: "number",
              required: true,
              description: (
                <>
                  The CDR vault id. Read it from the <code>VaultCreated</code> event — never predict it (it&apos;s a global
                  counter).
                </>
              ),
            },
            {
              name: "children",
              type: "(data: Uint8Array) => ReactNode",
              required: true,
              description: "Render-prop called with the decrypted bytes once the condition is satisfied.",
            },
            {
              name: "auto",
              type: "boolean",
              defaultValue: "false",
              description: "Request access on mount instead of waiting for an imperative trigger.",
            },
            {
              name: "fallback",
              type: "ReactNode",
              defaultValue: "null",
              description: "Rendered while the condition is unmet — typically your subscribe / pay button.",
            },
            {
              name: "loading",
              type: "ReactNode",
              defaultValue: "<CdrSkeleton/>",
              description: "Rendered during the ~15s threshold read while key shares are collected.",
            },
            {
              name: "accessAuxData",
              type: "Hex",
              defaultValue: '"0x"',
              description: (
                <>
                  Optional ABI-encoded auxiliary data passed to the read condition (e.g. a tier-gate license tokenId).
                </>
              ),
            },
          ]}
        />

        <H2 id="states">States</H2>
        <p>
          <code>VaultGate</code> is a thin wrapper over <code>useAccessVault</code>, whose discriminated{" "}
          <code>status</code> drives what renders:
        </p>
        <ul>
          <li>
            <code>idle</code> / <code>error</code> — condition unmet → renders <code>fallback</code>.
          </li>
          <li>
            <code>collecting-partials</code> — collecting key shares (the ~15s read) → renders <code>loading</code>.
          </li>
          <li>
            <code>ready</code> — threshold met, decrypted → renders <code>children(data)</code>.
          </li>
        </ul>

        <H2 id="mock">Mock mode</H2>
        <p>
          Wrap your tree in a <code>CdrProvider</code> with a <code>createMockCdrKit()</code> and the entire component
          surface works with zero chain dependencies — ideal for Storybook, tests, and the previews on this page. Going
          live is a one-line swap:
        </p>
        <CodePanel title="provider.tsx" code={`// local / tests — no wallet, no chain
<CdrProvider mockKit={createMockCdrKit()}> … </CdrProvider>

// live on Aeneid — same children, real round-trip
<CdrProvider config={wagmiConfig} apiUrl={apiUrl}> … </CdrProvider>`} />

        <PrevNext
          prev={{ href: "/docs/components/cdr-provider", label: "CdrProvider" }}
          next={{ href: "/docs/components/vault", label: "Vault compound" }}
        />
      </main>
      <Toc items={TOC} />
    </>
  );
}
