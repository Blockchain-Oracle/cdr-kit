import type { ReactNode } from "react";

type Tone = "default" | "primary" | "live" | "warn";

const classMap: Record<Tone, string> = {
  default: "badge",
  primary: "badge badge-primary",
  live: "badge badge-live",
  warn: "badge badge-warn",
};

export function Badge({
  tone = "default",
  dot = true,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={classMap[tone]}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}
