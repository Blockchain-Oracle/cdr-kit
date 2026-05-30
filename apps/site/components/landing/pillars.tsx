import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "../icons";

interface Pillar {
  no: string;
  tag: string;
  title: string;
  desc: ReactNode;
  mini: ReactNode;
  href: string;
  cta: string;
}

const PILLARS: Pillar[] = [
  {
    no: "01",
    tag: "@cdr-kit/react",
    title: "React layer",
    desc: (
      <>
        Drop a <span className="mono">&lt;VaultGate&gt;</span> around encrypted data. Hooks, a Clerk-style{" "}
        <span className="mono">&lt;Vault&gt;</span> compound, and a mock mode so you can build UI with no wallet or chain.
      </>
    ),
    mini: (
      <>
        useAccessVault()
        <br />
        useSubscribeAndAccess()
        <br />
        &lt;VaultGate /&gt; · &lt;Vault.Unlocked /&gt;
      </>
    ),
    href: "/docs/components/vault-gate",
    cta: "Component showcase",
  },
  {
    no: "02",
    tag: "@cdr-kit/agent",
    title: "Autonomous agent kit",
    desc: (
      <>
        An LLM agent that buys data with its own wallet — discover, pay, decrypt, decide. Five framework adapters plus an MCP server.
      </>
    ),
    mini: (
      <>
        agent.discover()
        <br />
        agent.subscribeAndAccess()
        <br />
        vercel-ai · openai · langchain · goat
      </>
    ),
    href: "/#agent",
    cta: "See the agent loop",
  },
  {
    no: "03",
    tag: "contracts/",
    title: "Condition library",
    desc: (
      <>
        A standard library of tested Solidity conditions — Subscription, TierGate, Composable — plus the{" "}
        <span className="mono">CdrKitVault</span> factory that mints, registers IP, and gates in one tx.
      </>
    ),
    mini: (
      <>
        SubscriptionCondition
        <br />
        TierGateCondition · Composable
        <br />
        CdrKitVault.create()
      </>
    ),
    href: "/#conditions",
    cta: "Browse conditions",
  },
];

export function Pillars() {
  return (
    <section className="section" id="pillars">
      <div className="container">
        <div className="sec-head reveal">
          <span className="eyebrow">
            <span className="tick">▚</span>Three pillars, one kit
          </span>
          <h2 className="h-sec">Not one feature — a toolkit over CDR.</h2>
          <p className="lede">
            Encryption stays in CDR. Payments stay in Story&apos;s IP layer. cdr-kit wires them together ergonomically across React, autonomous agents, and Solidity.
          </p>
        </div>
        <div className="pillars">
          {PILLARS.map((p) => (
            <article key={p.no} className="pillar card reveal">
              <div className="pillar-no">
                <span>{p.no}</span>
                <span className="tag">{p.tag}</span>
              </div>
              <h3 className="h-card">{p.title}</h3>
              <p className="p-desc">{p.desc}</p>
              <div className="mini-code">{p.mini}</div>
              <Link className="p-link" href={p.href}>
                {p.cta} <ArrowRight />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
