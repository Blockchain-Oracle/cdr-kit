import { Badge } from "@/components/primitives/badge";
import { CopyLine } from "@/components/primitives/copy-line";
import { LinkButton } from "@/components/primitives/button";
import { CodeWindow } from "@/components/primitives/code-window";

/** R1 placeholder home — proves the design system + theme toggle + nav + footer render in both modes.
 *  The real landing comes in R2. */
export default function Home() {
  return (
    <section className="section">
      <div className="container">
        <div className="reveal" style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <Badge tone="primary">cdr-kit · R1 scaffold</Badge>
          <Badge tone="live">design system ready</Badge>
        </div>
        <h1 className="display reveal" style={{ marginBottom: 18 }}>
          The shell, the tokens,
          <br />
          the theme — alive.
        </h1>
        <p className="lede reveal" style={{ marginBottom: 26, maxWidth: 720 }}>
          R1 is a working Next 16 + pure-CSS surface. The full landing arrives in R2; the docs shell and
          gallery follow in R3 and R4. Toggle the sun/moon in the nav to verify dark mode.
        </p>

        <div className="reveal" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 36 }}>
          <CopyLine command="npm create cdr-kit" />
          <LinkButton href="/docs" variant="ghost">
            Placeholder docs
          </LinkButton>
        </div>

        <div className="reveal" style={{ maxWidth: 560 }}>
          <CodeWindow title="hello.ts">
            <pre>
              <span className="tok-com">{`// the design system is live`}</span>
              {"\n"}
              <span className="tok-key">{"import"}</span>
              {" { "}
              <span className="tok-fn">{"VaultGate"}</span>
              {" } "}
              <span className="tok-key">{"from"}</span>{" "}
              <span className="tok-str">{`"@cdr-kit/react"`}</span>
              {";\n\n"}
              <span className="tok-key">{"export const"}</span>{" "}
              <span className="tok-fn">{"Demo"}</span>
              {" = () => <"}
              <span className="tok-fn">{"VaultGate"}</span>
              {" uuid={"}
              <span className="tok-num">{"4200"}</span>
              {"}>...</"}
              <span className="tok-fn">{"VaultGate"}</span>
              {">;"}
            </pre>
          </CodeWindow>
        </div>
      </div>
    </section>
  );
}
