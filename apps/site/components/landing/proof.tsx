import { aeneid } from "@cdr-kit/contracts";
import { ExternalLink } from "../icons";

const DEPLOY_ROWS = [
  { name: "CdrKitVault", address: aeneid.cdrKitVault },
  { name: "SubscriptionCondition", address: aeneid.subscriptionCondition },
  { name: "TierGateCondition", address: aeneid.tierGateCondition },
  { name: "ComposableCondition", address: aeneid.composableCondition },
];

export function Proof() {
  return (
    <section className="section proof" id="live">
      <div className="container">
        <div className="sec-head reveal">
          <span className="eyebrow">
            <span className="tick">▚</span>Proof, not a slide deck
          </span>
          <h2 className="h-sec">Live on Aeneid.</h2>
          <p className="lede">
            Story&apos;s testnet — chain id <span className="mono" style={{ color: "var(--ink)" }}>1315</span>. Contracts
            verified 2026-05-28; end-to-end encrypt→write→read→decrypt round-trips confirmed on real chain.
          </p>
        </div>

        <div className="stat-grid reveal" style={{ marginBottom: 34 }}>
          <Stat number="12" label="packages published to npm" />
          <Stat number="3" unit=" live" label="seeded subscription vaults (4200–4202)" />
          <Stat number="~15" unit="s" label="typical threshold read latency" />
          <Stat number="30" label="Solidity tests passing" />
        </div>

        <div className="deploy-table reveal">
          <div className="deploy-row" style={{ background: "var(--paper-2)" }}>
            <span className="dn" style={{ color: "var(--ink-3)" }}>contract</span>
            <span className="da" style={{ color: "var(--ink-3)" }}>address (aeneid · 1315)</span>
            <span className="dx" style={{ color: "var(--ink-3)" }}>explorer</span>
          </div>
          {DEPLOY_ROWS.map((row) => (
            <div className="deploy-row" key={row.name}>
              <span className="dn">{row.name}</span>
              <span className="da">{row.address}</span>
              <a
                className="dx"
                href={`https://aeneid.storyrpc.io/address/${row.address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                view <ExternalLink />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({ number, unit, label }: { number: string; unit?: string; label: string }) {
  return (
    <div className="stat card">
      <div className="num">
        {number}
        {unit && <span className="u">{unit}</span>}
      </div>
      <div className="lbl">{label}</div>
    </div>
  );
}
