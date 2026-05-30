import { InstallTabs } from "./install-tabs";

export function Quickstart() {
  return (
    <section className="section" id="quickstart" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="container">
        <div className="qs-grid">
          <QsLeft />
          <QsRight />
        </div>
      </div>
    </section>
  );
}

function QsLeft() {
  return (
    <div>
      <div className="sec-head reveal" style={{ marginBottom: 32 }}>
        <span className="eyebrow">
          <span className="tick">▚</span>Quickstart
        </span>
        <h2 className="h-sec">
          Gated encrypted data
          <br />
          in under 60 seconds.
        </h2>
      </div>
      <ol className="qs-steps reveal">
        <li className="qs-step">
          <span className="n">1</span>
          <div>
            <h4>Install the React layer</h4>
            <p>One package pulls in the typed core SDK and the provider.</p>
          </div>
        </li>
        <li className="qs-step">
          <span className="n">2</span>
          <div>
            <h4>
              Wrap your app in <span className="mono">&lt;CdrProvider&gt;</span>
            </h4>
            <p>Pass a wagmi config + API URL to go live, or a mock kit for local dev.</p>
          </div>
        </li>
        <li className="qs-step">
          <span className="n">3</span>
          <div>
            <h4>
              Drop in <span className="mono">&lt;VaultGate&gt;</span>
            </h4>
            <p>It checks the on-chain condition, releases key shares, and hands you the decrypted bytes.</p>
          </div>
        </li>
      </ol>
    </div>
  );
}

function QsRight() {
  return (
    <div className="qs-panel reveal">
      <div className="win">
        <InstallTabs />
        <hr className="rule" />
        <div className="code">
          <pre>
            <code>
              <span className="tok-key">import</span> {"{ CdrProvider, VaultGate }"} <span className="tok-key">from</span>{" "}
              <span className="tok-str">{`"@cdr-kit/react"`}</span>;{"\n\n"}
              <span className="tok-punc">{"<"}</span>
              <span className="tok-fn">CdrProvider</span> config={"{wagmiConfig}"} apiUrl={"{apiUrl}"}
              <span className="tok-punc">{">"}</span>
              {"\n  "}
              <span className="tok-punc">{"<"}</span>
              <span className="tok-fn">VaultGate</span> uuid={"{"}
              <span className="tok-num">4200</span>
              {"}"} auto{"\n    "}
              fallback={"{"}
              <span className="tok-punc">{"<"}</span>
              <span className="tok-fn">SubscribeButton</span> /<span className="tok-punc">{">"}</span>
              {"}"}
              <span className="tok-punc">{">"}</span>
              {"\n    "}
              {"{(data) => "}
              <span className="tok-punc">{"<"}</span>pre<span className="tok-punc">{">"}</span>
              {"{"}
              <span className="tok-key">new</span> <span className="tok-fn">TextDecoder</span>().
              <span className="tok-fn">decode</span>(data){"}"}
              <span className="tok-punc">{"</"}</span>pre<span className="tok-punc">{">"}</span>
              {"}"}
              {"\n  "}
              <span className="tok-punc">{"</"}</span>
              <span className="tok-fn">VaultGate</span>
              <span className="tok-punc">{">"}</span>
              {"\n"}
              <span className="tok-punc">{"</"}</span>
              <span className="tok-fn">CdrProvider</span>
              <span className="tok-punc">{">"}</span>
              {"\n"}
              <span className="tok-com">{"// → renders the decrypted payload once the condition is satisfied"}</span>
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
