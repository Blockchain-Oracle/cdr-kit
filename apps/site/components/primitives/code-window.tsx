import type { ReactNode } from "react";

/** macOS-traffic-light-style code window. Pass syntax-highlighted children inside `<pre>` if desired. */
export function CodeWindow({
  title,
  children,
  toolbar,
  className,
}: {
  title?: string;
  children: ReactNode;
  toolbar?: ReactNode;
  className?: string;
}) {
  return (
    <div className={["win", className].filter(Boolean).join(" ")}>
      <div className="win-bar">
        <span className="lights">
          <i />
          <i />
          <i />
        </span>
        {title && <span className="win-title">{title}</span>}
        {toolbar && <div style={{ marginLeft: "auto" }}>{toolbar}</div>}
      </div>
      <div className="code">{children}</div>
    </div>
  );
}
