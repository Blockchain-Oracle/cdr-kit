"use client";

import { useState, type ReactNode } from "react";

/** Preview / Code tabs over a single demo. Pass the preview component + a code snippet string. */
export function Demo({
  preview,
  code,
  language = "tsx",
  reset,
  badge,
}: {
  preview: ReactNode;
  code: ReactNode;
  language?: string;
  reset?: () => void;
  badge?: ReactNode;
}) {
  const [pane, setPane] = useState<"preview" | "code">("preview");
  void language;
  return (
    <div className={pane === "code" ? "demo show-code" : "demo"}>
      <div className="demo-bar">
        <div className="demo-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={pane === "preview"} className="demo-tab" onClick={() => setPane("preview")}>
            Preview
          </button>
          <button type="button" role="tab" aria-selected={pane === "code"} className="demo-tab" onClick={() => setPane("code")}>
            Code
          </button>
        </div>
        {badge && <span style={{ marginLeft: 8 }}>{badge}</span>}
        <span className="spacer" />
        {reset && (
          <button type="button" className="demo-reset" onClick={reset}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            reset
          </button>
        )}
      </div>
      <div className="demo-stage">{preview}</div>
      <div className="demo-code-pane">
        <div className="code">
          <pre>
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
