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
          <CondRow
            name="Revocable · MultiSig · TimeBound"
            badge="roadmap"
            badgeTone="warn"
            soon
            address="checkReadCondition(uint32, bytes, bytes, address)"
          >
            On the public roadmap for a later release. Write your own with the 4-param{" "}
            <span className="mono">view</span> interface today.
          </CondRow>
        </div>
      </div>
    </section>
  );
}
