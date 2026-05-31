import type { ReactNode } from "react";
import { CopyButton } from "../primitives/copy-button";
import { highlight } from "@/lib/highlight";

type Lang = "tsx" | "ts" | "json" | "bash";

export interface CodePanelProps {
  /** Optional filename / title shown in the window chrome (mono, small). */
  title?: string;
  /** Code string — run through the syntax highlighter. Pass JSX directly to skip highlighting. */
  code: string | ReactNode;
  language?: Lang;
  /** When false, omits the copy button (default true). */
  copy?: boolean;
}

/** macOS-style window-chrome code block with built-in copy + syntax highlighting.
 *  One component, every code surface — replaces the hand-rolled `<div className="win doc-code">…`
 *  pattern across docs/landing/etc. */
export function CodePanel({ title, code, language = "tsx", copy = true }: CodePanelProps) {
  const isString = typeof code === "string";
  const rendered = isString ? highlight(code as string, language) : code;
  const copyValue = isString ? (code as string) : undefined;
  return (
    <div className="win doc-code">
      <div className="win-bar">
        <span className="lights">
          <i />
          <i />
          <i />
        </span>
        {title && <span className="win-title">{title}</span>}
        {copy && copyValue && (
          <div style={{ marginLeft: "auto" }}>
            <CopyButton value={copyValue} />
          </div>
        )}
      </div>
      <div className="code">
        <pre>
          <code>{rendered}</code>
        </pre>
      </div>
    </div>
  );
}
