"use client";

import "./components.css";

import Link from "next/link";
import {
  ConditionBadge,
  VaultCard,
  ShortAddress,
  ExplorerLink,
  IpPrice,
  CdrNetworkChip,
  CdrSpinner,
  CdrProgress,
  CdrError,
} from "@cdr-kit/react-ui";

import { AccessStepperDemo } from "@/components/gallery/access-stepper-demo";
import { SubscribeButtonDemo } from "@/components/gallery/subscribe-button-demo";
import { Badge } from "@/components/primitives/badge";

const FIVE_IP = BigInt(5) * BigInt(10) ** BigInt(18);
const TWO_MIL_IP = BigInt(18) * BigInt(10) ** BigInt(15);

const HEADLESS: { name: string; href: string; tag?: string; description: string }[] = [
  { name: "CdrProvider", href: "/docs/components/cdr-provider", description: "Root provider — wires WagmiProvider + react-query + initializes the CDR crypto WASM." },
  { name: "VaultGate", href: "/docs/components/vault-gate", description: "Declarative gate. Wrap encrypted data; renders the decrypted bytes via a render-prop." },
  { name: "Vault", href: "/docs/components/vault", tag: "compound", description: "Compound component — Vault.Locked / Vault.Loading / Vault.Unlocked slots." },
  { name: "CdrInspector", href: "/docs/components/cdr-inspector", description: "Dev panel showing mock / live mode + WASM ready state + API URL." },
  { name: "CdrSkeleton", href: "/docs/components/cdr-skeleton", description: "Default placeholder when no custom loading slot is supplied." },
  { name: "EmptyVaults", href: "/docs/components/empty-vaults", description: "Semantic empty-state slot." },
];

const STYLED_CORE: { name: string; href: string; tag?: string; description: string }[] = [
  { name: "ConditionBadge", href: "/docs/components/condition-badge", description: "Color-mapped pill for the read condition kind." },
  { name: "AccessStepper", href: "/docs/components/access-stepper", description: "Designed wait-state stepper for the 2-step pay→access flow." },
  { name: "SubscribeButton", href: "/docs/components/subscribe-button", description: "Batteries-included CTA wrapping useSubscribeAndAccess + inline stepper + decoded JSON." },
  { name: "VaultCard", href: "/docs/components/vault-card", description: "Marketplace card with CSS pointer-tracking spotlight on hover." },
];

const STYLED_PRIMITIVES: { name: string; href: string; description: string }[] = [
  { name: "CopyButton", href: "/docs/components/copy-button", description: "Minimal copy-to-clipboard control with check-mark feedback." },
  { name: "ShortAddress", href: "/docs/components/short-address", description: "Truncated mono address chip with inline copy." },
  { name: "ExplorerLink", href: "/docs/components/explorer-link", description: "Mono link with external-link icon — opens in new tab." },
  { name: "IpPrice", href: "/docs/components/ip-price", description: "Formats wei as IP with an optional period suffix." },
  { name: "CdrNetworkChip", href: "/docs/components/cdr-network-chip", description: "Pill with a glowing dot showing live vs mock mode." },
  { name: "CdrSpinner", href: "/docs/components/cdr-spinner", description: "Indeterminate CSS spinner." },
  { name: "CdrProgress", href: "/docs/components/cdr-progress", description: "Determinate progress bar with gradient fill." },
  { name: "CdrError", href: "/docs/components/cdr-error", description: "Soft-bordered danger state with optional retry CTA." },
];

