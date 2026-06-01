# @cdr-kit/site

## 0.0.3

### Patch Changes

- cdr-kit 0.5.1 — post-publish audit fixes + missing MultiSig signer surface.

  **Stop-the-bleed (user-visible copy was lying):**
  - Landing page conditions strip — replaced the "Revocable · MultiSig · TimeBound roadmap" row (which claimed shipped 0.5 features were still on the roadmap) with 4 individual rows for `TimeWindowCondition`, `DeadManSwitchCondition`, `ConditionalEscrowCondition`, `MultiSigCondition`, each with their live Aeneid address + "new · 0.5" badge.
  - `/docs` landing — version badge `v0.1.0` → `v0.5.0`; package list bumped from "12 packages, v0.1.0" to "15 packages, v0.5.0"; added missing entries for `@cdr-kit/story`, `@cdr-kit/react-ui`, `@cdr-kit/cli`.
  - Storage page — promoted the "Ecosystem adapters (planned)" placeholder to 3 separate documented sections for `createS3Storage`, `createStorachaStorage`, `createHeliaStorage` with real code examples + peer-dep notes. Decision tree updated 5 → 8 adapter rows.

  **@cdr-kit/story completeness:**
  - Shipped `packages/story/README.md` (previously the npm tarball had zero docs). Covers every export with example + return shape, a full PIL flavor decision tree, and the `agent.publish()` one-shot pointer.
  - 5 NEW docs pages for the previously-undocumented Story IP React hooks: `useStoryClient`, `useRegisterIp`, `useMintLicenseToken`, `useAttachLicenseTerms`, `usePublish`. Sidebar STORY IP group extended; prev/next chain wires through.

  **Missing MultiSig signer surface (the off-chain path was producer-less in React):**
  - NEW `useSignMultiSigApproval(uuid, address?)` hook — produces an EIP-712 `Approval(uuid, caller, epoch, deadline)` signature for a multi-sig vault. Reads epoch from `getConfig` immediately before signing so the sig is bound to the signer set the signer is currently approving (a racing `rotateSigners` invalidates the sig at submit time via the EpochChanged check). Returns `{ sign, signature, isLoading, error }`.
  - NEW `<MultiSigSigner uuid />` headless render-prop component wrapping the hook. Default render: "sign approval" button → on click signs EIP-712 → shows the 65-byte sig + copy-to-clipboard + re-sign controls. Render-prop receives `{ sign, signature, isLoading, error, onSign }` for custom UIs.
  - Both fill the producer side of the off-chain dual-path flow — pair with `<MultiSigApprovalTracker>` (read-side aggregator) and `agent.accessMultiSig({uuid, deadline, sigs[]})` (buyer submission).

  **Scaffolder template bump:**
  - `create-cdr-kit-app` had `CDR_VERSION = "^0.3.0"` baked into its templates; every scaffolded project was pulling 2-minor-versions-stale deps. Bumped to `^0.5.0` (this is the patch bump on `create-cdr-kit-app`).

  **Internal hygiene:**
  - Extracted the MultiSig hook family (`useMultiSigStatus + useApproveMultiSig + useSignMultiSigApproval + useRotateMultiSigSigners`) into `packages/react/src/multi-sig-hooks.ts`. `condition-hooks.ts` was over the 400-line cap once the new sign hook landed; splitting by condition family also matches how the contracts are organized.

  **Verification:** workspace gate green (typecheck 23/23, lint 16/16, test 21/21). Live e2e: CLI installed from npm in fresh /tmp dir, all 11 skills present, `cdr` commands work. Off-chain MultiSig sig path validated end-to-end against the deployed `0x3A0Cf72f…` MultiSig (vault uuid=4902, 2-of-2 sigs PASS, 1-of-2 FAIL).

## 0.0.2

### Patch Changes

- Updated dependencies
  - @cdr-kit/core@0.2.0
  - @cdr-kit/contracts@0.2.0
  - @cdr-kit/react@0.2.0
  - @cdr-kit/react-ui@1.0.0

## 0.0.1

### Patch Changes

- Updated dependencies
  - @cdr-kit/react-ui@0.1.0
