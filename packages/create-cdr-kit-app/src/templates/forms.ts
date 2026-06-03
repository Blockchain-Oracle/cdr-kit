import { dedent } from "../util.js";
import {
  ENV_LOCAL_EXAMPLE,
  GITIGNORE,
  NEXT_CONFIG_TS,
  NEXT_ENV_DTS,
  PROVIDERS_TSX,
  SHARED_DEPS,
  SHARED_DEV_DEPS,
  THEME_INIT_SCRIPT,
  TSCONFIG_JSON,
} from "./shared.js";
import type { Template } from "./types.js";

/**
 * Encrypted forms template — `@cdr-kit/forms` end-to-end. Builder side stores a
 * platform-wallet-signed CDR vault per submission; respondent side never holds
 * a wallet. Provider picker lets builders pick which storage backend the
 * encrypted blob lands in (Pinata / Storacha / Supabase / IPFS / CDR gateway).
 */
export const FORMS: Template = {
  name: "forms",
  description:
    "Encrypted forms — CdrForm + StorageProviderPicker, server stores per-submission CDR vault on Aeneid.",
  postInstall: [
    "pnpm install",
    "cp .env.local.example .env.local",
    "# add a funded Aeneid WALLET_PRIVATE_KEY",
    "pnpm dev   # http://localhost:3000",
  ],
  files: [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: "cdr-kit-forms",
          private: true,
          version: "0.0.1",
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
            lint: "next lint",
          },
          dependencies: {
            ...SHARED_DEPS,
            "@cdr-kit/agent": "^0.7.0",
            "@cdr-kit/forms": "^0.7.0",
          },
          devDependencies: SHARED_DEV_DEPS,
        },
        null,
        2,
      ),
    },
    { path: "tsconfig.json", content: TSCONFIG_JSON },
    { path: "next.config.ts", content: NEXT_CONFIG_TS },
    { path: "next-env.d.ts", content: NEXT_ENV_DTS },
    {
      path: "app/layout.tsx",
      content: dedent(`
        import type { ReactNode } from "react";
        import { Providers } from "./providers";
        import { FormHeader } from "./header";
        import "@cdr-kit/react-ui/styles.css";
        import "@cdr-kit/forms/styles.css";
        import "./globals.css";

        export const metadata = {
          title: "Encrypted forms · cdr-kit",
          description: "Submit encrypted forms to CDR on Aeneid. Only the creator can decrypt.",
        };

        export default function RootLayout({ children }: { children: ReactNode }) {
          return (
            <html lang="en" data-theme="dark" suppressHydrationWarning>
              <head>
                ${THEME_INIT_SCRIPT}
              </head>
              <body>
                <Providers>
                  <FormHeader />
                  <main>{children}</main>
                </Providers>
              </body>
            </html>
          );
        }
      `),
    },
    { path: "app/providers.tsx", content: PROVIDERS_TSX },
    {
      path: "app/header.tsx",
      content: dedent(`
        "use client";

        import Link from "next/link";
        import { ConnectButton } from "@rainbow-me/rainbowkit";
        import { CdrNetworkChip } from "@cdr-kit/react-ui";

        export function FormHeader() {
          return (
            <header className="site-header">
              <div className="brand">
                <span className="brand-dot" aria-hidden />
                <span>forms.cdr</span>
              </div>
              <nav className="header-nav">
                <Link href="/">Respond</Link>
                <Link href="/results">Results</Link>
              </nav>
              <div className="header-actions">
                <CdrNetworkChip />
                <ConnectButton accountStatus="address" chainStatus="icon" />
              </div>
            </header>
          );
        }
      `),
    },
    {
      path: "app/page.tsx",
      content: dedent(`
        "use client";

        import { useState } from "react";
        import { CdrForm, CdrField, CdrSubmitButton, StorageProviderPicker, type StorageProviderId } from "@cdr-kit/forms";

        async function encryptOnServer(fields: Record<string, unknown>, providerId: StorageProviderId): Promise<number> {
          const res = await fetch("/api/respond", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ fields, providerId }),
          });
          if (!res.ok) throw new Error(\`submit failed: \${res.status}\`);
          const data = await res.json();
          return data.vaultId as number;
        }

        export default function Page() {
          const [provider, setProvider] = useState<StorageProviderId>("cdr");

          return (
            <section className="form-stage">
              <article className="form-card">
                <p className="eyebrow">survey · encrypted on-chain</p>
                <h1 className="form-title">How was your week?</h1>
                <p className="form-lede">
                  Your answers are encrypted client-to-server, written to a fresh CDR vault on
                  Aeneid, and only the form creator can decrypt. No wallet required to submit.
                </p>

                <div className="picker-section">
                  <p className="picker-label">Where should encrypted blobs land?</p>
                  <StorageProviderPicker value={provider} onChange={setProvider} />
                </div>

                <CdrForm
                  onEncrypt={(fields) => encryptOnServer(fields, provider)}
                  onSuccess={(uuid) => console.info(\`stored at vault \${uuid}\`)}
                >
                  <CdrField name="mood" label="Mood (1–10)" type="number" required />
                  <CdrField name="highlight" label="Highlight of the week" type="text" placeholder="What stood out?" required />
                  <CdrField name="notes" label="Anything else?" type="textarea" placeholder="Optional" />
                  <CdrSubmitButton>Submit securely</CdrSubmitButton>
                </CdrForm>
              </article>
            </section>
          );
        }
      `),
    },
    {
      path: "app/results/page.tsx",
      content: dedent(`
        "use client";

        import { useEffect, useState } from "react";

        interface Submission {
          vaultId: number;
          fields: Record<string, unknown>;
          submittedAt: string;
        }

        export default function ResultsPage() {
          const [items, setItems] = useState<Submission[]>([]);
          const [loading, setLoading] = useState(true);
          const [error, setError] = useState<string | null>(null);

          useEffect(() => {
            (async () => {
              try {
                const r = await fetch("/api/results");
                if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
                const j = await r.json();
                setItems(j.items ?? []);
              } catch (e) {
                setError(String((e as Error).message ?? e));
              } finally {
                setLoading(false);
              }
            })();
          }, []);

          return (
            <section className="form-stage">
              <article className="form-card">
                <h1 className="form-title">Decrypted submissions</h1>
                <p className="form-lede">
                  Pulled from each per-submission CDR vault and decrypted with the platform wallet
                  private key (server-side only).
                </p>
                {loading && <p>Loading…</p>}
                {error && <p style={{ color: "salmon" }}>error: {error}</p>}
                {!loading && !error && items.length === 0 && <p>No submissions yet.</p>}
                <ol className="result-list">
                  {items.map((it) => (
                    <li key={it.vaultId} className="result-item">
                      <div className="result-meta">
                        <span className="result-vault">vault #{it.vaultId}</span>
                        <span className="result-date">{new Date(it.submittedAt).toLocaleString()}</span>
                      </div>
                      <pre className="result-fields">{JSON.stringify(it.fields, null, 2)}</pre>
                    </li>
                  ))}
                </ol>
              </article>
            </section>
          );
        }
      `),
    },
    {
      path: "app/api/respond/route.ts",
      content: dedent(`
        import { NextResponse } from "next/server";
        import { storeFormSubmission } from "@cdr-kit/forms/server";

        /** Platform-wallet pattern: respondent never holds a wallet. The server signs
         *  every submission with its own funded Aeneid key. */
        export async function POST(req: Request) {
          const pk = process.env.WALLET_PRIVATE_KEY as \`0x\${string}\` | undefined;
          if (!pk) {
            return NextResponse.json({ error: "Server missing WALLET_PRIVATE_KEY" }, { status: 500 });
          }

          const { fields } = await req.json();
          try {
            const { vaultId } = await storeFormSubmission(fields, {
              privateKey: pk,
              rpcUrl: "https://aeneid.storyrpc.io",
            });

            // In production, also persist { vaultId, submittedAt } in your DB
            // alongside the form id so /api/results can list them later.
            return NextResponse.json({ vaultId });
          } catch (e) {
            return NextResponse.json({ error: String((e as Error).message ?? e) }, { status: 500 });
          }
        }
      `),
    },
    {
      path: "app/api/results/route.ts",
      content: dedent(`
        import { NextResponse } from "next/server";
        import { readFormSubmission } from "@cdr-kit/forms/server";

        /** Demo: decrypts known sample vault IDs. In production you'd pull this
         *  list from your DB (the IDs you stored from /api/respond) for the
         *  authenticated form creator only. */
        const SAMPLE_VAULT_IDS: number[] = [];

        export async function GET() {
          const pk = process.env.WALLET_PRIVATE_KEY as \`0x\${string}\` | undefined;
          if (!pk) {
            return NextResponse.json({ error: "Server missing WALLET_PRIVATE_KEY" }, { status: 500 });
          }

          const items = await Promise.all(
            SAMPLE_VAULT_IDS.map(async (vaultId) => {
              const { fields, submittedAt } = await readFormSubmission(vaultId, {
                privateKey: pk,
                rpcUrl: "https://aeneid.storyrpc.io",
              });
              return { vaultId, fields, submittedAt };
            }),
          );

          return NextResponse.json({ items });
        }
      `),
    },
    {
      path: "app/globals.css",
      content: dedent(`
        :root { color-scheme: dark light; }
        * { box-sizing: border-box; }
        html { background: var(--cdr-ui-bg, oklch(13% 0.012 90)); }
        body {
          margin: 0;
          font-family: var(--cdr-ui-font-sans, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif);
          background: var(--cdr-ui-bg, oklch(13% 0.012 90));
          color: var(--cdr-ui-fg, oklch(94% 0.01 90));
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }
        a { color: var(--cdr-ui-primary, oklch(78% 0.16 70)); text-decoration: none; }
        a:hover { text-decoration: underline; }

        .site-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 28px;
          border-bottom: 1px solid var(--cdr-ui-border, oklch(22% 0.012 90));
          backdrop-filter: blur(8px);
          position: sticky; top: 0; z-index: 10;
          background: color-mix(in oklab, var(--cdr-ui-bg) 80%, transparent);
        }
        .brand { display: flex; align-items: center; gap: 10px; font-weight: 600; font-family: ui-monospace, monospace; }
        .brand-dot { width: 10px; height: 10px; border-radius: 999px; background: linear-gradient(135deg, oklch(78% 0.16 70), oklch(72% 0.20 30)); }
        .header-nav { display: flex; gap: 22px; font-size: 0.92rem; color: var(--cdr-ui-muted, oklch(68% 0.01 90)); }
        .header-actions { display: flex; align-items: center; gap: 14px; }

        .form-stage { padding: 56px 24px; display: grid; place-items: start center; }
        .form-card {
          width: 100%; max-width: 640px;
          background: color-mix(in oklab, var(--cdr-ui-surface, oklch(17% 0.012 90)) 92%, transparent);
          border: 1px solid var(--cdr-ui-border, oklch(24% 0.012 90));
          border-radius: 18px;
          padding: 36px 32px 32px;
          box-shadow: 0 1px 0 color-mix(in oklab, oklch(100% 0 0) 5%, transparent) inset, 0 24px 48px -24px color-mix(in oklab, oklch(0% 0 0) 50%, transparent);
        }
        .eyebrow { font-family: ui-monospace, monospace; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--cdr-ui-accent, oklch(78% 0.16 70)); margin: 0 0 10px; }
        .form-title {
          font-size: clamp(1.8rem, 3.4vw, 2.4rem); font-weight: 800; letter-spacing: -0.025em; line-height: 1.1; margin: 0 0 12px;
          background: linear-gradient(135deg, var(--cdr-ui-fg, #fafafa), color-mix(in oklab, var(--cdr-ui-fg) 60%, var(--cdr-ui-primary, oklch(78% 0.16 70))));
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .form-lede { font-size: 0.98rem; line-height: 1.6; color: var(--cdr-ui-muted, oklch(72% 0.01 90)); margin: 0 0 28px; }
        .picker-section { margin: 0 0 24px; padding-bottom: 24px; border-bottom: 1px dashed var(--cdr-ui-border); }
        .picker-label { font-size: 0.86rem; color: var(--cdr-ui-muted); margin: 0 0 12px; }

        .result-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 16px; }
        .result-item {
          padding: 14px 16px;
          background: color-mix(in oklab, var(--cdr-ui-bg) 60%, transparent);
          border: 1px solid var(--cdr-ui-border);
          border-radius: 12px;
        }
        .result-meta { display: flex; justify-content: space-between; font-family: ui-monospace, monospace; font-size: 0.78rem; color: var(--cdr-ui-muted); margin: 0 0 8px; }
        .result-vault { color: var(--cdr-ui-primary); }
        .result-fields {
          margin: 0; padding: 12px; border-radius: 8px;
          background: color-mix(in oklab, oklch(0% 0 0) 50%, transparent);
          font-family: ui-monospace, monospace; font-size: 0.82rem; line-height: 1.5;
          overflow-x: auto;
        }
      `),
    },
    {
      path: "README.md",
      content: dedent(`
        # cdr-kit forms

        End-to-end encrypted form submissions on Story Aeneid. Built on
        [\`@cdr-kit/forms\`](https://cdr-kit.dev/docs/forms).

        \`\`\`bash
        pnpm install
        cp .env.local.example .env.local      # add WALLET_PRIVATE_KEY=0x...
        pnpm dev                              # http://localhost:3000
        \`\`\`

        ## How it works

        - The respondent fills \`<CdrField>\`s and clicks \`<CdrSubmitButton>\`.
        - \`<CdrForm onEncrypt={...}>\` posts the fields to \`/api/respond\`.
        - The route calls \`storeFormSubmission()\` from \`@cdr-kit/forms/server\`,
          which signs with the platform wallet (your \`WALLET_PRIVATE_KEY\`) and
          allocates a fresh CDR vault per submission.
        - The vault UUID is returned; persist it to your DB alongside the form ID.
        - The creator decrypts via \`readFormSubmission()\` from the same server module.

        Respondents **never hold a wallet**. Gas + signature is the platform's burden.

        ## Picking a storage provider

        \`<StorageProviderPicker>\` lets a form builder pick where the encrypted
        blob lands — Pinata, Storacha (Filecoin), Supabase Storage, self-hosted
        IPFS / Helia, or the default CDR Gateway. The picker emits a
        \`StorageProviderId\`; wire it into the server route to swap backends.

        Full docs: <https://cdr-kit.dev/docs/forms>
      `),
    },
    { path: ".gitignore", content: GITIGNORE },
    { path: ".env.local.example", content: ENV_LOCAL_EXAMPLE },
  ],
};
