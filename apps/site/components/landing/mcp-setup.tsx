import { CopyButton } from "../primitives/copy-button";

const HOSTS = ["Claude Desktop", "Cursor", "Windsurf", "OpenClaw"];

const MCP_JSON = `{
  "mcpServers": {
    "cdr-kit": {
      "command": "cdr-kit-mcp",
      "env": {
        "PRIVATE_KEY": "0x…",
        "STORY_API_URL": "https://…"
      }
    }
  }
}`;

export function McpSetup() {
  return (
    <section className="section" id="mcp" style={{ borderTop: "1px solid var(--line)", background: "var(--paper-2)" }}>
      <div className="container">
        <div className="mcp-grid">
          <div className="reveal">
            <span className="eyebrow">
              <span className="tick">▚</span>@cdr-kit/mcp
            </span>
            <h2 className="h-sec" style={{ marginTop: 16 }}>
              One config block.
              <br />
              CDR in every MCP host.
            </h2>
            <p className="lede" style={{ marginTop: 16 }}>
              A single binary exposes the three CDR tools over stdio — discover, subscribe, access. Paste it into your
              host and your assistant can transact for itself.
            </p>
            <div className="mcp-hosts">
              {HOSTS.map((h) => (
                <span className="host-pill" key={h}>
                  <span className="d" />
                  {h}
                </span>
              ))}
            </div>
          </div>
          <div className="reveal">
            <div className="win">
              <div className="win-bar">
                <span className="lights">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="win-title">claude_desktop_config.json</span>
                <div style={{ marginLeft: "auto" }}>
                  <CopyButton value={MCP_JSON} />
                </div>
              </div>
              <div className="code">
                <pre>
                  <code>
                    {"{\n  "}
                    <span className="tok-key">{`"mcpServers"`}</span>: {"{\n    "}
                    <span className="tok-key">{`"cdr-kit"`}</span>: {"{\n      "}
                    <span className="tok-key">{`"command"`}</span>: <span className="tok-str">{`"cdr-kit-mcp"`}</span>,
                    {"\n      "}
                    <span className="tok-key">{`"env"`}</span>: {"{\n        "}
                    <span className="tok-key">{`"PRIVATE_KEY"`}</span>: <span className="tok-str">{`"0x…"`}</span>,
                    {"\n        "}
                    <span className="tok-key">{`"STORY_API_URL"`}</span>:{" "}
                    <span className="tok-str">{`"https://…"`}</span>
                    {"\n      }\n    }\n  }\n}"}
                  </code>
                </pre>
              </div>
            </div>
            <p className="faint mono" style={{ fontSize: "0.74rem", marginTop: 12 }}>
              npm install -g @cdr-kit/mcp &nbsp;·&nbsp; provides the{" "}
              <span style={{ color: "var(--primary)" }}>cdr-kit-mcp</span> binary
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
