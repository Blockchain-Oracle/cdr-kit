"use client";

import "./gallery.css";
import "@cdr-kit/react-ui/styles.css";

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

import { Sidebar } from "@/components/docs/sidebar";
import { AccessStepperDemo } from "@/components/gallery/access-stepper-demo";
import { SubscribeButtonDemo } from "@/components/gallery/subscribe-button-demo";

const FIVE_IP = BigInt(5) * BigInt(10) ** BigInt(18);
const TWO_MIL_IP = BigInt(18) * BigInt(10) ** BigInt(15);

export default function GalleryPage() {
  return (
    <div className="gal-shell">
      <Sidebar />
      <main className="gal">
        <Decision />

        <Section
          id="condition-badge"
          tag="ship"
          title="<ConditionBadge>"
          sub={
            <>
              Pure presentational pill for a vault&apos;s read condition. Color-mapped variants:{" "}
              <code>subscription</code> → primary, <code>tiergate</code> → warn, <code>composable</code> → signal,{" "}
              <code>open</code> → neutral.
            </>
          }
        >
          <div className="spec-row">
            <ConditionBadge kind="subscription" />
            <ConditionBadge kind="tiergate" />
            <ConditionBadge kind="composable" />
            <ConditionBadge kind="open" />
          </div>
        </Section>

        <Section
          id="access-stepper"
          tag="ship"
          title="<AccessStepper>"
          sub={
            <>
              Derives step state from <code>useAccessVault</code>&apos;s status enum +{" "}
              <code>{`{ collected, threshold }`}</code>. Use the phase selector below to drive every state.
            </>
          }
        >
          <AccessStepperDemo />
        </Section>

        <Section
          id="subscribe-button"
          tag="ship"
          title="<SubscribeButton>"
          sub={
            <>
              Batteries-included CTA — wraps <code>useSubscribeAndAccess</code>, renders inline AccessStepper, then
              the decoded JSON. Mock-friendly: works in any <code>&lt;CdrProvider&gt;</code>.
            </>
          }
        >
          <SubscribeButtonDemo />
        </Section>

        <Section
          id="vault-card"
          tag="ship"
          title="<VaultCard>"
          sub={<>Marketplace card with a CSS pointer-tracking spotlight on hover. No <code>GlowCard</code> dependency.</>}
        >
          <div className="vgrid">
            <VaultCard
              uuid={4200}
              condition="subscription"
              title="ETH/USD alpha signal"
              description="Hourly directional signal, threshold-encrypted. Subscribers decrypt the latest window after subscribe."
              dataType="signal"
              creatorName="0xc183…96E2"
              price={<IpPrice wei={FIVE_IP} period="/ 30d" />}
            />
            <VaultCard
              uuid={4201}
              condition="tiergate"
              title="Proprietary dataset"
              description="Gated by a Commercial PIL tier license. Buyers decrypt after on-chain license check."
              dataType="dataset"
              creatorName="0x74F2…800B"
              price={<IpPrice wei={null} />}
            />
          </div>
        </Section>

        <Section
          id="dx-primitives"
          tag="ship"
          title="DX primitives"
          sub={
            <>
              Small high-leverage components every consumer rebuilds today. <code>CopyButton</code>,{" "}
              <code>ShortAddress</code>, <code>ExplorerLink</code>, <code>IpPrice</code>,{" "}
              <code>CdrNetworkChip</code>, <code>CdrSpinner</code>, <code>CdrProgress</code>, <code>CdrError</code>.
            </>
          }
        >
          <div className="prim-grid">
            <Prim name="<ShortAddress />" desc="Truncated mono address chip with inline copy.">
              <ShortAddress address="0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C" />
            </Prim>
            <Prim name="<ExplorerLink />" desc="Mono primary link with external-link icon.">
              <ExplorerLink href="https://aeneid.storyrpc.io/address/0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C">
                view on Aeneid
              </ExplorerLink>
            </Prim>
            <Prim name="<IpPrice />" desc="Formats wei as IP with an optional period suffix.">
              <IpPrice wei={TWO_MIL_IP} period="/ 30d" />
            </Prim>
            <Prim name="<CdrNetworkChip />" desc="Glowing dot indicating live vs mock mode.">
              <CdrNetworkChip mode="live" />
              <CdrNetworkChip mode="mock" />
            </Prim>
            <Prim name="<CdrProgress />" desc="Determinate gradient bar — pass value or {collected, threshold}.">
              <CdrProgress collected={6} threshold={10} />
            </Prim>
            <Prim name="<CdrSpinner />" desc="Indeterminate CSS spinner.">
              <CdrSpinner />
            </Prim>
            <Prim name="<CdrError />" desc="Soft-bordered danger state with optional retry CTA.">
              <CdrError title="Read timed out" message="Threshold not met in time." onRetry={() => {}} />
            </Prim>
          </div>
        </Section>
      </main>
    </div>
  );
}

function Decision() {
  return (
    <div className="decision">
      <div className="dh">
        <span>Architecture decision · two-package split</span>
        <span className="ship-tag">@cdr-kit/react-ui</span>
      </div>
      <h2>Should the kit ship more components?</h2>
      <p>
        <b>Yes — as a second package.</b> The headless <code>@cdr-kit/react</code> stays as render-prop slots and
        hooks. <code>@cdr-kit/react-ui</code> ships the designed, batteries-included variants — styled only with{" "}
        <code>--cdr-ui-*</code> CSS variables, no Tailwind / lucide / framer-motion hard deps. Clerk +
        RainbowKit&apos;s pattern.
      </p>
      <p>
        Every component below dogfoods the real <code>@cdr-kit/react</code> hooks against{" "}
        <code>createMockCdrKit()</code> from <code>@cdr-kit/core</code>. Run them — they&apos;re not screenshots.
      </p>
    </div>
  );
}

function Section({
  id,
  tag,
  title,
  sub,
  children,
}: {
  id: string;
  tag: string;
  title: string;
  sub: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="gx" id={id}>
      <div className="gx-head">
        <h2>{title}</h2>
        <span className="ship-tag">● {tag}</span>
      </div>
      <p className="gx-sub">{sub}</p>
      {children}
    </section>
  );
}

function Prim({ name, desc, children }: { name: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="prim">
      <div className="pn">{name}</div>
      <div className="pd">{desc}</div>
      <div className="pdemo">{children}</div>
    </div>
  );
}
