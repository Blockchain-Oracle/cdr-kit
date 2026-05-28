# Build Stack — 2026 best practices (researched; don't re-google)

Several reversals from pre-2026 advice are flagged ⚠️. Confirm fast-moving flags against current docs at scaffold time.

## Monorepo: pnpm workspaces + Turborepo
Default for TS-heavy monorepo with one Solidity corner. Nx = overkill (<10 pkgs); Bun workspaces still rough for *publishing*. Foundry is a workspace package but built via `forge`, not Turbo's JS pipeline (Turbo just orchestrates `forge build` + ABI export).
- ⚠️ Lerna is dead → **Changesets** for versioning. (Nx has `nx release`; we don't need Nx.)

```
cdr-kit/
├─ pnpm-workspace.yaml         # packages: ['packages/*','apps/*','contracts']
├─ turbo.json
├─ contracts/                  # Foundry (foundry.toml, src/, test/, script/)
├─ packages/
│  ├─ contracts/  @cdr-kit/contracts  # generated ABIs+addresses+bindings (pure TS)
│  ├─ core/       @cdr-kit/core       # viem-based SDK
│  ├─ react/      @cdr-kit/react      # hooks+components (peer wagmi/viem/react/@tanstack)
│  └─ agent/      @cdr-kit/agent
└─ apps/
   └─ dashboard/                      # Next.js (flagship)
```
`turbo.json` — topological build + contracts→bindings handoff:
```json
{ "$schema":"https://turborepo.com/schema.json",
  "tasks": {
    "build": { "dependsOn":["^build"], "outputs":["dist/**"] },
    "contracts#build": { "outputs":["out/**","broadcast/**"] },
    "lint": {}, "typecheck": { "dependsOn":["^build"] }, "test": { "dependsOn":["^build"] }
  } }
```

## Bundler: ⚠️ tsdown (NOT tsup)
tsup is now unmaintained; **tsdown** (Rolldown-based) is the drop-in successor — faster, ESM-first, auto-generates `exports`. Old advice says tsup; don't follow it.
```ts
// packages/core/tsdown.config.ts
import { defineConfig } from 'tsdown'
export default defineConfig({ entry:['src/index.ts'], format:['esm','cjs'], dts:true, treeshake:true, exports:true })
```
Published `exports` map (ESM-first, `types` first per resolution rules), `sideEffects:false` for tree-shaking:
```jsonc
{ "name":"@cdr-kit/core","type":"module","sideEffects":false,
  "exports":{ ".":{ "import":{"types":"./dist/index.d.ts","default":"./dist/index.js"},
                    "require":{"types":"./dist/index.d.cts","default":"./dist/index.cjs"} },
              "./package.json":"./package.json" },
  "main":"./dist/index.cjs","module":"./dist/index.js","types":"./dist/index.d.ts","files":["dist"] }
```
Validate pre-publish in CI: **`publint`** + **`@arethetypeswrong/cli`** (`attw --pack`).

## CI/CD: GitHub Actions + Changesets + ⚠️ npm OIDC (no NPM_TOKEN)
npm now supports OIDC trusted publishing → drop stored tokens. Needs `id-token: write` + Node ≥22 (use 24) + repo registered as trusted publisher on npmjs. ⚠️ name the script `release`, NOT `publish` (npm intercepts `publish`).
```yaml
# ci.yml
name: CI
on: { push: { branches:[main] }, pull_request: {} }
jobs:
  verify:
    runs-on: ubuntu-latest
    strategy: { matrix: { task: [lint, typecheck, test, build] } }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run ${{ matrix.task }}
```
```yaml
# release.yml
name: Release
on: { push: { branches:[main] } }
concurrency: ${{ github.workflow }}-${{ github.ref }}
permissions: { contents: write, pull-requests: write, id-token: write }   # OIDC
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - uses: changesets/action@v1
        with: { publish: pnpm release }   # = "turbo run build && changeset publish"
        env: { GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} }
```
Foundry CI = separate job: `foundry-rs/foundry-toolchain@v1` then `forge test`.

## 400-line cap (Abu's rule): ESLint flat config + lefthook
⚠️ flat config (`eslint.config.js`) is the 2026 default (`.eslintrc` legacy). `max-lines` default is 300 → set 400.
```js
// eslint.config.js
export default [{ rules: {
  'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
}}]
```
Enforced in CI `lint` task AND pre-commit. ⚠️ **lefthook** rising over husky+lint-staged (Go, parallel, built-in staged filtering; both still valid):
```yaml
# lefthook.yml
pre-commit:
  parallel: true
  commands:
    lint:   { glob: "*.{ts,tsx}", run: "pnpm eslint {staged_files}" }
    format: { glob: "*.{ts,tsx,json,md}", run: "pnpm prettier --check {staged_files}" }
```

## Verify-before-locking (fast-moving)
- tsdown `"use client"`/`unbundle` flag names move fast — pin a version, confirm in `react-sdk-packaging.md`.
- tsdown `exports:true` may write to `publishConfig` — review with `publint` before first publish.
- Confirm npm OIDC enabled for the org + repo registered as trusted publisher (account-side, not just YAML).
