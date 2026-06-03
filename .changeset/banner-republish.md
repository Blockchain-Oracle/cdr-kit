---
"@cdr-kit/agent": patch
"@cdr-kit/agentkit": patch
"@cdr-kit/cli": patch
"@cdr-kit/contracts": patch
"@cdr-kit/core": patch
"@cdr-kit/forms": patch
"@cdr-kit/goat": patch
"@cdr-kit/langchain": patch
"@cdr-kit/mcp": patch
"@cdr-kit/openai": patch
"@cdr-kit/react": patch
"@cdr-kit/react-ui": patch
"@cdr-kit/story": patch
"@cdr-kit/tools": patch
"@cdr-kit/vercel-ai": patch
"create-cdr-kit-app": patch
---

Republish 16 packages with the new wordmark banner README.

**No source / dist changes** — dists are byte-identical to the previously-published versions. The only thing that updates in each tarball is the `README.md`, which now carries a `<picture>`-wrapped cdr-kit wordmark banner that switches between a dark-ink variant (for light backgrounds) and a cream variant (for dark backgrounds) via `prefers-color-scheme: dark`. The banner points at `raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark*.svg`.

Why this required bumping all 16: npmjs.com renders the README that ships inside each tarball, and the existing tarballs were published before the banner landed. Bumping a patch ships a fresh tarball with the updated README.
