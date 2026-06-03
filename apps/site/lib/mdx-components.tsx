import type { MDXComponents } from "mdx/types";

// docs primitives — these stay 100% custom (zero fumadocs-ui)
import { Demo } from "@/components/docs/demo";
import { PropsTable } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";
import { Callout } from "@/components/docs/parts";

// primitives
import { Badge } from "@/components/primitives/badge";
import { CopyButton } from "@/components/primitives/copy-button";
import { CopyLine } from "@/components/primitives/copy-line";

// gallery + docs demos — registered so MDX can reference them without imports
import { SubscribeButtonDemo } from "@/components/gallery/subscribe-button-demo";
import { AccessStepperDemo } from "@/components/gallery/access-stepper-demo";
import { VaultGateDemo } from "@/components/docs/demos/vault-gate-demo";
import { UnlockableDemo } from "@/components/docs/demos/unlockable-demo";
import { HeartbeatTimerDemo } from "@/components/docs/demos/heartbeat-timer-demo";
import { TimeWindowBadgeDemo } from "@/components/docs/demos/time-window-badge-demo";
import { MultiSigApprovalTrackerDemo } from "@/components/docs/demos/multi-sig-approval-tracker-demo";
import { MultiSigSignerDemo } from "@/components/docs/demos/multi-sig-signer-demo";
import { EscrowDeliveryConfirmDemo } from "@/components/docs/demos/escrow-delivery-confirm-demo";
import {
  CdrInspectorDemo,
  CdrSkeletonDemo,
  EmptyVaultsDemo,
} from "@/components/docs/demos/headless-demos";

/**
 * Components available to every MDX page without per-file imports.
 * Adding a new demo component? Register it here.
 */
export function getMDXComponents(): MDXComponents {
  return {
    Demo,
    PropsTable,
    CodePanel,
    Callout,
    Badge,
    CopyButton,
    CopyLine,
    SubscribeButtonDemo,
    AccessStepperDemo,
    VaultGateDemo,
    UnlockableDemo,
    HeartbeatTimerDemo,
    TimeWindowBadgeDemo,
    MultiSigApprovalTrackerDemo,
    MultiSigSignerDemo,
    EscrowDeliveryConfirmDemo,
    CdrInspectorDemo,
    CdrSkeletonDemo,
    EmptyVaultsDemo,
  };
}
