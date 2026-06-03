---
"@cdr-kit/agent": minor
"@cdr-kit/agentkit": minor
"@cdr-kit/cli": minor
"@cdr-kit/contracts": minor
"@cdr-kit/core": minor
"@cdr-kit/goat": minor
"@cdr-kit/langchain": minor
"@cdr-kit/mcp": minor
"@cdr-kit/openai": minor
"@cdr-kit/react": minor
"@cdr-kit/react-ui": minor
"@cdr-kit/story": minor
"@cdr-kit/tools": minor
"@cdr-kit/vercel-ai": minor
"create-cdr-kit-app": minor
---

cdr-kit 0.7.0: ship the @cdr-kit/forms package + fumadocs MDX docs infra + real-Aeneid scaffolder templates (no mock anywhere).

Every workspace package bumps to 0.7.0 so the scaffolder templates' `^0.7.0` deps resolve at install time. This is a coordinated release — `@cdr-kit/forms@0.7.0` shipped first; this PR aligns the rest of the surface to the same version so `pnpm create cdr-kit-app x` works end-to-end against npm.

Notable per-package changes:
- `@cdr-kit/react`: hide the `import("@cdr-kit/story")` literal from Turbopack via the documented `new Function("s", "return import(s)")` indirection so the optional Story peer doesn't break apps that don't depend on it.
- `create-cdr-kit-app`: 4 new template shapes (forms, data-marketplace) + every existing template (blog, paywall, starter) rewired to real Aeneid + Pinata storage adapter. Zero mock.
