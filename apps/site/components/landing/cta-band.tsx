import { CopyLine } from "../primitives/copy-line";

export function CtaBand() {
  return (
    <section className="section-tight cta-band" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="container reveal">
        <span className="eyebrow" style={{ justifyContent: "center", marginBottom: 18 }}>
          <span className="tick">▚</span>Start now
        </span>
        <h2 className="display">npm create cdr-kit</h2>
        <p className="lede" style={{ maxWidth: "46ch", marginInline: "auto" }}>
          Pick a template — data-marketplace, paywall, MCP quickstart, or autonomous agent — and ship.
        </p>
        <CopyLine command="npm create cdr-kit@latest" />
      </div>
    </section>
  );
}
