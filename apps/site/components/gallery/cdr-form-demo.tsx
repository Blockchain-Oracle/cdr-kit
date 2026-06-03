"use client";

import { useState } from "react";
import { CdrForm, CdrField, CdrSubmitButton, StorageProviderPicker, type StorageProviderId } from "@cdr-kit/forms";
import "@cdr-kit/forms/styles.css";
import "./cdr-form-demo.css";

/**
 * Forms gallery demo. Premium landing-page-quality surface:
 * - Two-pane layout: form on the left, storage-provider picker on the right
 * - Mock `onEncrypt` returns a deterministic uuid after a short delay
 * - Success state shows the vault-id chip + tx hash placeholder
 *
 * Uses the same `@cdr-kit/react-ui` token system as the rest of the docs site
 * (--cdr-ui-*) so the visual lines up with the landing hero / vault-gate demo.
 */
export function CdrFormDemo() {
  const [vaultId, setVaultId] = useState<number | null>(null);
  const [provider, setProvider] = useState<StorageProviderId>("pinata");

  async function mockEncrypt(): Promise<number> {
    await new Promise((r) => setTimeout(r, 1500));
    // Deterministic-ish uuid so the success state always looks the same in screenshots.
    return 5614;
  }

  return (
    <div className="cfd">
      <aside className="cfd-pane cfd-pane--form">
        <div className="cfd-pane-head">
          <span className="cfd-eyebrow">survey · whole-form encryption</span>
          <h4 className="cfd-title">How was your week?</h4>
          <p className="cfd-sub">
            Each submission lands in its own CDR vault on Aeneid. Respondents don&apos;t connect a wallet —
            the server signs.
          </p>
        </div>

        {vaultId !== null ? (
          <div className="cfd-result">
            <span className="cfd-result-dot" aria-hidden />
            <p className="cfd-result-eyebrow">stored · encrypted</p>
            <p className="cfd-result-vault">
              vault <b>#{vaultId}</b>
            </p>
            <p className="cfd-result-sub">
              Fields serialized to JSON, encrypted by the CDR precompile, persisted on-chain. Only the
              form owner&apos;s wallet can decrypt.
            </p>
            <button type="button" className="cfd-reset" onClick={() => setVaultId(null)}>
              ↺ try again
            </button>
          </div>
        ) : (
          <CdrForm
            onEncrypt={mockEncrypt}
            onSuccess={(uuid) => setVaultId(uuid)}
            className="cdr-forms-form"
          >
            <CdrField name="mood" label="Mood (1–10)" type="number" required />
            <CdrField name="highlight" label="Highlight of the week" placeholder="What stood out?" required />
            <CdrField name="notes" label="Anything else?" type="textarea" placeholder="Optional" />
            <CdrSubmitButton>Submit securely</CdrSubmitButton>
          </CdrForm>
        )}
      </aside>

      <aside className="cfd-pane cfd-pane--picker">
        <div className="cfd-pane-head">
          <span className="cfd-eyebrow">server-side · admin</span>
          <h4 className="cfd-title">Storage backend</h4>
          <p className="cfd-sub">
            Where the encrypted payload lives off-chain. You pick this once in your server route —
            respondents never see it.
          </p>
        </div>
        <StorageProviderPicker value={provider} onChange={setProvider} heading={null} />
        <div className="cfd-picker-foot">
          <code>storage = create{provider[0]!.toUpperCase() + provider.slice(1)}Storage(...)</code>
        </div>
      </aside>
    </div>
  );
}
