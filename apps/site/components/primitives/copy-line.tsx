import { CopyButton } from "./copy-button";

/** Mono "$ command" field with an inline copy button. */
export function CopyLine({ command, copyValue, minWidth }: { command: string; copyValue?: string; minWidth?: number }) {
  return (
    <div className="copyline" style={minWidth ? { minWidth } : undefined}>
      <span className="cmd">
        <span className="pfx">$</span> {command}
      </span>
      <CopyButton value={copyValue ?? command} />
    </div>
  );
}
