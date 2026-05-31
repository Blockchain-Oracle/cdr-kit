import Link from "next/link";
import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";
import { UnlockableDemo } from "@/components/docs/demos/unlockable-demo";
import "../components.css";

const CODE = `import { CdrProvider } from "@cdr-kit/react";
import { createMockCdrKit } from "@cdr-kit/core";
import { UnlockablePill } from "@cdr-kit/react-ui";

<CdrProvider mockKit={createMockCdrKit()}>
  <p>
    Arlo Vance told the press he was alone, but{" "}
    <UnlockablePill uuid={4242} priceLabel="3 $IP">
      the woman beside him on the dock
    </UnlockablePill>{" "}
    disagrees.
  </p>
</CdrProvider>`;

const HOOK_CODE = `import { useUnlockable } from "@cdr-kit/react";

function CustomPill({ uuid }) {
  const { status, data, isOpen, open, close, request } =
    useUnlockable({ uuid, mode: "subscribe" });

  return (
    <span onClick={open}>
      [click to unlock]
      {isOpen && (
        <div role="dialog">
          {status === "ready" ? render(data) : (
            <button onClick={() => request()}>Pay 5 $IP</button>
          )}
        </div>
      )}
    </span>
  );
}`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react-ui", "Components", "Unlockable"],
        title: "<UnlockablePill>",
        badges: <><Badge tone="primary">styled</Badge><Badge>new in 0.2</Badge><Badge>mock-ready</Badge></>,
        lede: <>Inline &quot;free to read, pay to unlock&quot; paywall. Wrap any anchor text in a pill; the click opens a floating card that runs the full CDR <code>subscribe → threshold-read → decrypt</code> flow and reveals the attached payload (text, image, file) right where the pill stands.</>,
        importLine: 'import { UnlockablePill } from "@cdr-kit/react-ui"',
        callout: (
          <Link href="/showcase/blog" className="unl-doc-cta">
            <span className="unl-doc-cta-eyebrow">live showcase</span>
            <span className="unl-doc-cta-title">See &lt;UnlockablePill&gt; in a real blog post →</span>
            <span className="unl-doc-cta-sub">Five live unlocks across text, image, and prose attachments. Mock CDR — no wallet, no chain.</span>
          </Link>
        ),
        sections: [
          {
            id: "preview",
            title: "Live preview",
            content: <Demo preview={<UnlockableDemo />} code={CODE} badge={<Badge>mock kit</Badge>} />,
          },
          {
            id: "hook",
            title: "Headless variant",
            content: (
              <>
                <p>
                  Prefer to render your own UI? <code>useUnlockable</code> exposes the entire state machine — status, data, error, isOpen, open/close, request, reset. The styled <code>UnlockablePill</code> is a 60-line wrapper on top of it.
                </p>
                <Demo preview={<div style={{ padding: 18, fontSize: 13, color: "var(--ink-3)" }}>Use the hook for full control. Snippet on the Code tab.</div>} code={HOOK_CODE} language="tsx" />
              </>
            ),
          },
          {
            id: "props",
            title: "Props",
            content: (
              <PropsTable rows={[
                { name: "uuid", type: "number", required: true, description: "The CDR vault holding the encrypted attachment." },
                { name: "children", type: "ReactNode", required: true, description: "The anchor text (stays plaintext / SEO-visible — it's the teaser, not the secret)." },
                { name: "priceLabel", type: "string", defaultValue: '"5 $IP"', description: "Human-readable price shown in the unlock card." },
                { name: "mode", type: '"subscribe" | "access"', defaultValue: '"subscribe"', description: "Subscribe runs the paywall flow; access skips payment (open/tier-gate vaults where the reader already has rights)." },
                { name: "title", type: "ReactNode", defaultValue: '"Unlock to reveal"', description: "Card header title." },
                { name: "subtitle", type: "ReactNode", description: "Card header subtitle, e.g. \"1 photo · attached\"." },
                { name: "unlockedRenderer", type: "(bytes: Uint8Array) => ReactNode", defaultValue: "unlockedAuto", description: "Render the decrypted bytes. Default auto-detects PNG/JPEG/WebP/GIF, falls back to UTF-8 text, then to a download link." },
                { name: "subscriptionCondition", type: "Hex", description: "Override the default deployed SubscriptionCondition address." },
              ]} />
            ),
          },
          {
            id: "mobile",
            title: "Mobile fallback",
            content: (
              <p>
                Below 560px the floating popover collapses to a bottom-sheet — the card pins to the bottom of the viewport with a safe-area-aware inset. No additional code; the same <code>UnlockablePill</code> handles both.
              </p>
            ),
          },
          {
            id: "anchor",
            title: "The anchor is plaintext — that's intentional",
            content: (
              <>
                <p>
                  The text inside <code>&lt;UnlockablePill&gt;</code> is a public teaser. Search engines and inspect-element will see it. The <b>encrypted payload</b> is what the vault holds — an image, a file, a hidden paragraph — and that only exists in the DOM after a successful read.
                </p>
                <p>
                  This matches the onscroll.app pattern: highlighted phrases anchor the unlock UX, attached content is the secret. If you want the anchor itself to be the secret, use <code>&lt;VaultGate&gt;</code> instead.
                </p>
              </>
            ),
          },
        ],
        prev: { href: "/docs/components/subscribe-button", label: "SubscribeButton" },
        next: { href: "/docs/components/vault-card", label: "VaultCard" },
      }}
    />
  );
}