export default function ComponentsIndex() {
  return (
    <main className="doc" style={{ maxWidth: 920 }}>
      <div className="crumbs">
        <span className="cur">Components</span>
      </div>
      <div className="doc-titlerow">
        <h1 className="doc-title">Components</h1>
        <Badge tone="primary">18 components</Badge>
      </div>
      <p className="doc-lede">
        Every component the kit ships, in one place. Headless render-prop slots from{" "}
        <code>@cdr-kit/react</code> on top — drop in your own visuals, theme freely. Styled, batteries-included
        variants from <code>@cdr-kit/react-ui</code> below — designed UI you can theme via{" "}
        <code>--cdr-ui-*</code> CSS variables. Click any component for its live preview, code, props, and states.
      </p>

      <section className="comp-section">
        <div className="comp-section-head">
          <h2>Headless · @cdr-kit/react</h2>
          <p className="muted">Render-prop slots + hooks. Bring your own visuals.</p>
        </div>
        <div className="comp-grid">
          {HEADLESS.map((c) => (
            <Link key={c.name} href={c.href} className="comp-card">
              <div className="comp-card-head">
                <code className="comp-name">{`<${c.name}>`}</code>
                {c.tag && <span className="comp-tag">{c.tag}</span>}
              </div>
              <p className="comp-desc">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="comp-section">
        <div className="comp-section-head">
          <h2>Styled · @cdr-kit/react-ui</h2>
          <p className="muted">Designed, batteries-included variants. Drop in and theme via CSS variables.</p>
        </div>
        <h3 className="comp-subheading">Vault-centric</h3>
        <div className="comp-grid">
          {STYLED_CORE.map((c) => (
            <Link key={c.name} href={c.href} className="comp-card">
              <div className="comp-card-head">
                <code className="comp-name">{`<${c.name}>`}</code>
                {c.tag && <span className="comp-tag">{c.tag}</span>}
              </div>
              <p className="comp-desc">{c.description}</p>
            </Link>
          ))}
        </div>

        <h3 className="comp-subheading">DX primitives</h3>
        <div className="comp-grid">
          {STYLED_PRIMITIVES.map((c) => (
            <Link key={c.name} href={c.href} className="comp-card">
              <div className="comp-card-head">
                <code className="comp-name">{`<${c.name}>`}</code>
              </div>
              <p className="comp-desc">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="comp-section">
        <div className="comp-section-head">
          <h2>At a glance — live</h2>
          <p className="muted">A quick sampler of the styled set. Each component has a full page with Preview + Code + props.</p>
        </div>

        <div className="spec-row">
          <ConditionBadge kind="subscription" />
          <ConditionBadge kind="tiergate" />
          <ConditionBadge kind="composable" />
          <ConditionBadge kind="open" />
        </div>

        <div style={{ marginTop: 28 }}>
          <AccessStepperDemo />
        </div>

        <div style={{ marginTop: 28 }}>
          <SubscribeButtonDemo />
        </div>

        <div style={{ marginTop: 28 }} className="vgrid">
          <VaultCard
            uuid={4200}
            condition="subscription"
            title="ETH/USD alpha signal"
            description="Hourly directional signal, threshold-encrypted."
            dataType="signal"
            creatorName="0xc183…96E2"
            price={<IpPrice wei={FIVE_IP} period="/ 30d" />}
          />
          <VaultCard
            uuid={4201}
            condition="tiergate"
            title="Proprietary dataset"
            description="Gated by a Commercial PIL tier license."
            dataType="dataset"
            creatorName="0x74F2…800B"
            price={<IpPrice wei={null} />}
          />
        </div>

        <div className="prim-grid" style={{ marginTop: 28 }}>
          <div className="prim"><div className="pn">{`<ShortAddress />`}</div><div className="pdemo"><ShortAddress address="0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C" /></div></div>
          <div className="prim"><div className="pn">{`<ExplorerLink />`}</div><div className="pdemo"><ExplorerLink href="https://aeneid.storyrpc.io/address/0xac592f">view on Aeneid</ExplorerLink></div></div>
          <div className="prim"><div className="pn">{`<IpPrice />`}</div><div className="pdemo"><IpPrice wei={TWO_MIL_IP} period="/ 30d" /></div></div>
          <div className="prim"><div className="pn">{`<CdrNetworkChip />`}</div><div className="pdemo"><CdrNetworkChip mode="live" /><CdrNetworkChip mode="mock" /></div></div>
          <div className="prim"><div className="pn">{`<CdrProgress />`}</div><div className="pdemo" style={{ width: "100%" }}><CdrProgress collected={6} threshold={10} /></div></div>
          <div className="prim"><div className="pn">{`<CdrSpinner />`}</div><div className="pdemo"><CdrSpinner /></div></div>
          <div className="prim"><div className="pn">{`<CdrError />`}</div><div className="pdemo"><CdrError title="Read timed out" message="Threshold not met in time." /></div></div>
        </div>
      </section>
    </main>
  );
}
