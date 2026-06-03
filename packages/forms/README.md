# @cdr-kit/forms

Encrypted form submission components for [Story Protocol CDR](https://cdr-kit.dev). Drop in `<CdrForm>` + `<CdrField>` + `<StorageProviderPicker>`, wire `onEncrypt` to the bundled server helper (`@cdr-kit/forms/server`), and every submission becomes a CDR vault — multi-provider storage, platform-wallet payment, whole-form encryption — with no decrypt key on the client.

## Install

```sh
pnpm add @cdr-kit/forms @cdr-kit/react @cdr-kit/core
```

## Quickstart

```tsx
// app/contact/page.tsx
import { CdrForm, CdrField, CdrSubmitButton } from "@cdr-kit/forms";
import "@cdr-kit/forms/styles.css";
import { encryptFormAction } from "./actions";

export default function ContactPage() {
  return (
    <CdrForm onEncrypt={encryptFormAction} onSuccess={(id) => console.log("vault", id)}>
      <CdrField name="email" label="Email" type="email" required />
      <CdrField name="message" label="Message" type="textarea" required />
      <CdrSubmitButton />
    </CdrForm>
  );
}
```

```ts
// app/contact/actions.ts
"use server";
import { storeFormSubmission } from "@cdr-kit/forms/server";

export async function encryptFormAction(fields: Record<string, FormDataEntryValue>) {
  const { vaultId } = await storeFormSubmission(fields, { privateKey: process.env.PLATFORM_KEY! as `0x${string}` });
  return vaultId;
}
```

Docs: [cdr-kit.dev/docs/forms](https://cdr-kit.dev/docs/forms).
