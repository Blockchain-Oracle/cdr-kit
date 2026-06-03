import { dedent } from "../util.js";
import {
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
 * Encrypted forms template — `@cdr-kit/forms` end-to-end with a real
 * `CdrStorageProvider` adapter wired into the server route. Default adapter:
 * Pinata (single JWT env var, easiest signup). Swap to Supabase / S3 /
 * Storacha / IPFS / Helia by changing the factory call in `/api/respond/route.ts`
 * — every option is documented in comments.
 */
export const FORMS: Template = {
  name: "forms",
  description:
    "Encrypted forms — CdrForm + Pinata storage adapter, server stores per-submission CDR vault on Aeneid.",
  postInstall: [
    "pnpm install",
    "cp .env.local.example .env.local",
    "# add WALLET_PRIVATE_KEY and PINATA_JWT (or swap to another adapter)",
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

        import { CdrForm, CdrField, CdrSubmitButton } from "@cdr-kit/forms";

        async function encryptOnServer(fields: Record<string, unknown>): Promise<number> {
          const res = await fetch("/api/respond", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ fields }),
          });
          if (!res.ok) throw new Error(\`submit failed: \${res.status}\`);
          const data = await res.json();
          return data.vaultId as number;
        }

        export default function Page() {
          return (
            <section className="form-stage">
              <article className="form-card">
                <p className="eyebrow">survey · encrypted on-chain</p>
                <h1 className="form-title">How was your week?</h1>
                <p className="form-lede">
                  Your answers are encrypted server-side, uploaded to the configured storage adapter,
                  and only the form creator can decrypt. No wallet required to submit.
                </p>

                <CdrForm
                  onEncrypt={(fields) => encryptOnServer(fields)}
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
      path: "lib/storage.ts",
      content: dedent(`
        import { createPinataStorage } from "@cdr-kit/core";
        // 5 other adapters available — swap createPinataStorage(...) below for any of:
        //   createSupabaseStorage  ({ url, key, bucket })             — Postgres + S3 storage
        //   createIpfsStorage      ({ addUrl, gatewayUrl, headers? }) — any IPFS HTTP API
        //   createS3Storage        ({ endpoint, region, accessKey, secretKey, bucket }) — S3 / R2 / B2
        //   createStorachaStorage  ({ agentDelegation, spaceDid })    — web3.storage / w3up
        //   createHeliaStorage     ({ helia? })                       — self-hosted Helia node

        /**
         * Single source of truth for the storage adapter — imported by both
         * /api/respond and /api/results so writes + reads round-trip the same way.
         * Keys come from .env.local (never committed; see .env.local.example).
         */
        export function getStorage() {
          const jwt = process.env.PINATA_JWT;
          if (!jwt) {
            throw new Error(
              "Missing PINATA_JWT in .env.local. Get one free at https://app.pinata.cloud/developers/api-keys",
            );
          }
          return createPinataStorage({
            jwt,
            gatewayUrl: process.env.PINATA_GATEWAY_URL ?? "https://gateway.pinata.cloud",
          });
        }
      `),
    },
    {
      path: "app/api/respond/route.ts",
      content: dedent(`
        import { NextResponse } from "next/server";
        import { storeFormSubmission } from "@cdr-kit/forms/server";
        import { getStorage } from "../../../lib/storage";

        /** Platform-wallet pattern: respondent never holds a wallet. The server signs
         *  every submission with its own funded Aeneid key and uploads the encrypted
         *  blob through the configured storage adapter. */
        export async function POST(req: Request) {
          const pk = process.env.WALLET_PRIVATE_KEY as \`0x\${string}\` | undefined;
          if (!pk) {
            return NextResponse.json({ error: "Server missing WALLET_PRIVATE_KEY" }, { status: 500 });
          }

          const { fields } = await req.json();
          try {
            const storage = getStorage();
            const { vaultId, cid } = await storeFormSubmission(fields, {
              privateKey: pk,
              storage,
              rpcUrl: "https://aeneid.storyrpc.io",
            });

            // In production, persist { vaultId, cid, submittedAt } in your DB alongside
            // the form id so /api/results can list them later.
            return NextResponse.json({ vaultId, cid });
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
        import { getStorage } from "../../../lib/storage";

        /** Demo: decrypts known vault IDs from an in-memory list. In production
         *  you'd pull this list from your DB (the IDs you stored from
         *  /api/respond) for the authenticated form creator only. */
        const SAMPLE_VAULT_IDS: number[] = [];

        export async function GET() {
          const pk = process.env.WALLET_PRIVATE_KEY as \`0x\${string}\` | undefined;
          if (!pk) {
            return NextResponse.json({ error: "Server missing WALLET_PRIVATE_KEY" }, { status: 500 });
          }

          const storage = getStorage();
          const items = await Promise.all(
            SAMPLE_VAULT_IDS.map(async (vaultId) => {
              const { fields, submittedAt } = await readFormSubmission(vaultId, {
                privateKey: pk,
                storage,
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
        cp .env.local.example .env.local      # add WALLET_PRIVATE_KEY + PINATA_JWT
        pnpm dev                              # http://localhost:3000
        \`\`\`

        ## How it works

        - The respondent fills \`<CdrField>\`s and clicks \`<CdrSubmitButton>\`.
        - \`<CdrForm onEncrypt={...}>\` posts the fields to \`/api/respond\`.
        - The route calls \`storeFormSubmission()\` from \`@cdr-kit/forms/server\`,
          which signs with the platform wallet (your \`WALLET_PRIVATE_KEY\`),
          uploads the encrypted blob through the configured storage adapter
          (Pinata by default — see \`lib/storage.ts\`), and allocates a fresh
          CDR vault per submission.
        - The vault UUID + CID is returned; persist it to your DB alongside the
          form ID so the creator can decrypt via \`readFormSubmission()\`.

        Respondents **never hold a wallet**. Gas + signature + storage cost is
        the platform's burden.

        ## Swapping the storage adapter

        Edit \`lib/storage.ts\`. Five other adapters are documented inline:

        - \`createSupabaseStorage({ url, key, bucket })\` — Postgres-backed
        - \`createIpfsStorage({ addUrl, gatewayUrl })\` — any IPFS HTTP API
        - \`createS3Storage({ endpoint, region, accessKey, secretKey, bucket })\` — AWS S3 / R2 / B2
        - \`createStorachaStorage({ agentDelegation, spaceDid })\` — web3.storage / w3up
        - \`createHeliaStorage()\` — self-hosted Helia node

        Whatever you pick, make sure \`/api/respond\` and \`/api/results\` use the
        same adapter — that's why both routes import \`getStorage()\` from one place.

        Full docs: <https://cdr-kit.dev/docs/forms>
      `),
    },
    { path: ".gitignore", content: GITIGNORE },
    {
      path: ".env.local.example",
      content: dedent(`
        # ====== REQUIRED ======
        # Funded Aeneid testnet wallet (chain ID 1315) — pays for vault creation + writes.
        # Get testnet IP at https://aeneid.faucet.story.foundation/
        WALLET_PRIVATE_KEY=0x_your_aeneid_testnet_private_key

        # Pinata JWT for IPFS pinning. Free signup at https://app.pinata.cloud/developers/api-keys
        PINATA_JWT=eyJ...
        # PINATA_GATEWAY_URL=https://your-gateway.mypinata.cloud  # optional

        # ====== OPTIONAL — only needed for WalletConnect-protocol wallets ======
        # NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

        # ====== ALTERNATIVES — uncomment if you swap the adapter in lib/storage.ts ======
        # SUPABASE_URL=https://xxxx.supabase.co
        # SUPABASE_SERVICE_ROLE_KEY=
        # SUPABASE_BUCKET=cdr-blobs

        # IPFS_ADD_URL=http://localhost:5001/api/v0/add
        # IPFS_GATEWAY_URL=http://localhost:8080

        # S3_ENDPOINT=https://s3.amazonaws.com
        # S3_REGION=us-east-1
        # S3_ACCESS_KEY=
        # S3_SECRET_KEY=
        # S3_BUCKET=
      `),
    },
  ],
};
