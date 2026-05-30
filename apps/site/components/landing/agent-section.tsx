import { AgentTerminal } from "./agent-terminal";

export function AgentSection() {
  return (
    <section className="section agent" id="agent">
      <div className="container">
        <div className="agent-grid">
          <div className="reveal">
            <span className="eyebrow">
              <span className="tick">▚</span>The centerpiece
            </span>
            <h2 className="h-sec" style={{ marginTop: 16 }}>
              An agent that buys
              <br />
              data by itself.
            </h2>
            <p className="lede" style={{ marginTop: 16 }}>
              Hand an LLM the three CDR tools and it runs the whole loop — no human in the loop. A seller stages a
              subscription-gated trading signal; the agent finds it, pays real{" "}
              <span className="mono" style={{ color: "var(--ink)" }}>$IP</span> from its own wallet, decrypts, and
              answers.
            </p>
            <ul className="agent-points">
              <li>
                <span className="mk">→</span>
                <div>
                  <b>discover</b> — scans the factory for vaults matching intent.
                </div>
              </li>
              <li>
                <span className="mk">→</span>
                <div>
                  <b>subscribe & access</b> — pays from its own wallet, collects key shares.
                </div>
              </li>
              <li>
                <span className="mk">→</span>
                <div>
                  <b>decide</b> — reads the decrypted signal and acts on it.
                </div>
              </li>
            </ul>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 26 }}>
              <a className="btn btn-primary" href="#mcp">
                Wire it into Claude / Cursor
              </a>
              <a
                className="btn btn-ghost"
                href="https://github.com/Blockchain-Oracle/cdr-kit/tree/main/examples/vercel-ai-chatbot"
                target="_blank"
                rel="noopener noreferrer"
              >
                Runnable example
              </a>
            </div>
          </div>
          <div className="reveal">
            <AgentTerminal />
          </div>
        </div>
      </div>
    </section>
  );
}
