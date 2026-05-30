# Scaffolder CLI Patterns — Research

Research input for the cdr-kit `create-cdr-kit-app` design conversation. This is a survey of how the leading "create-X" scaffolders work in 2026: their invocation surface, prompt UX, template-selection model, flags, post-scaffold UX, and the libraries they rely on. **No recommendations** — those will come in the next conversation.

Sources are linked inline. Anything not verified via source/docs is marked `[UNVERIFIED]`.

---

## Table of Contents

1. [`create-next-app`](#create-next-app-vercel)
2. [`create-vite`](#create-vite)
3. [`create-t3-app`](#create-t3-app)
4. [`create-wagmi`](#create-wagmi)
5. [`@rainbow-me/create-rainbowkit`](#rainbow-mecreate-rainbowkit)
6. [`create-privy-pwa`](#create-privy-pwa)
7. [`shadcn`](#shadcn-cli-init--add)
8. [Secondary: `create-astro`, `create-cloudflare` (C3)](#secondary-create-astro-create-cloudflare-c3)
9. [Cross-cut taxonomy table](#cross-cut-taxonomy-table)
10. [The `npm create X` convention](#the-npm-create-x-convention)
11. [Three template-selection design patterns observed](#three-template-selection-design-patterns-observed)
12. [Prompt-UX trends 2024–2026](#prompt-ux-trends-20242026)
13. [Common failure modes / gotchas](#common-failure-modes--gotchas)
14. [What `create-cdr-kit-app` does today](#what-create-cdr-kit-app-does-today)

---

## `create-next-app` (Vercel)

Source: <https://github.com/vercel/next.js/tree/canary/packages/create-next-app>
Entry: `index.ts` (825 lines), `create-app.ts` (300 lines), `helpers/`, `templates/`
Version in tree at time of research: `16.3.0-canary.35`.

### Invocation surface

Bin: `"create-next-app": "./dist/index.js"`. The published package is `create-next-app`, so the npm `create-*` convention makes all of these resolve to it:

```
npx create-next-app@latest
npm create next-app@latest
pnpm create next-app
yarn create next-app
bun create next-app
```

### Interactive prompt UX

- Prompt library: **`prompts` (v2.4.2)** — the long-standing terminus/prompts library. Colors via **`picocolors`**. CLI framework: **`commander` (v12)**. Has zero runtime dependencies — everything is bundled via `@vercel/ncc` at build time (see `scripts.build` in package.json).
- Cancel handling: a top-level `onPromptState` callback re-shows the terminal cursor (`\x1B[?25h`) and `process.exit(1)` on `state.aborted`. SIGINT/SIGTERM also exit cleanly.
  ```ts
  const onPromptState = (state) => {
    if (state.aborted) {
      process.stdout.write('\x1B[?25h')
      process.stdout.write('\n')
      process.exit(1)
    }
  }
  ```
- Prompt types used: `text` (project name, import alias), `toggle` (Yes/No for TS, Tailwind, src/, App Router, React Compiler, AGENTS.md, customize import alias, reset prefs), `select` (linter: ESLint/Biome/None, and a top-level recommended-defaults gate), `confirm` (download-fallback).
- Validation: project name validated via `validate-npm-package-name`; import alias must match `^[^*"]+\/\*\s*$`.
- **Saved preferences:** uses `conf` (electron-style on-disk config) keyed `projectName: 'create-next-app'` to remember the user's last choices. The first prompt offers "Yes, use recommended defaults / No, reuse previous settings / No, customize settings" depending on whether saved prefs exist.
- **Agent-aware fast path:** if the user passes *any* `--` flag, prompts are skipped entirely and recommended defaults fill the rest, with a printed summary of which defaults were used and what alt-flags exist:
  > "Check if user provided any configuration flags. If they did, skip all prompts and use recommended defaults for unspecified options. This is critical for AI agents, which pass flags like `--typescript --tailwind --app` and expect the rest to use sensible defaults without entering interactive mode." (`index.ts:319-325`)

### Template selection model

**Feature-flag matrix** (not framework-picker). The user always gets Next.js — the variation is along axes:

- Language: `--ts` / `--js`
- Linter: `--eslint` / `--biome` / `--no-linter`
- Styling: `--tailwind` / `--no-tailwind`
- Layout: `--src-dir` / `--no-src-dir`
- Router: `--app` / `--no-app` (Pages Router)
- React Compiler: `--react-compiler`
- Bundler: `--rspack` (else Turbopack)
- Headless: `--api` (App Router headless)
- Empty: `--empty`
- Coding-agent guidance: `--agents-md` (default on)
- Import alias: `--import-alias <prefix/*>` (default `@/*`)
- External: `-e, --example <name|github-url>` + `--example-path` — bootstrap from a named example in `vercel/next.js/examples` or any public GitHub URL/subdir.

Templates live in `packages/create-next-app/templates/` and the directory naming encodes the matrix: `app`, `app-empty`, `app-tw`, `app-tw-empty`, `app-api`, `default`, `default-empty`, `default-tw`, `default-tw-empty`. The router × tailwind × empty combination produces 9 directories; TS/JS is then a sub-axis handled in `create-app.ts`.

### CLI flags (full list)

```
[directory]                            positional project dir
-v, --version
-h, --help
--ts, --typescript                     default
--js, --javascript
--tailwind                             default
--react-compiler
--eslint
--biome
--app                                  App Router (default)
--src-dir
--rspack                               bundler (else Turbopack)
--import-alias <prefix/*>              default "@/*"
--api                                  App-Router headless API
--empty
--use-npm | --use-pnpm | --use-yarn | --use-bun
--reset, --reset-preferences           clear saved prefs
--skip-install
--yes                                  use saved/defaults, no prompts
-e, --example <name|github-url>
--example-path <path>
--agents-md                            include AGENTS.md (default)
--disable-git
```

Negation pattern via commander: any boolean flag can be inverted with `--no-X` (e.g. `--no-tailwind`, `--no-agents-md`, `--no-react-compiler`). The CLI scans `process.argv` directly for `--no-*` because commander's positional-arg parsing collides with negation.

### Post-scaffold UX

- `update-check` runs in the background — on exit, if a newer `create-next-app` exists on the matched dist-tag (`latest` for stable, `canary` for canary), prints a yellow notice with the upgrade command for the detected pkg manager.
- Failed example download falls back to a `confirm` prompt offering the default template.
- `notifyUpdate` is called from both success and error exit paths.

### Underlying lib choices

```jsonc
"prompts": "2.4.2",
"commander": "12.1.0",
"picocolors": "1.1.1",
"conf": "13.0.1",                  // persisted preferences
"ci-info": "4.0.0",                // detect CI -> skip prompts
"validate-npm-package-name": "5.0.1",
"cross-spawn": "7.0.3",
"async-retry": "1.3.1",
"fast-glob": "3.3.1",
"tar": "7.5.7",                    // for fetching examples
"update-check": "1.5.4",
"@vercel/ncc": "0.38.4"            // single-file bundling
```

Build: `ncc build ./index.ts -o ./dist/ --minify` — produces a single bundled `dist/index.js`. No runtime deps in the published `files`.

### Repo / source layout

In-tree (monorepo with Next.js itself). Templates live as real on-disk directories alongside the source. Tests for the CLI live in the broader Next.js test harness (`[UNVERIFIED]` specific path).

---

## `create-vite`

Source: <https://github.com/vitejs/vite/tree/main/packages/create-vite>
Entry: `src/index.ts` (939 lines)
Version: `9.0.7`.

### Invocation surface

Bin: two aliases.
```json
"bin": { "create-vite": "index.js", "cva": "index.js" }
```
So all of these work:
```
npm create vite@latest
pnpm create vite@latest
yarn create vite
bun create vite
deno run -A npm:create-vite
npx create-vite              # or `cva`
```
The CLI detects the invoking pkg manager via `npm_config_user_agent` and adjusts emitted commands accordingly.

### Interactive prompt UX

- Prompt library: **`@clack/prompts` (v1.4.0)** — recently migrated from `prompts`. Uses `prompts.text`, `prompts.select`, `prompts.confirm`, `prompts.log.step`, `prompts.outro`, `prompts.isCancel`, `prompts.cancel`.
- CLI parser: **`mri`** (tiny — 1 dep, ~3kb).
- Colors: `node:util.styleText` (Node-native, no `chalk`/`picocolors`). The author builds a `createColors()` Proxy that lazy-styles strings.
- Cancel handling: every prompt is wrapped:
  ```ts
  const projectName = await prompts.text({ ... })
  if (prompts.isCancel(projectName)) return cancel()
  ```
- Agent-aware fast path: uses `@vercel/detect-agent` to detect AI-agent execution, and if interactive *and* an agent is detected it prints:
  > "To create in one go, run: `create-vite <DIRECTORY> --no-interactive --template <TEMPLATE>`"
- `--interactive` / `--no-interactive` is a first-class flag; interactivity also implicitly disabled when `process.stdin.isTTY` is false.

### Template selection model

**One-of-N framework picker, then variant** (the canonical "Vite-style" pattern). Two-stage `select`:
1. `Select a framework:` → Vanilla / Vue / React / Preact / Lit / Svelte / Solid / Qwik / Ember / Angular / Marko / Others
2. `Select a variant:` → TypeScript / JavaScript / (framework's official starter ↗) / (TanStack / Vike / Nuxt / SvelteKit ↗) / ...

Variants are typed as:
```ts
type FrameworkVariant = {
  name: string
  display: string
  link?: `https://${string}`
  color: ColorFunc
  customCommand?: string            // hand-off to another scaffolder
}
```

Notable: the variant can be a **hand-off** via `customCommand`. e.g. picking Vue → Nuxt runs `npm exec nuxi init TARGET_DIR`; picking React → "TanStack Router" runs `npm exec -- @tanstack/cli@latest create TARGET_DIR --framework react --interactive`. The `getFullCustomCommand` helper rewrites the command per detected pkg manager (`pnpm dlx` / `yarn dlx` / `bun x` / `deno run -A npm:`).

Templates live as **sibling directories** in the package: `template-vanilla/`, `template-vanilla-ts/`, `template-react/`, `template-react-ts/`, `template-react-compiler/`, `template-react-compiler-ts/`, etc. The `files` array publishes them with a glob:
```json
"files": ["index.js", "template-*", "dist"]
```
At runtime: `path.resolve(fileURLToPath(import.meta.url), '../..', \`template-${template}\`)` — read every file, copy it through `renameFiles` (e.g. `_gitignore` → `.gitignore`), rewrite the `<title>` of `index.html` to the project name, and rewrite `package.json` name.

The React Compiler variant is handled with a `replace('-compiler', '')` and a post-step (`setupReactCompiler`) that surgically edits `package.json` and `vite.config.{ts,js}` to add the Babel plugin — so the compiler axis is a *post-copy mutation*, not a separate template.

### CLI flags

```
[DIRECTORY]                          positional
-t, --template NAME
-i, --immediate / --no-immediate     install deps and start dev
--overwrite                          remove existing files if non-empty
--interactive / --no-interactive     force interactive / non-interactive mode
-h, --help
```

Help text shows the available templates in a color-coded block.

### Post-scaffold UX

If `--immediate` (or the user confirms the prompt "Install with ${pkgManager} and start now?"), the CLI runs `pkgManager install` then `pkgManager run dev` inheriting stdio. Otherwise it prints:
```
Done. Now run:

  cd <dir>
  pnpm install
  pnpm run dev
```
Both arrays come from `getInstallCommand(agent)` and `getRunCommand(agent, 'dev')` which encode the per-pkg-manager quirks (`yarn` has no `install` subcommand, `deno task` instead of `run`).

### Underlying lib choices

```jsonc
"@clack/prompts": "^1.4.0",
"@vercel/detect-agent": "^1.2.3",
"cross-spawn": "^7.0.6",
"mri": "^1.2.0",
"tsdown": "^0.22.0"
```

Only 5 devDeps; build is `tsdown`. No `chalk`, no `picocolors`, no `commander` — leans entirely on Node built-ins where it can.

### Repo / source layout

In-tree under `packages/create-vite` in the main Vite monorepo. Templates are first-class sibling directories that get published with the package. Tested via `__tests__/`.

---

## `create-t3-app`

Source: <https://github.com/t3-oss/create-t3-app/tree/main/cli>
Entry: `src/cli/index.ts` (433 lines) + `src/installers/*` (per-addon installer modules)
Version: `7.40.0`.

### Invocation surface

Bin: `"create-t3-app": "./dist/index.js"`.
```
npm create t3-app@latest
pnpm create t3-app@latest
yarn create t3-app
bun create t3-app
```

### Interactive prompt UX

- Prompt library: **`@clack/prompts` (^0.6.3)** + `@clack/core`. Uses `p.group({...}, { onCancel() { process.exit(1) } })` to sequence the whole interview as one transaction.
- CLI parser: **`commander` (^10)**. Colors: **`chalk` (5.2.0)**. Spinners: **`ora` (6.3.1)** with **`gradient-string`** for the welcome banner. Process orchestration: **`execa` (^7)**.
- Validation: custom `validateAppName`, `validateImportAlias`.
- TTY/Mintty detection: prints a warning if `TERM_PROGRAM` includes `mintty` (Git Bash), throws `IsTTYError`, falls back to a confirm + default project.

### Template selection model

**Layered presets / composable add-ons** (this is the T3 signature). The base scaffold is always Next.js; the user picks zero or more from a curated set of packages:

```ts
type AvailablePackages =
  | "nextAuth" | "betterAuth" | "trpc" | "prisma" | "drizzle"
  | "tailwind" | "eslint" | "biome";
```

Each addon has a dedicated installer file (`src/installers/trpc.ts`, `prisma.ts`, `nextAuth.ts`, `betterAuth.ts`, `drizzle.ts`, `tailwind.ts`, `eslint.ts`, `biome.ts`, `envVars.ts`, `dbContainer.ts`). Installers take the project root + the final config and copy + mutate files (e.g. add deps to package.json, add the tRPC router, generate `.env`, generate a docker-compose for DB).

The CLI flow is one `p.group({...})` covering:
1. Project name (`text`)
2. TypeScript vs JavaScript (`select` — picking JS triggers a friendly `p.note(chalk.redBright("Wrong answer, using TypeScript instead"))`)
3. Tailwind? (`confirm`)
4. tRPC? (`confirm`)
5. Auth provider? (`select`: None / NextAuth.js / BetterAuth)
6. DB ORM? (`select`: None / Prisma / Drizzle)
7. App Router? (`confirm`, default true)
8. DB provider (conditional — only if ORM ≠ None): SQLite / MySQL / Postgres / PlanetScale
9. Linter (`select`: ESLint+Prettier / Biome)
10. Init git? (`confirm`, gated by `!--noGit`)
11. Run install? (`confirm`, gated by `!--noInstall`)
12. Import alias (`text`, default `~/`)

The conditional prompt for DB provider uses `({ results }) => results.database === "none" ? undefined : p.select(...)` — Clack's `group` passes the in-progress answer dict to subsequent steps. The full pattern:
```ts
const project = await p.group(
  {
    name: () => p.text({ ... }),
    language: () => p.select({ ... }),
    _: ({ results }) =>
      results.language === "javascript"
        ? p.note(chalk.redBright("Wrong answer, using TypeScript instead"))
        : undefined,
    databaseProvider: ({ results }) => {
      if (results.database === "none") return;
      return p.select({ ... });
    },
  },
  { onCancel() { process.exit(1) } },
);
```

### CLI flags

```
[dir]                                positional
--noGit
--noInstall
-y, --default                        bypass CLI, all-default app
--CI                                 CI mode (must accompany feature flags)
--tailwind [boolean]                 \
--trpc [boolean]                      \
--prisma [boolean]                     |
--drizzle [boolean]                    |  experimental: CI-only feature flags
--nextAuth [boolean]                   |
--betterAuth [boolean]                |
--appRouter [boolean]                 /
--eslint [boolean] | --biome [boolean]
--dbProvider [provider]              sqlite|mysql|postgres|planetscale
-i, --import-alias [alias]           default ~/
-v, --version
```

CI mode rejects impossible combos with a friendly exit (Prisma+Drizzle, Biome+ESLint, NextAuth+BetterAuth) using exit code 0 so a CI matrix run continues with the next combo.

### Post-scaffold UX

Spinners via `ora` per installer. `execa` runs `git init` and `pkgManager install`. The final "what now" screen comes from `src/utils/renderNextSteps.ts` `[UNVERIFIED]` — includes a "Thank you" banner via `gradient-string`.

### Underlying lib choices

```jsonc
"@clack/core": "^0.3.4",
"@clack/prompts": "^0.6.3",
"chalk": "5.2.0",
"commander": "^10.0.1",
"execa": "^7.2.0",
"fs-extra": "^11.2.0",
"gradient-string": "^2.0.2",
"ora": "6.3.1",
"sort-package-json": "^2.10.0"
```

Template lives at `cli/template/` and is published with the package. The CLI does find/copy + per-installer overlays + `sort-package-json` to normalize the final `package.json`.

### Repo / source layout

Standalone repo `t3-oss/create-t3-app` (not in the Next.js or T3 product monorepo). `cli/src/installers/` is the magic — each addon is a self-contained module that knows how to mutate the scaffold. `cli/template/` is the base template. `www/` is the docs site (create.t3.gg).

---

## `create-wagmi`

Source: <https://github.com/wevm/wagmi/tree/main/packages/create-wagmi>
Entry: `src/cli.ts` (276 lines), `src/frameworks.ts`
Version: `2.0.19`.

### Invocation surface

Bin: `"wagmi": "./dist/esm/cli.js"`. **Note the bin name is `wagmi`, not `create-wagmi`** — but the package is published as `create-wagmi`, so `npm create wagmi` resolves correctly via the `create-*` convention.
```
npm create wagmi@latest
pnpm create wagmi@latest
yarn create wagmi
bun create wagmi
```

### Interactive prompt UX

- Prompt library: **`prompts` (^2.4.2)**. CLI parser: **`cac` (^6.7.14)**. Colors: **`picocolors`**. Process: **`cross-spawn`**.
- Templates list is computed once: `frameworks.map(f => f.variants?.map(v => v.name) ?? [f.name]).flat()`.
- Cancel handling: single `onCancel` in the prompts options that throws `Operation cancelled`, caught in the outer try/catch.

### Template selection model

**Vite-style one-of-N framework + variant**, but smaller surface area. Frameworks are: `next`, `nuxt`, `vite-react`, `vite-vanilla`, `vite-vue` (per `packages/create-wagmi/templates/`). Variants are only used where a framework has > 1 (`framework?.variants?.length > 1 ? 'select' : null`).

Conditional prompts using `prompts`' function-form `type`/`choices`:
- Project name prompt is skipped if `argTargetDir` was passed
- Overwrite prompt only shown if target exists and is non-empty
- Package name prompt only if computed name isn't a valid npm name
- Framework `select` skipped if `--template` is valid

Custom-command hand-off mirrors create-vite (rewrites `npm create` → `pnpm create` / `bun x create-` etc.).

### CLI flags

```
<project-directory>                  positional
-t, --template [name]
--bun | --npm | --pnpm | --yarn      explicit pkg-manager choice
-h, --help
-v, --version
```

### Post-scaffold UX

Plain `console.log` of next steps — no auto-install, no spinner. Just:
```
Done. Now run:
  cd <dir>
  pnpm install
  pnpm run dev
```

### Underlying lib choices

```jsonc
"cac": "^6.7.14",
"cross-spawn": "^7.0.3",
"picocolors": "^1.0.0",
"prompts": "^2.4.2"
```

Four runtime deps. Tested via `cli.test.ts` (in-tree).

### Repo / source layout

In-tree under `packages/create-wagmi` in the wagmi monorepo. Templates at `packages/create-wagmi/templates/{next,nuxt,vite-react,vite-vanilla,vite-vue}/` — published via `"files": ["templates/**"]`.

---

## `@rainbow-me/create-rainbowkit`

Source: <https://github.com/rainbow-me/rainbowkit/tree/main/packages/create-rainbowkit>
Entry: `src/cli.ts` (245 lines)
Version: `0.3.17`.

### Invocation surface

Bin: `"create-rainbowkit": "dist/cli.js"`. Package is **scoped**: `@rainbow-me/create-rainbowkit`. Scoped `create-*` packages are invoked as:
```
npm create @rainbow-me/rainbowkit@latest
pnpm create @rainbow-me/rainbowkit@latest
yarn create @rainbow-me/rainbowkit
```
(See the [npm create convention section](#the-npm-create-x-convention) — `npm init @scope/foo` → `npm exec @scope/create-foo`.)

### Interactive prompt UX

- Prompt library: **`prompts` (2.4.2)**. CLI: **`commander` (9.2.0)**. Colors: **`chalk` (5.0.1)**. Process: **`execa` (6.1.0)**. File copy: **`cpy` (9.0.1)**. Validation: **`validate-npm-package-name`**.
- Single prompt: `What is the name of your project?` (with `initial: 'my-rainbowkit-app'`). Reserved names (`@rainbow-me/rainbowkit`, `wagmi`, `viem`, `next`, `react`, `react-dom`) are rejected with a friendly error.
- Throws a custom `FriendlyError` class for known user errors → printed in yellow with `process.exit(1)`, vs unknown errors which re-throw the full trace.

### Template selection model

**Single template.** `packages/create-rainbowkit/templates/next-app/` is the only one — hardcoded in `cli.ts`:
```ts
const templateName = 'next-app';
const selectedTemplatePath = path.join(templatesPath, templateName);
```
File copy with `cpy`, renames `_dot_*` → `.*`, rewrites `package.json` name and version. Optionally strips the workspace dep on `@rainbow-me/rainbowkit` so the install resolves the latest published version.

### CLI flags

```
[project-directory]                  positional
--use-npm | --use-yarn | --use-pnpm
--skip-git
```

No `--template` flag, no feature toggles.

### Post-scaffold UX

Sequential:
1. Copy files
2. `execa` `pkgManager install` (inherit stdio)
3. (Only in CI workspace mode) install latest `@rainbow-me/rainbowkit`
4. `git init` + `git add .` + `git commit --no-verify -m "Initial commit from create-rainbowkit"`
5. Print `cd <dir>` + `pnpm dev` next-steps line

Emoji-heavy welcome (`🌈 Welcome to RainbowKit!`) and step lines (`🚀`, `📦`, `📚`, `🌈 Done!`).

### Underlying lib choices

```jsonc
"chalk": "5.0.1",
"commander": "9.2.0",
"cpy": "9.0.1",
"execa": "6.1.0",
"fs-extra": "10.1.0",
"prompts": "2.4.2",
"validate-npm-package-name": "4.0.0"
```

### Repo / source layout

In-tree under `packages/create-rainbowkit/` in the rainbowkit monorepo. Single template under `templates/next-app/`.

---

## `create-privy-pwa`

Source: <https://github.com/privy-io/create-privy-pwa>

### Invocation surface

**Not a CLI.** It is a **template repository** with no published npm package. Per the README, you use it via `degit`:
```bash
npx degit privy-io/create-privy-pwa my-pwa-project
cd my-pwa-project
npm i
```

`npm create privy-pwa` would only work if Privy published a `create-privy-pwa` package on npm — they did not.

The repository was **archived on January 7, 2026** (per the WebFetch). Privy now redirects users to <https://github.com/privy-io/examples> for up-to-date examples.

### Interactive prompt UX / template selection / flags / post-scaffold

N/A — `degit` is the entire UX. No prompts, no flags, no auto-install. It is a one-template clone.

### Why this is in the survey

It's a useful counter-example: a high-quality template that ships as a `degit` source rather than a scaffolder. The cost is that the user must (a) discover the URL, (b) install `degit`, (c) configure env vars manually, (d) run install themselves. The benefit is zero maintenance of a CLI.

---

## `shadcn` CLI (`init` / `add`)

Source: <https://github.com/shadcn-ui/ui/tree/main/packages/shadcn>
Entry: `src/index.ts` (52 lines — pure command dispatcher) + `src/commands/*`
Version: `4.8.3`.

### Invocation surface

Bin: `"bin": "./dist/index.js"` (string form, not object). Package name: `shadcn`. So:
```
npx shadcn init
pnpm dlx shadcn init
bunx shadcn init
yarn dlx shadcn init
```
**Does *not* use the `create-*` convention** — it is run via `npx`, never `npm create shadcn`. Subcommand-shaped CLI.

The full command list (from `src/index.ts`): `init`, `apply`, `add`, `diff`, `docs`, `view`, `search`, `migrate`, `info`, `build`, `mcp`, `preset`, `registry`. `init` has alias `create`. There is also a separate `create` command that, per WebFetch, opens a browser at <https://ui.shadcn.com> to compose a design system.

### Interactive prompt UX

- Prompt library: **`prompts` (^2.4.2)**. CLI: **`commander` (^14)**. Colors: **`kleur`**. Spinner: **`ora` (^8.2.0)**. Process: **`execa` (^9)**. Schema validation: **`zod` (^3.24)**. File ops: **`fs-extra`**, **`fast-glob`**, **`diff`**, **`recast`**, **`ts-morph`**.
- Browser actions: **`open` (^11)** — `shadcn create` opens the browser to the registry builder.
- MCP integration: ships **`@modelcontextprotocol/sdk`** — `shadcn mcp` exposes the CLI as an MCP server (which is a notable 2025+ pattern).
- Process signals: top-level `SIGINT`/`SIGTERM` → `process.exit(0)`.

### Template selection model

For `init`, templates are an enum, set via `-t, --template <template>`. Per `src/commands/init.ts` description: `next`, `start` (TanStack Start), `vite`, `react-router`, `laravel`, `astro`, plus a `monorepo` flag. There's also a separate "preset" axis (`-p, --preset [name]`, `-b, --base <base>` (radix|base)) — a preset is a saved bundle of components + theme that can be applied to a new or existing project.

For `add`, templates aren't relevant — it adds one or more components from `registry@<version>` URLs into an already-initialized project.

The init template files live in `src/templates/` per the directory listing: `astro.ts`, `create-template.ts`, `index.ts`, `laravel.ts`, `monorepo.ts`, `next.ts`, `react-router.ts`, `start.ts`, `vite.ts`. Each is a programmatic template builder (not a static directory copy).

### CLI flags (`init` only)

```
[components...]                      positional — components to add immediately
-t, --template <template>            next|start|vite|react-router|laravel|astro
-b, --base <base>                    radix|base
--monorepo / --no-monorepo
-p, --preset [name]
-y, --yes                            default true (!)
-d, --defaults                       --template=next --preset=base-nova
-f, --force
-c, --cwd <cwd>
-n, --name <name>
-s, --silent
--css-variables / --no-css-variables  default true
--rtl / --no-rtl
--pointer / --no-pointer             enables pointer cursor on buttons
--reinstall / --no-reinstall
```

### Post-scaffold UX

- Spinner per step via `ora`.
- Backs up `components.json` before modifying it; restores on unexpected exit via a `process.on('exit', ...)` handler.
- Monorepo detection: `isMonorepoRoot` + `getMonorepoTargets` + `formatMonorepoMessage` — distinct messaging for monorepo users.
- Built-in registries from `BUILTIN_REGISTRIES`; preset codes can be decoded inline (`decodePreset(isPresetCode(...))`).

### Underlying lib choices

```jsonc
"commander": "^14.0.0",
"prompts": "^2.4.2",
"zod": "^3.24.1",
"execa": "^9.6.0",
"fs-extra": "^11.3.1",
"fast-glob": "^3.3.3",
"ora": "^8.2.0",
"kleur": "^4.1.5",
"open": "^11.0.0",
"deepmerge": "^4.3.1",
"diff": "^8.0.2",
"recast": "^0.23.11",
"ts-morph": "^26.0.0",
"@modelcontextprotocol/sdk": "^1.26.0",
"fuzzysort": "^3.1.0",            // fuzzy search for components
"tailwind-merge": "^3.0.1",
"msw": "^2.10.4"                  // network mocking in CLI? notable.
```

### Repo / source layout

In-tree under `packages/shadcn` in the `shadcn-ui/ui` monorepo. Test coverage is high — `init.test.ts`, `apply.test.ts`, `build.test.ts`, `preset.test.ts`.

---

## Secondary: `create-astro`, `create-cloudflare` (C3)

### `create-astro` (Astro)

Source: <https://github.com/withastro/astro/tree/main/packages/create-astro>
Version: `5.0.6`.

- Bin: `"create-astro": "./create-astro.mjs"`. Pkg: `create-astro`.
- Uses its own UI kit `@astrojs/cli-kit` (in-house) rather than `@clack/prompts` or `prompts`. That kit handles prompts, the famous "Houston" animation, colors. `arg` for flag parsing. `@bluwy/giget-core` for template fetching from GitHub.
- Templates fetched on demand from `withastro/astro/examples/*` (per WebFetch). `--template <name>` accepts a built-in name or any GitHub repo path (e.g. `cassidoo/shopify-react-astro`).
- Flags: `--help`, `--template <name>`, `--install`/`--no-install`, `--add <integrations>`, `--git`/`--no-git`, `-y, --yes`, `-n, --no`, `--dry-run`, `--skip-houston`, `--ref` (Astro branch), `--fancy` (Unicode on Windows).
- Standout: the **Houston** mascot animation; `--add <integrations>` lets the scaffold layer official integrations onto the base template, T3-like in spirit but post-scaffold.

### `create-cloudflare` (C3)

Source: <https://github.com/cloudflare/workers-sdk/tree/main/packages/create-cloudflare>
Version: `2.68.4`.

- Bin: `"bin": "./bin/c3.js"` — string form. Pkg: `create-cloudflare`. Also installable as the `c3` binary.
- Prompts: **`@clack/prompts` (^1.2.0)** (devDependency — bundled at build time).
- Templates live in `templates/` and `templates-experimental/`; published via `"files": ["bin","dist","templates","templates-experimental"]`.
- Notable deps: `degit` (template fetch), `haikunator` (random project names like `gentle-river-1234`), `comment-json` (edit `wrangler.jsonc` while preserving comments), `recast` + `magic-string` (codemods), `smol-toml`, `dns2` (local DNS), `get-port`, `exit-hook`, `tinyglobby`.
- Aims to be the multi-framework scaffolder for Workers/Pages — picks framework, optionally deploys at end.

---

## Cross-cut taxonomy table

| CLI | Pkg name | Prompt lib | CLI parser | Colors | Spinner | Selection model | # templates | Auto-install | Auto-git | Saved prefs | Agent-aware flag |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **create-next-app** | `create-next-app` | `prompts` | `commander` | `picocolors` | none | feature-flag matrix | ~9 dir variants × ts/js | opt-in via prompt | opt-out (`--disable-git`) | yes, via `conf` | yes — any `--flag` skips prompts |
| **create-vite** | `create-vite` | `@clack/prompts` | `mri` | Node `util.styleText` | none (uses `log.step`) | one-of-N framework + variant | ~20 in-tree + many `customCommand` hand-offs | opt-in (`-i, --immediate`) | none | none | yes — `@vercel/detect-agent`, `--no-interactive` |
| **create-t3-app** | `create-t3-app` | `@clack/prompts` (`group()`) | `commander` | `chalk` + `gradient-string` | `ora` | layered presets / add-ons | 1 base + per-installer overlays | prompt (`--noInstall` to skip) | prompt (`--noGit` to skip) | none | `--CI` mode + per-feature flags |
| **create-wagmi** | `create-wagmi` (bin `wagmi`) | `prompts` | `cac` | `picocolors` | none | framework + variant | 5 (next, nuxt, vite-react/vue/vanilla) | none | none | none | none explicit |
| **@rainbow-me/create-rainbowkit** | `@rainbow-me/create-rainbowkit` | `prompts` | `commander` | `chalk` | none | single template | 1 (next-app) | always | opt-out (`--skip-git`) | none | none |
| **create-privy-pwa** | (none — `degit` source) | n/a | n/a | n/a | n/a | n/a | 1 | n/a | n/a | n/a | n/a |
| **shadcn (init)** | `shadcn` (bin `shadcn`) | `prompts` | `commander` | `kleur` | `ora` | enum template + presets + components | 6 (next/start/vite/react-router/laravel/astro) | per-step | n/a (in-place) | n/a | `--yes` default true; `--silent` |
| **create-astro** | `create-astro` | `@astrojs/cli-kit` (in-house) | `arg` | bundled | bundled | named or any github repo | many examples on github | `--install` | `--git` | none | `-y` |
| **create-cloudflare** | `create-cloudflare` (`c3`) | `@clack/prompts` | bundled | bundled | `@clack/prompts` | framework picker + post-deploy | many | yes | yes | none | `[UNVERIFIED]` |

Pivot: the 2024–2026 split is between **`prompts`-based** (older — create-next-app, create-wagmi, create-rainbowkit, shadcn) and **`@clack/prompts`-based** (newer — create-vite, create-t3-app, create-cloudflare). New scaffolders default to Clack.

---

## The `npm create X` convention

Source: <https://docs.npmjs.com/cli/v11/commands/npm-init>

Verbatim from npm v11 docs:

> "The init command is transformed to a corresponding `npm exec` operation as follows:
> - `npm init foo` -> `npm exec create-foo`
> - `npm init @usr/foo` -> `npm exec @usr/create-foo`
> - `npm init @usr` -> `npm exec @usr/create`"

Plus:

> "`initializer` in this case is an npm package named `create-<initializer>`, which will be installed by `npm-exec`, and then have its main bin executed."

Key implications for any scaffolder:

1. **`npm create foo`, `npm init foo`, `pnpm create foo`, `yarn create foo`, `bun create foo` all resolve the same way** — they each pull and exec the package literally named `create-foo`. `pnpm create` and `yarn create` are aliases for the same convention; `bun create` has its own special-cased list but also falls back to `bun x create-<name>` (which is exactly what create-vite does in its `getFullCustomCommand` rewriter).
2. **Scoped scaffolders place `create-` *after* the scope.** `npm create @scope/foo` becomes `npm exec @scope/create-foo`. You cannot publish `create-@scope/foo`. (RainbowKit follows this: `@rainbow-me/create-rainbowkit` → `npm create @rainbow-me/rainbowkit`.) A bare `npm create @scope` shorthand resolves to `@scope/create` (no second segment).
3. **The `bin` name does *not* have to match the package name.** create-wagmi's package is `create-wagmi` but its bin is `wagmi` — and that's fine because the resolution is purely by package name. The bin name only matters when the user invokes via `npx <bin>` or after a global install. (shadcn does this too: pkg = `shadcn`, bin = `shadcn`, no `create-*` indirection.)
4. **All major pkg managers honor this convention.** pnpm, yarn (v1+v3), bun all special-case `<pm> create X` to do the equivalent of `<pm> dlx create-X` (or their pkg-manager-specific equivalent — e.g. `bun x create-X`).
5. **History `[UNVERIFIED]`:** the convention dates to npm v6 era (~2018). The official docs do not narrate the historical reasoning.

---

## Three template-selection design patterns observed

### Pattern A — One-of-N framework picker (Vite-style)

The user picks one framework from a list, optionally then a variant (TS/JS / official starter / hand-off). The CLI ships N independent template directories.

- **Canonical example: `create-vite`.** Two-stage `select` (framework, then variant). Templates are sibling directories: `template-react-ts/`, `template-vue-ts/`, etc. Variants can be `customCommand` hand-offs to other scaffolders.
- **Strengths:** trivial mental model; users see the menu and pick; new templates are pure additions (new directory + entry in the framework list).
- **Weaknesses:** combinatorial explosion if you also want TS/JS × Tailwind × etc — Vite avoids this by only having TS/JS and pushing everything else into the framework itself.
- **Also uses this:** `create-wagmi` (smaller surface), `create-cloudflare` (framework picker for Workers).

### Pattern B — Feature-flag matrix (Next-style)

There is one framework. The user picks N orthogonal feature toggles (TS/JS, App/Pages, Tailwind/no, src/no, etc.). The CLI ships a matrix of template directories (or one template with toggles applied at copy time).

- **Canonical example: `create-next-app`.** 9 template directories (`app`, `app-tw`, `app-empty`, `app-tw-empty`, `default`, `default-tw`, ...) × TS/JS handled in `create-app.ts`.
- **Strengths:** single product, deep configuration; very ergonomic to script (`--ts --tailwind --app --no-eslint`); recommended-defaults + saved-prefs make the interactive UX 1 keypress.
- **Weaknesses:** O(2^N) template directories if you don't collapse axes; per-axis prompts can feel long unless you offer a "recommended defaults" shortcut.

### Pattern C — Layered presets / composable add-ons (T3-style)

There is one base template, plus N optional add-ons. Each add-on has its own installer module that mutates the base (`package.json` deps, generated files, env vars, codemods on existing files).

- **Canonical example: `create-t3-app`.** Base = Next.js. Add-ons = `tailwind`, `trpc`, `prisma`, `drizzle`, `nextAuth`, `betterAuth`, `eslint`, `biome`. Each lives in `src/installers/*.ts`. Conditional prompts (only ask DB provider if user picked an ORM) via Clack's `p.group({ ... databaseProvider: ({ results }) => results.database === 'none' ? undefined : p.select(...) })`.
- **Strengths:** scales with new add-ons without proliferating directories; composable.
- **Weaknesses:** installer modules are the highest-engineering pattern — codemods, dep resolution, ordering. T3 has 12 installer files for 8 add-ons. CI matrix testing must enumerate combinations.
- **Adjacent:** `create-astro --add <integrations>` is a milder version of this — post-scaffold add-on layering.

---

## Prompt-UX trends 2024–2026

1. **`@clack/prompts` is the new default.** Adopted by `create-vite` (migrated from `prompts`), `create-t3-app`, `create-cloudflare`. Older CLIs (`create-next-app`, `create-wagmi`, `@rainbow-me/create-rainbowkit`, `shadcn`) still use `prompts` (v2.4.2) but no new scaffolder in 2024+ that I surveyed picks `prompts` over `@clack/prompts`. The pitch: nicer visuals out of the box (no styling per-prompt), `group()` for sequencing with cross-prompt awareness (`({ results }) => ...`), uniform `isCancel()` + `cancel()`/`outro()` helpers, smaller package, native Ctrl+C handling that exits gracefully without leaking cursor state.

2. **Cancel handling is now first-class.** Three patterns:
   - `prompts` lineage: per-prompt `onCancel` callback or top-level `onPromptState` that checks `state.aborted` and re-shows the cursor (`\x1B[?25h`).
   - `@clack/prompts` lineage: `isCancel(value)` after each prompt + a single `cancel(message)` then `process.exit(0)`. Clack's `group()` accepts a top-level `onCancel` that fires once for the whole transaction.
   - Top-level `process.on('SIGINT'/'SIGTERM', () => process.exit(0))` is universal.

3. **Coding-agent awareness is now standard.** Both `create-next-app` (since 16.x) and `create-vite` (since v9) detect agent / non-interactive contexts and either skip prompts or print a hint. Specifically:
   - create-next-app: any `--` flag → skip prompts entirely, use recommended defaults, print summary of which defaults were applied + flag names to override.
   - create-vite: `@vercel/detect-agent` + explicit `--interactive` / `--no-interactive`; prints a one-liner showing the non-interactive form when an agent is detected in TTY mode.
   - The mental model: **CI bots and AI coding agents both need a zero-prompt path**, and that path must be discoverable from the interactive flow.

4. **Saved-preferences is rare but valuable.** Only `create-next-app` does this (`conf` package). It gives a 3-way first prompt (recommended / reuse last / customize) which collapses the interview to one keystroke for repeat users.

5. **Per-pkg-manager command rewriting.** Both create-vite and create-wagmi have a `getFullCustomCommand` that rewrites `npm create`/`npm exec` to `pnpm create`/`pnpm dlx`/`yarn dlx`/`bun x`/`deno run -A npm:`. This is a non-trivial bit of work because pnpm doesn't support `npm create --`, Yarn 1 doesn't support `@latest` in `create`, bun has its own template list, etc. Anyone shipping multi-pm hand-off in 2026 should crib from create-vite's `getFullCustomCommand`.

6. **Color-library choices have splintered.** picocolors (smallest, used by next-app + wagmi), chalk (t3, rainbowkit), kleur (shadcn), node-native `util.styleText` (create-vite). No clear winner. `picocolors` is the most performance-focused.

7. **MCP integration is starting to appear.** shadcn's CLI exposes itself as an MCP server (`shadcn mcp`) with `@modelcontextprotocol/sdk`. This is novel — a scaffolder that an LLM/agent can drive directly.

---

## Common failure modes / gotchas

1. **Package-manager detection.** Every CLI implements this. Most use `process.env.npm_config_user_agent` (`npm/8 ... node/18 ... darwin/arm64`), parsing `pkgSpec.split('/')[0]`. Bun, yarn (v1 vs v3), pnpm, deno all need explicit branching. The full per-pm command-rewrite story (install, run, dlx, exec, create) is at least 30 lines of branching — see `create-vite/src/index.ts:845-924`.

2. **The `_gitignore` / `_npmrc` / `_env.local` trick.** npm's `files` packaging silently strips files starting with a dot. Every scaffolder renames `_gitignore` → `.gitignore` (etc.) at copy time. See `create-vite` (`{_gitignore: '.gitignore'}`), `create-wagmi` (also adds `_env.local`, `_npmrc`), `create-rainbowkit` (uses `_dot_*` → `.*`).

3. **Restoring the terminal cursor after Ctrl+C.** If you only `process.exit()`, the cursor stays hidden because `prompts` (and the underlying enquirer/inquirer libs) hide it during a prompt. create-next-app explicitly writes `\x1B[?25h` before exiting in its `onPromptState`. @clack/prompts handles this internally; with `prompts` you must do it yourself.

4. **Target-directory-not-empty handling.** Three policies observed:
   - Refuse if exists at all (create-cdr-kit-app, create-rainbowkit).
   - Prompt overwrite-or-cancel (create-wagmi).
   - Three-way: cancel / remove existing files / ignore and continue (create-vite, see lines 488-528).
   create-vite specifically handles `.git` — it never removes the `.git` dir even on "yes overwrite", so an existing repo's history survives a re-scaffold.

5. **`commander` negated-flag positional collision.** Per the create-next-app comment at line 117:
   > "Commander does not implicitly support negated options. When they are used by the user they will be interpreted as the positional argument (name) in the action handler."
   Workaround: in `action((name) => { if (name && !name.startsWith('--no-')) projectPath = name })` filter out negation flags from the positional, and scan `process.argv` directly with `args.includes('--no-tailwind')` to detect them.

6. **Git-init failures.** Outside a git context (e.g. inside an existing repo with locked index, on a system without `git`), `git init` can throw. create-rainbowkit calls `execa('git', ['commit', '--no-verify', ...])` to bypass commit hooks; create-t3-app gates the entire git step behind `--noGit` and a confirm prompt.

7. **Yarn 3 silent-broken-ness.** create-t3-app prints an explicit warning if it detects `npm_config_user_agent` starts with `yarn/3` — Yarn Berry's PnP mode breaks its install layout. (See `issue #57` referenced inline.)

8. **`mintty` (Git Bash) is not really a TTY.** create-t3-app detects `TERM_PROGRAM` containing `mintty` and prints a warning + throws `IsTTYError`, falling back to defaults. Otherwise prompts hang.

9. **CI detection.** `ci-info` is the standard lib (used by create-next-app). When `ciInfo.isCI`, skip all prompts and use defaults. This is a hard requirement for setup flows that run in CI matrix tests.

10. **Workspace-dep stripping.** create-rainbowkit's templates list `@rainbow-me/rainbowkit` as a workspace dep (so the in-monorepo template stays in sync). At publish/scaffold time it deletes that dep so the user's install resolves the latest npm version instead. Easy to miss; will produce confusing errors in user installs if you forget.

11. **`-y, --yes` is overloaded.** In create-next-app, `--yes` means "use saved preferences or defaults"; in shadcn, `--yes` is default-true (!) and you set it to silently skip confirmation; in create-astro, `-y` is "accept all defaults". The CLI-flag norms across the ecosystem are not uniform.

12. **Auto-update notifications.** create-next-app runs `update-check` in the background and notifies on exit, but **only against the matched dist-tag** (`canary` users get canary update notices, not "downgrade" to stable). The dist-tag inference is regex-based: `version.match(/-([a-z]+)/)`.

---

## What `create-cdr-kit-app` does today

File: `/Users/abu/dev/hackathon/story-cdr/packages/create-cdr-kit-app/src/index.ts` (69 lines)
Package: `/Users/abu/dev/hackathon/story-cdr/packages/create-cdr-kit-app/package.json`

It is a **zero-dependency, single-template, non-interactive** scaffolder. The published `bin` is `create-cdr-kit-app: ./dist/index.mjs` (no `wagmi`-style shortname). Invoked as `create-cdr-kit-app <dir>` (positional only), it refuses if the target exists, then writes four inline string-literal files: `package.json` (with `@cdr-kit/core` + `consola` + `tsx` + `typescript`), `tsconfig.json`, `src/index.ts` (a mock-mode demo that calls `createMockCdrKit().createVault()` then `accessVault()` with a progress callback), `README.md`, and `.gitignore`. No prompts, no flags, no package-manager detection, no auto-install, no auto-git, no template directory, no `--example`. The exported `scaffold(target)` is unit-testable; the CLI invocation guard at the bottom (`if (process.argv[1] === fileURLToPath(import.meta.url))`) skips when imported. No `engines` field for the bin host other than `engines.node >= 20` at the package level. The success line is `✓ scaffolded <dir>\n  cd <dir> && pnpm install && pnpm start`.
