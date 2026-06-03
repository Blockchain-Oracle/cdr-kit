---
"@cdr-kit/cli": patch
"@cdr-kit/agent": patch
"@cdr-kit/contracts": patch
"@cdr-kit/core": patch
"@cdr-kit/tools": patch
"@cdr-kit/mcp": patch
"@cdr-kit/react": patch
"@cdr-kit/react-ui": patch
"@cdr-kit/vercel-ai": patch
"@cdr-kit/openai": patch
"@cdr-kit/langchain": patch
"@cdr-kit/agentkit": patch
"@cdr-kit/goat": patch
"create-cdr-kit-app": patch
---

Republish to flush the rewritten READMEs to npm.

Every package's README on npm was still the old short version (e.g. `@cdr-kit/cli` showed 29 bytes; the source has been 4886 bytes since the README rewrite landed). Bumping a patch on each so a single `pnpm release` flushes the new content. **No code changes** — the dist is byte-identical to the last publish; only the README in each tarball updates.

Verified before the bump:
- `@cdr-kit/cli`: source 4886b vs npm 29b
- `@cdr-kit/agent`: source 3790b vs npm 1657b
- `@cdr-kit/react`: source 4544b vs npm 1229b
- ...and 11 more in the same shape.
