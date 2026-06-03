<p align="center">
  <a href="https://cdrkit.xyz">
    <img src="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/icon.svg" alt="cdr-kit" width="80">
  </a>
</p>

# @cdr-kit/forms

> Encrypted form submissions on Story Aeneid. Drop-in `<CdrForm>` + `<CdrField>` + server helper. Multi-provider storage, platform-wallet pattern, whole-form encryption.

The respondent never holds a wallet. Gas + signature + storage upload are the server's burden — they fill in fields, hit submit, and the data lands in a CDR vault that only the form owner can decrypt. Pattern extracted from [Confide](https://github.com/Blockchain-Oracle/confide).

---

## Install

```bash
pnpm add @cdr-kit/forms @cdr-kit/agent @cdr-kit/core
```

---

## Client

```tsx
"use client";
import { CdrForm, CdrField, CdrSubmitButton } from "@cdr-kit/forms";
import "@cdr-kit/forms/styles.css";

export default function Survey() {
  return (
    <CdrForm
      onEncrypt={async (fields) => {
        const r = await fetch("/api/respond", {
          method: "POST",
          body: JSON.stringify({ fields }),
        });
        const { vaultId } = await r.json();
        return vaultId;
      }}
      onSuccess={(uuid) => console.log("stored at vault", uuid)}
    >
      <CdrField name="mood" label="Mood (1-10)" type="number" required />
      <CdrField name="highlight" label="Highlight of the week" required />
      <CdrField name="notes" label="Anything else?" type="textarea" />
      <CdrSubmitButton>Submit securely</CdrSubmitButton>
    </CdrForm>
  );
}
```

---

## Server

```ts
// app/api/respond/route.ts
import { NextResponse } from "next/server";
import { storeFormSubmission } from "@cdr-kit/forms/server";
import { createPinataStorage } from "@cdr-kit/core";

export async function POST(req: Request) {
  const { fields } = await req.json();

  // Storage adapter is optional — payloads ≤ 1KB go directly through the CDR precompile.
  const storage = createPinataStorage({
    jwt: process.env.PINATA_JWT!,
    gatewayUrl: process.env.PINATA_GATEWAY_URL ?? "https://gateway.pinata.cloud",
  });

  const { vaultId, cid } = await storeFormSubmission(fields, {
    privateKey: process.env.PLATFORM_WALLET_PRIVATE_KEY as `0x${string}`,
    storage,            // optional — needed only for >1KB payloads
    rpcUrl: "https://aeneid.storyrpc.io",
  });

  return NextResponse.json({ vaultId, cid });
}
```

Decrypt later via:

```ts
import { readFormSubmission } from "@cdr-kit/forms/server";
const { fields, submittedAt } = await readFormSubmission(vaultId, {
  privateKey: process.env.PLATFORM_WALLET_PRIVATE_KEY as `0x${string}`,
  storage,    // pass only if the write used one
});
```

---

## Exports

| symbol               | what it is                                                                  |
| -------------------- | --------------------------------------------------------------------------- |
| `CdrForm`            | form wrapper; takes `onEncrypt` callback returning the vault uuid           |
| `CdrField`           | typed input — `text` · `textarea` · `email` · `number` · `select` · `radio` · `checkbox` |
| `CdrSubmitButton`    | button with idle / encrypting / submitted states                            |
| `useCdrSubmit`       | low-level hook if you want full control over your form layout               |
| `useCdrFormContext`  | sibling-component access to the form's state                                |
| `storeFormSubmission`| (server) encrypt + store a submission, returns vault uuid                   |
| `readFormSubmission` | (server) decrypt a submission by uuid                                       |

---

## Scaffolder

```bash
pnpm create cdr-kit-app my-forms --template forms
```

Generates a Next.js app with `<CdrForm>` on the public page, `/api/respond` + `/api/results` routes, dark premium layout — ready to deploy.

---

## Peer dependencies

- `@cdr-kit/agent` ≥ 0.7.0
- `@cdr-kit/core` ≥ 0.7.0
- `react` ≥ 18

---

## Links

- Full docs: <https://cdrkit.xyz/docs/forms>
- npm: <https://www.npmjs.com/package/@cdr-kit/forms>
- GitHub: <https://github.com/Blockchain-Oracle/cdr-kit>
- Confide (origin pattern): <https://github.com/Blockchain-Oracle/confide>
