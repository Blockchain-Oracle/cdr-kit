"use client";

import { useState } from "react";
import { CdrForm, CdrField, CdrSubmitButton } from "@cdr-kit/forms";
import "./cdr-form-demo.css";

/**
 * Forms gallery demo. Uses the mock `onEncrypt` callback so visitors see the full
 * happy-path (encrypting → submitted, with a fake vault uuid) without needing a
 * funded server wallet. The components are the real exports from `@cdr-kit/forms`.
 */
export function CdrFormDemo() {
  const [vaultId, setVaultId] = useState<number | null>(null);

  async function mockEncrypt(): Promise<number> {
    // Pretend to hit the API → returns a fake but stable-looking vault uuid.
    await new Promise((r) => setTimeout(r, 1400));
    return 5614;
  }

  if (vaultId !== null) {
    return (
      <div className="cdr-form-demo">
        <div className="cdr-form-demo-result">
          <p className="cdr-form-demo-eyebrow">stored · encrypted</p>
          <p className="cdr-form-demo-vault">
            vault <b>#{vaultId}</b>
          </p>
          <p className="cdr-form-demo-sub">
            Your fields were serialized to JSON, encrypted via the CDR precompile, and stored on-chain.
            Only the form owner can decrypt.
          </p>
          <button
            type="button"
            className="cdr-form-demo-reset"
            onClick={() => setVaultId(null)}
          >
            ↺ reset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cdr-form-demo">
      <CdrForm onEncrypt={mockEncrypt} onSuccess={(uuid) => setVaultId(uuid)}>
        <CdrField name="mood" label="Mood (1–10)" type="number" required />
        <CdrField name="highlight" label="Highlight of the week" type="text" placeholder="What stood out?" required />
        <CdrField name="notes" label="Anything else?" type="textarea" placeholder="Optional" />
        <CdrSubmitButton>Submit securely</CdrSubmitButton>
      </CdrForm>
    </div>
  );
}
