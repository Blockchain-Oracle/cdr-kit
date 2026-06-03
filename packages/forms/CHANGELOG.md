# @cdr-kit/forms

## 0.7.4

### Patch Changes

- cb7eeca: Republish 16 packages with the new wordmark banner README.

  **No source / dist changes** — dists are byte-identical to the previously-published versions. The only thing that updates in each tarball is the `README.md`, which now carries a `<picture>`-wrapped cdr-kit wordmark banner that switches between a dark-ink variant (for light backgrounds) and a cream variant (for dark backgrounds) via `prefers-color-scheme: dark`. The banner points at `raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark*.svg`.

  Why this required bumping all 16: npmjs.com renders the README that ships inside each tarball, and the existing tarballs were published before the banner landed. Bumping a patch ships a fresh tarball with the updated README.
