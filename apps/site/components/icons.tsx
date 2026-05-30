import type { SVGProps } from "react";

/** Inline-SVG icon set, ported verbatim from the design bundle's HTML. All consume `currentColor`. */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function LockboxGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={2.1} {...props}>
      <rect x="4" y="10.5" width="16" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
      <circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LockClosed(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function LockOpen(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0" />
    </svg>
  );
}

export function Npm(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M2 5h20v13H12v2H7v-2H2V5zm2 2v9h3V9h2v7h2V7H4zm9 0v9h3V9h2v7h1V7h-6z" />
    </svg>
  );
}

export function Github(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 1.5A10.5 10.5 0 0 0 8.7 22c.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.4-3.5-1.4-.5-1.2-1.2-1.5-1.2-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1 1.6 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.3-.3-4.7-1.2-4.7-5.1 0-1.1.4-2 1-2.7-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7.7.7 1 1.6 1 2.7 0 3.9-2.4 4.8-4.7 5.1.4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10.5 10.5 0 0 0 12 1.5z" />
    </svg>
  );
}

export function Sun(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function Moon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function Copy(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

export function ExternalLink(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M14 4h6v6" />
      <path d="M10 14L20 4" />
      <path d="M20 14v6H4V4h6" />
    </svg>
  );
}

export function InfoCircle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v5h1" />
    </svg>
  );
}

export function AlertCircle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 17h.01" />
    </svg>
  );
}

export function Check(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M4 12l5 5 11-11" />
    </svg>
  );
}

export function Hamburger(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function ArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function KeyRound(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9 3 3-3 3 2 2-3 3" />
    </svg>
  );
}

export function Boxes(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 12l9 4 9-4M3 17l9 4 9-4" />
    </svg>
  );
}

export function CreditCard(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18M7 15h3" />
    </svg>
  );
}
