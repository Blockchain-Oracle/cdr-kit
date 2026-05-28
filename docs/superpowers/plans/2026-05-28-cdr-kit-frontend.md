# cdr-kit Frontend Implementation Plan

> **Execution mode:** Inline by Claude (Abu wants direct control over premium visual quality + dogfooding feedback). Deterministic library tasks (Phase 0) are TDD with full code. UI tasks (Phases 1–8) are milestone-structured with exact files + **browser/vision verification gates** — UI correctness is verified visually (Playwright screenshot → anchor-diff → fresh-context vision review), not by unit tests. Steps use `- [ ]` for tracking.

**Goal:** Ship `apps/web` — a single Next.js app whose home (`/`) is a premium marketing landing and whose `(app)` routes are the data-marketplace dashboard built on `@cdr-kit/react`, plus three light `@cdr-kit/core`/`react` improvements. (`apps/docs` Fumadocs = separate plan.)

**Architecture:** One Next.js App Router app, route groups `(marketing)` (landing at `/`) and `(app)` (marketplace/vault/create/seller/buyer). Provider stack `Privy → Wagmi → Query → CdrProvider`, mock-first with live-Aeneid toggle. Premium visuals built on top of the headless `@cdr-kit/react` primitives (wagmi→RainbowKit split). Spec: `../specs/2026-05-28-cdr-kit-frontend-design.md`; decisions D1–D19.

**Tech Stack:** Next.js 15 (App Router) · Tailwind v4 · Privy · wagmi/viem · @tanstack/react-query · @cdr-kit/{react,core,contracts} · premium-ui registries (21st.dev / Aceternity / Magic UI / Motion-Primitives) · Playwright (visual loop) · pnpm + Turborepo.

**Design language (north star for premium work):** dark-first "confidential data" aesthetic — deep ink background, one signal accent for the decryption/unlock motion (electric cyan/violet), monospace for keys/uuids/hashes, motion that evokes *assembling shards* (partial-collection → reveal). Light toggle. Distinct from generic shadcn slop.

---

## File Structure

**Library (Phase 0):**
- Modify: `packages/core/src/flows.ts` — add `onProgress` to `accessVault`; add `prefetchVault` helper.
- Create: `packages/core/test/flows.test.ts` — unit tests for `accessVault` onProgress (fake consumer).
- Create: `packages/react/src/use-discover-vaults.ts` — historical `getLogs` discovery hook.
- Modify: `packages/react/src/index.ts` — export the new hook.
- Create: `packages/react/test/discover.test.tsx` — hook test with a fake public client.
- Create: `packages/react/styles.css` — opt-in default stylesheet (CSS-vars).
- Modify: `packages/react/package.json` — export `./styles.css`.

**App (Phases 1–8):**
```
apps/web/
  package.json  next.config.ts  tsconfig.json  tailwind/  postcss  .env.example
  playwright.config.ts  tests/visual/   anchors/
  app/
    layout.tsx                      # providers + html shell
    providers.tsx                   # Privy→Wagmi→Query→CdrProvider (degrade-to-mock)
    globals.css
    (marketing)/
      layout.tsx  page.tsx          # /  landing  (+ marketing nav/footer)
    (app)/
      layout.tsx                    # app chrome: wallet header + sidebar
      marketplace/page.tsx          # /marketplace
      vault/[uuid]/page.tsx         # /vault/:uuid
      create/page.tsx               # /create
      seller/page.tsx               # /seller
      buyer/page.tsx                # /buyer
  src/
    lib/use-cdr-data.ts             # mock|live abstraction over @cdr-kit/react + mock kit
    mock/seed.ts                    # ~6 data-marketplace demo vaults
    components/                     # premium presentational layer (the "RainbowKit for CDR")
      vault-card.tsx  access-stepper.tsx  condition-badge.tsx  create-wizard/*  ...
```

---

## Phase 0 — Library improvements (TDD)

### Task 0.1: `accessVault` gains `onProgress` + a `prefetchVault` warm-up

**Files:**
- Modify: `packages/core/src/flows.ts`
- Test: `packages/core/test/flows.test.ts` (create)

**Honest scope:** the SDK's `accessCDR` has no per-tick progress and `collectPartials` doesn't expose counts, so determinate `collected/threshold` stays mock-only. This adds (1) symmetric phase `onProgress` (`collecting-partials` → `ready`) so the live stepper is driven by core, not just the hook, and (2) `prefetchVault` (wraps `consumer.prefetchRegistry()`) to warm the validator cache and cut first-read stall.

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/test/flows.test.ts
import { describe, it, expect, vi } from "vitest";
vi.mock("../src/wasm.js", () => ({ ensureWasm: vi.fn().mockResolvedValue(undefined) }));
import { accessVault } from "../src/flows.js";

