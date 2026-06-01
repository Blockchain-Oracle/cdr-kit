import Link from "next/link";
import { Badge } from "../primitives/badge";
import { CopyLine } from "../primitives/copy-line";
import { EncryptedScramble } from "./encrypted-scramble";
import { VaultCycle } from "./vault-cycle";

export function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-left">
            <Link href="/docs/contracts/multi-sig-condition" className="hero-new reveal">
              <span className="mono dot">new · 0.5</span>
              <span className="hn-txt">4 advanced conditions live · TimeWindow / DeadMan / Escrow / MultiSig</span>
              <span className="arr" aria-hidden="true">→</span>
            </Link>
            <div className="hero-eyebrows reveal">
              <Badge tone="primary">Story Protocol · Confidential Data Rails</Badge>
              <Badge tone="live">Live on Aeneid</Badge>
            </div>
            <h1 className="display reveal">
              Ship <EncryptedScramble final="encrypted" className="enc" />, paid,
              <br />
              license-gated data.
            </h1>
            <p className="lede hero-lede reveal">
              The <span className="mono" style={{ color: "var(--ink)" }}>wagmi</span>-style toolkit for CDR. Install one
              package and gate encrypted data behind a real on-chain payment or license check — in under a minute.
            </p>
            <div className="hero-cta reveal">
              <CopyLine command="npm create cdr-kit" minWidth={280} />
              <Link className="btn btn-ghost" href="/docs">
                Read the docs
              </Link>
            </div>
            <div className="hero-proof reveal">
              <span className="proof-item">
                <span className="mk">✦</span>
                <span className="mono">15</span> packages on npm
              </span>
              <span className="proof-item">
                <span className="mk">✦</span>
                <span className="mono">99 + 7</span> Solidity tests
              </span>
              <span className="proof-item">
                <span className="mk">✦</span>MIT licensed
              </span>
              <span className="proof-item">
                <span className="mk">✦</span>CI green on <span className="mono">main</span>
              </span>
            </div>
          </div>
          <VaultCycle />
        </div>
      </div>
    </section>
  );
}
