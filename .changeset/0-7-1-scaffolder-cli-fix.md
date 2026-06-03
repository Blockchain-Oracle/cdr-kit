---
"create-cdr-kit-app": patch
---

Fix CLI entrypoint guard so `npx create-cdr-kit-app` / `pnpm create cdr-kit-app` actually scaffolds.

The previous `process.argv[1] === fileURLToPath(import.meta.url)` check failed when invoked through npm's bin wrapper (npx writes a shim shell/JS script that re-execs node with its OWN path as argv[1], not the target module). The CLI guard never triggered, exited 0 with no output, no files written. Caught only when running the published 0.7.0 from npm — the workspace `pnpm exec` path masked it.

Now detects entrypoint via either exact path match OR basename match against `create-cdr-kit-app` (covers npx, pnpm dlx, npm exec, direct node invocation).