function fakeClient(dataKey: Uint8Array) {
  return {
    cdr: {
      consumer: {
        accessCDR: vi.fn().mockResolvedValue({ dataKey, txHash: "0xabc" }),
        prefetchRegistry: vi.fn().mockResolvedValue(undefined),
      },
    },
  } as never;
}

describe("accessVault onProgress", () => {
  it("emits collecting-partials then ready around the read", async () => {
    const steps: string[] = [];
    const out = await accessVault(fakeClient(new Uint8Array([1, 2, 3])), {
      uuid: 7,
      onProgress: (s) => steps.push(s),
    });
    expect(Array.from(out)).toEqual([1, 2, 3]);
    expect(steps).toEqual(["collecting-partials", "ready"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cdr-kit/core exec vitest run test/flows.test.ts`
Expected: FAIL — `accessVault` ignores `onProgress` (no such param) → `steps` is `[]`.

- [ ] **Step 3: Implement** — add `onProgress?: ProgressFn` to `accessVault` params; emit around the call:

```ts
// in accessVault params type: add `onProgress?: ProgressFn;`
export async function accessVault(
  client: CdrKitClient,
  params: { uuid: number; accessAuxData?: Hex; timeoutMs?: number; onProgress?: ProgressFn },
): Promise<Uint8Array> {
  await ensureWasm();
  const timeoutMs = params.timeoutMs ?? 600_000;
  params.onProgress?.("collecting-partials");
  try {
    const { dataKey } = await client.cdr.consumer.accessCDR({
      uuid: params.uuid,
      accessAuxData: params.accessAuxData ?? "0x",
      timeoutMs,
    });
    params.onProgress?.("ready");
    return dataKey;
  } catch (e) {
    if (e instanceof EmptyVaultError) throw CdrErrors.vaultNotFound(params.uuid);
    if (e instanceof PartialCollectionTimeoutError) throw CdrErrors.readTimeout(timeoutMs, e);
    if (CdrError.is(e)) throw e;
    throw CdrErrors.keeperUnavailable(e);
  }
}

/** Warm the validator registry/attestation cache so the next access returns from a warm cache. */
export async function prefetchVault(client: CdrKitClient): Promise<void> {
  await client.cdr.consumer.prefetchRegistry().catch(() => undefined);
}
```

- [ ] **Step 4: Run tests** — `pnpm --filter @cdr-kit/core exec vitest run test/flows.test.ts` → PASS. Then full core: `pnpm --filter @cdr-kit/core test` → all green.
- [ ] **Step 5: Thread into the hook** — in `packages/react/src/hooks.ts`, `useAccessVault` live branch: pass `onProgress` that maps the step to determinate-free state:

```ts
: await accessVault(requireClient(client), {
    uuid, accessAuxData,
    onProgress: (s) => setState({ status: s === "ready" ? "ready" : "collecting-partials" }),
  });
```
(Keep the final `setState({status:"ready", data})` — onProgress("ready") is belt-and-suspenders.)

- [ ] **Step 6: typecheck + commit**

```bash
pnpm --filter @cdr-kit/core --filter @cdr-kit/react typecheck
git add packages/core/src/flows.ts packages/core/test/flows.test.ts packages/react/src/hooks.ts
git commit -m "feat(core): accessVault onProgress + prefetchVault warm-up"
```

### Task 0.2: `useDiscoverVaults` — historical `getLogs` discovery

**Files:**
- Create: `packages/react/src/use-discover-vaults.ts`
- Modify: `packages/react/src/index.ts` (add `export * from "./use-discover-vaults";`)
- Test: `packages/react/test/discover.test.tsx` (create)

**Why:** `useVaultEvents` is watch-only (new events). Browse needs *history* — a bounded, paginated `getLogs` over `CdrKitVault.VaultCreated` (D11). Returns the same `VaultCreatedEvent` shape as `useVaultEvents`.

- [ ] **Step 1: Write the failing test** (fake public client returning two logs):

```tsx
// packages/react/test/discover.test.tsx
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const getLogs = vi.fn().mockResolvedValue([
  { args: { tokenId: 1n, uuid: 9001, ipId: "0xip1", creator: "0xc1" } },
  { args: { tokenId: 2n, uuid: 9002, ipId: "0xip2", creator: "0xc2" } },
]);
const getBlockNumber = vi.fn().mockResolvedValue(1000n);
vi.mock("wagmi", () => ({
  usePublicClient: () => ({ getLogs, getBlockNumber }),
}));

import { useDiscoverVaults } from "../src/use-discover-vaults.js";

describe("useDiscoverVaults", () => {
  it("loads historical VaultCreated logs", async () => {
    const { result } = renderHook(() => useDiscoverVaults());
    await waitFor(() => expect(result.current.vaults.length).toBe(2));
    expect(result.current.vaults[0].uuid).toBe(9001);
  });
});
```

- [ ] **Step 2: Run** `pnpm --filter @cdr-kit/react exec vitest run test/discover.test.tsx` → FAIL (module not found).
- [ ] **Step 3: Implement**

```ts
// packages/react/src/use-discover-vaults.ts
"use client";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { getAbiItem, type Hex } from "viem";
import { cdrKitVaultAbi, aeneid } from "@cdr-kit/contracts";
import type { VaultCreatedEvent } from "./hooks.js";

const EVENT = getAbiItem({ abi: cdrKitVaultAbi, name: "VaultCreated" });
const MAX_RANGE = 9_000n; // free-RPC eth_getLogs window guard (D11)

export function useDiscoverVaults(opts: { fromBlock?: bigint } = {}) {
  const client = usePublicClient();
  const [vaults, setVaults] = useState<VaultCreatedEvent[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (!client) return;
    let active = true;
    (async () => {
      try {
        const latest = await client.getBlockNumber();
        const start = opts.fromBlock ?? (latest > MAX_RANGE ? latest - MAX_RANGE : 0n);
        const out: VaultCreatedEvent[] = [];
        for (let from = start; from <= latest; from += MAX_RANGE + 1n) {
          const to = from + MAX_RANGE > latest ? latest : from + MAX_RANGE;
          const logs = await client.getLogs({ address: aeneid.cdrKitVault as Hex, event: EVENT, fromBlock: from, toBlock: to });
          for (const l of logs) {
            const a = (l as { args: { tokenId: bigint; uuid: number; ipId: Hex; creator: Hex } }).args;
            out.push({ tokenId: a.tokenId, uuid: Number(a.uuid), ipId: a.ipId, creator: a.creator });
          }
        }
        if (active) setVaults(out);
      } catch (e) {
        if (active) setError(e as Error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [client, opts.fromBlock]);

  return { vaults, isLoading, error };
}
```

- [ ] **Step 4: Run** the test → PASS; then `pnpm --filter @cdr-kit/react test` → all green; `pnpm --filter @cdr-kit/react typecheck`.
- [ ] **Step 5: Commit**

```bash
git add packages/react/src/use-discover-vaults.ts packages/react/src/index.ts packages/react/test/discover.test.tsx
git commit -m "feat(react): useDiscoverVaults historical getLogs discovery (D11)"
```

### Task 0.3: opt-in default stylesheet `@cdr-kit/react/styles.css`

**Files:**
- Create: `packages/react/styles.css`
- Modify: `packages/react/package.json` (add `"./styles.css": "./styles.css"` to `exports`; include in `files`)

**Why:** headless components look bare by default. A consumer-opt-in stylesheet themes the existing `data-cdr-*` hooks + `--cdr-*` vars — tasteful defaults, zero JS/deps, fully overridable.

- [ ] **Step 1: Write the stylesheet** (targets `[data-cdr-root]`, `[data-cdr-skeleton]`, `[data-cdr-empty]`, `[data-cdr-inspector]`; defines `--cdr-*` defaults + a shimmer keyframe; respects `prefers-reduced-motion`). Keep < 80 lines.
- [ ] **Step 2: Export it** — add to `package.json` `exports` and `files`. Verify the tarball includes it:

Run: `pnpm --filter @cdr-kit/react exec publint`
Expected: "All good!" (no export resolution errors).

- [ ] **Step 3: Manual check** — `import "@cdr-kit/react/styles.css"` resolves from a consumer (will be exercised by `apps/web` in Phase 1).
- [ ] **Step 4: Commit**

```bash
git add packages/react/styles.css packages/react/package.json
git commit -m "feat(react): opt-in default stylesheet (themeable via --cdr-* vars)"
```

---

## Phase 1 — `apps/web` foundation

### Task 1.1: Scaffold the app into the workspace
- [ ] Add `apps/*` to `pnpm-workspace.yaml`.
- [ ] Create `apps/web` Next.js (App Router, TS, Tailwind v4) — minimal `package.json` (Next 15, react 19, deps on `@cdr-kit/react @cdr-kit/core @cdr-kit/contracts` via `workspace:*`, `@privy-io/react-auth`, `wagmi`, `viem`, `@tanstack/react-query`), `next.config.ts`, `tsconfig.json` extending base, `app/layout.tsx` + `app/globals.css` + a placeholder `(marketing)/page.tsx`.
- [ ] Add a turbo `dev`/`build` pipeline entry if needed. Confirm `pnpm --filter web dev` boots and `/` renders.
- [ ] **Verify (browser):** Playwright/Chrome-DevTools screenshot of `/` placeholder loads with no console errors. **Commit.**

### Task 1.2: Provider stack (`app/providers.tsx`) with Privy degrade-to-mock
- [ ] `PrivyProvider` (appId from `NEXT_PUBLIC_PRIVY_APP_ID`; if unset, skip Privy and render children with a mock-connect context) → `WagmiProvider` (aeneid chain) → `QueryClientProvider` → `CdrProvider`.
- [ ] `CdrProvider`: `mockKit = NEXT_PUBLIC_CDR_API_URL ? undefined : createMockCdrKit({ readDelayMs: 2500, threshold: 5 })`; pass `apiUrl` + the dark `appearance` tokens.
- [ ] `import "@cdr-kit/react/styles.css"` in `globals.css`/layout (exercises Task 0.3).
- [ ] **Verify (browser):** app boots in mock mode with no wallet; a "Connect" affordance shows. **Commit.**

### Task 1.3: Design system + premium-ui setup
- [ ] **Invoke the `premium-ui` skill** to set up the registry tooling (components.json / Magic MCP) and install the foundational primitives (button, card, badge, dialog, tabs, input, sonner/toast) + the design tokens (dark-first palette, the signal accent, fonts incl. a mono for keys).
- [ ] Establish `globals.css` tokens + a small `cn()` util. Define the `--cdr-*` overrides to match the app theme.
- [ ] **Verify (browser):** a `/_kitchen-sink` route renders the installed primitives correctly (delete before ship). **Commit.**

### Task 1.4: Visual loop (day-0 anti-slop)
- [ ] Wire `apps/web/playwright.config.ts` + `tests/visual/` capture script + an `anchors/` dir; add a screenshot→anchor-diff step and the fresh-context vision-review (use `sahil-visual-loop` / `sahil-anti-slop-audit`).
- [ ] Capture the first anchor (the kitchen-sink or landing placeholder).
- [ ] **Commit.**

---

## Phase 2 — Data layer + mock seed

### Task 2.1: `useCdrData` abstraction + mock seed
- [ ] `src/mock/seed.ts`: ~6 data-marketplace vaults (price feed, dataset sample, research PDF, model weights, API key bundle, geo dataset) — each `{ uuid, title, dataType, condition: 'subscription'|'tiergate'|'composable', price, subscribers, creator, description, preview }`. Seed them into a `createMockCdrKit` store on init so `accessVault` returns real bytes.
- [ ] `src/lib/use-cdr-data.ts`: a thin layer exposing `useVaults()` (mock seed | `useDiscoverVaults`), `useVaultDetail(uuid)`, and re-exporting `useAccessVault`/`useSubscribeAndAccess`/`useCreateVault` so screens never branch on mode.
- [ ] **Verify:** a temporary debug render lists the 6 seeded vaults. **Commit.**

---

## Phase 3 — Marketplace (`/marketplace`)
**Files:** `app/(app)/layout.tsx` (wallet header + sidebar nav), `app/(app)/marketplace/page.tsx`, `src/components/vault-card.tsx`, `condition-badge.tsx`, `filters.tsx`.
- [ ] App chrome: sidebar (Marketplace / Create / Seller / Buyer) + wallet header (Privy connect or mock).
- [ ] Premium `VaultCard` (title, data-type, condition badge, price, #subs, creator) via premium-ui; responsive grid; filters (condition/price/type). Empty + loading (skeleton) states.
- [ ] Click → `/vault/[uuid]`.
- [ ] **Verify (browser + vision pass):** grid renders 6 cards in mock mode, filters work, no slop, no console errors; screenshot diffed vs anchor. **Commit.**

## Phase 4 — Vault detail + access stepper (`/vault/[uuid]`) — THE critical screen
**Files:** `app/(app)/vault/[uuid]/page.tsx`, `src/components/access-stepper.tsx`, `condition-explainer.tsx`, `data-viewer.tsx`.
- [ ] Metadata + condition in plain language ("Subscribe 10 IP / 30 days" etc.).
- [ ] CTA by state: not-connected → Connect; connected+unsatisfied → Subscribe/Mint; satisfied → Access.
- [ ] **AccessStepper**: drives off `useAccessVault`/`useSubscribeAndAccess` status — `Paying ▸ Collecting partials ▸ Decrypting ▸ Done`; determinate bar in mock (collected/threshold), honest indeterminate-within-phase in live; the *shard-assembly* motion. Result renders (text/JSON) or downloads (file). Never a bare spinner.
- [ ] **Verify (browser + vision pass):** mock access plays the full stepper to a revealed payload in ~2.5s; error path shows a human `CdrError` message; screenshot diffed. **Commit.**

## Phase 5 — Create wizard (`/create`)
**Files:** `app/(app)/create/page.tsx`, `src/components/create-wizard/{data-step,condition-step,terms-step,review-step}.tsx`.
- [ ] 3 steps: data (textarea/upload; auto "≤1KB inline vs >1KB file/IPFS" note); condition (dynamic form — Subscription: price+period+mode; TierGate: allowed PIL tiers; Composable: AND/OR combine); IP/PIL terms + allocate fee (msg.value). Review → submit.
- [ ] Mock submit → returns a uuid + shareable `/vault/[uuid]` link; live submit → `useCreateVault` (gas 3M).
- [ ] **Verify (browser + vision pass):** full wizard completes in mock, produces a vault that then appears in Marketplace/Buyer flows; screenshot diffed. **Commit.**

## Phase 6 — Seller dashboard (`/seller`)
**Files:** `app/(app)/seller/page.tsx`, `src/components/event-log.tsx`, `revenue-stat.tsx`.
- [ ] Vault list w/ subscriber count, revenue, condition; **payment/subscription event log** (D11 — explicitly labeled "payments & subscriptions", NOT who-decrypted). Manage = pause new subs (mock).
- [ ] **Verify (browser + vision pass):** seller's created vaults + a mock event log render; D11 framing visible. **Commit.**

## Phase 7 — Buyer dashboard (`/buyer`)
**Files:** `app/(app)/buyer/page.tsx`, `src/components/subscription-card.tsx`.
- [ ] Active subs w/ expiry countdown, one-click renew, re-access (re-opens the stepper), payment history.
- [ ] **Verify (browser + vision pass):** active subscription with countdown + renew + re-access works in mock. **Commit.**

## Phase 8 — Marketing landing (`/`)
**Files:** `app/(marketing)/layout.tsx` (marketing nav/footer), `app/(marketing)/page.tsx`, `src/components/landing/*`.
- [ ] Premium landing reusing the design system: hero ("the Stripe for CDR" / confidential-data motion), feature bento (conditions stdlib · React layer · agent kit · dashboard), a live code sample, package grid, the autonomous-agent demo highlight, CTAs → `/marketplace` + docs.
- [ ] **Verify (browser + vision pass + Lighthouse):** landing is distinct + production-grade, responsive, fast; screenshot diffed; vision review passes the no-slop bar. **Commit.**

---

## Phase 9 — Final verification
- [ ] `pnpm build && pnpm typecheck && pnpm lint` green across the workspace (apps included).
- [ ] Full visual/anti-slop pass on every screen; capture submission screenshots.
- [ ] (When a funded Aeneid key is available) live e2e: create (wallet A) → subscribe+access (wallet B) round-trip with the stepper.
- [ ] Update root `README.md` "dashboard is the remaining piece" line.

**Then:** `apps/docs` (Fumadocs) — its own brainstorm + plan (sub-project #3).

---

## Self-review notes
- **Spec coverage:** all 5 screens + landing (IA corrected: `/`=landing), the 3 library improvements, mock-first/live-toggle, Privy degrade, D11 event-log framing, visual loop — each mapped to a task. ✓
- **Honesty:** improvement (c) is scoped to phase-progress + prefetch (determinate live counts not feasible via the SDK) — stated in Task 0.1 rather than overclaimed. ✓
- **Type consistency:** `VaultCreatedEvent` reused from `hooks.ts` in `use-discover-vaults.ts`; `ProgressFn`/`AccessStep` reused from `flows.ts`. ✓
