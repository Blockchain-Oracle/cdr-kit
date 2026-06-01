import { aeneid } from "@cdr-kit/contracts";
import type { ReactNode } from "react";
import { Badge } from "../primitives/badge";

function trunc(addr: string): string {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

interface RowProps {
  name: string;
  highlight?: boolean;
  badge: string;
  badgeTone?: "live" | "primary" | "warn";
  address: string;
  soon?: boolean;
  children: ReactNode;
}

function CondRow({ name, highlight = false, badge, badgeTone = "live", address, soon = false, children }: RowProps) {
  return (
    <div className={soon ? "cond soon" : "cond"}>
      <div className="cond-top">
        <span className="cond-name" style={highlight ? { color: "var(--primary)" } : undefined}>
          {name}
        </span>
        <Badge tone={badgeTone}>{badge}</Badge>
      </div>
      <p>{children}</p>
      <span className="addr">{address}</span>
    </div>
  );
}

export function Conditions() {
  return (
    <section className="section" id="conditions">
      <div className="container">
        <div className="sec-head reveal">
          <span className="eyebrow">
            <span className="tick">▚</span>Condition standard library
          </span>
          <h2 className="h-sec">
            Composable access rules,
            <br />
            deployed and tested.
          </h2>
          <p className="lede">
            Every vault&apos;s read &amp; write access is a <span className="mono" style={{ color: "var(--ink)" }}>view</span> function the
            validator network calls. cdr-kit ships a standard library — typed, tested, and addressed in{" "}
            <span className="mono" style={{ color: "var(--ink)" }}>@cdr-kit/contracts</span>.
          </p>
        </div>
        <div className="cond-list reveal">
          <CondRow name="SubscriptionCondition" highlight badge="deployed" address={aeneid.subscriptionCondition}>
            Recurring paid access — price per period, period length, payee, native-IP or WIP-royalty mode.
          </CondRow>
          <CondRow name="TierGateCondition" badge="deployed" address={aeneid.tierGateCondition}>
            Gate by a held Story IP license-token tier. License-aware access, natively on chain.
          </CondRow>
          <CondRow name="ComposableCondition" badge="deployed" address={aeneid.composableCondition}>
            Boolean AND / OR over child conditions, up to 8 deep. Subscription <span className="mono">OR</span> tier, royalty{" "}
            <span className="mono">AND</span> license.
          </CondRow>
          <CondRow
            name="CreatorWrite / Open"
            badge="deployed"
            address={`${trunc(aeneid.creatorWriteCondition)} · ${trunc(aeneid.openCondition)}`}
          >
            Gate writes to the vault creator, or open access as a sanity / fallback condition.
          </CondRow>
          <CondRow name="CdrKitVault" highlight badge="factory" badgeTone="primary" address={aeneid.cdrKitVault}>
            One tx: mint the vault NFT, register it as Story IP, allocate the CDR slot, set the read condition, attach PIL terms.
          </CondRow>
          <CondRow name="TimeWindowCondition" badge="new · 0.5" badgeTone="primary" address={aeneid.timeWindowCondition}>
            Reads gated to an absolute <span className="mono">[startTs, endTs]</span> window. <span className="mono">endTs=0</span> = open-ended.
            Release-on-date drops, embargoes, scheduled publication, time-bound previews.
          </CondRow>
          <CondRow name="DeadManSwitchCondition" badge="new · 0.5" badgeTone="primary" address={aeneid.deadManSwitchCondition}>
            Auto-unlock to heirs (or public) if the creator stops <span className="mono">poke()</span>-ing within{" "}
            <span className="mono">duration</span>. The canonical wallet-recovery + leak-on-disappearance pattern.
          </CondRow>
          <CondRow name="ConditionalEscrowCondition" badge="new · 0.5" badgeTone="primary" address={aeneid.conditionalEscrowCondition}>
            Buyer pays → confirms delivery → seller is paid + buyer reads. Optional arbiter for disputes; seller can
            claim after a buyer-silence timeout.
          </CondRow>
          <CondRow name="MultiSigCondition" highlight badge="new · 0.5" badgeTone="primary" address={aeneid.multiSigCondition}>
            N-of-M with <b>two parallel approval paths</b>: off-chain EIP-712 sigs (gas-free) OR on-chain{" "}
            <span className="mono">approve(uuid, epoch)</span>. Either path reaching threshold passes.{" "}
            <span className="mono">rotateSigners</span> invalidates both. First-of-kind in the CDR ecosystem.
          </CondRow>
        </div>
      </div>
    </section>
  );
}
