---
"@cdr-kit/forms": patch
---

Add `<StorageProviderPicker>` — admin-side chip-pill picker for the storage backend that routes encrypted form submissions.

- 8 providers covered: `pinata` · `supabase` · `storacha` · `ipfs` · `s3` · `helia` · `gateway` · `memory`. Each tile maps 1:1 to a `Create*Storage` factory in `@cdr-kit/core`.
- Real CC0 brand marks (SimpleIcons) for Supabase / IPFS / Cloudflare (used for S3/R2). Refined cdr-kit-authored brand-colored shapes for the rest — kept clean of trademark concerns.
- CSS Grid `auto-fit` chip row + brand-colored detail card with the matching factory snippet (`createPinataStorage({ jwt: process.env.PINATA_JWT! })` etc).
- Props: `value`, `onChange`, `include?`, `heading?`, `showDetail?`, `className?`, `style?`.
- Exposes the `STORAGE_PROVIDERS` catalogue + `StorageProviderId` union for custom pickers / tests.
- Styles ride along in the existing `@cdr-kit/forms/styles.css` import — opt-in default theme + dark mode via `[data-theme="dark"]`.
- Explicit "not for respondent UIs" guidance in the JSDoc — drop it in your admin/setup screen, not on the public form. The scaffolder template (`create-cdr-kit-app --template forms`) intentionally keeps it off the public page.

No breaking changes. Adding `StorageProviderPicker` + `STORAGE_PROVIDERS` to the public surface.
