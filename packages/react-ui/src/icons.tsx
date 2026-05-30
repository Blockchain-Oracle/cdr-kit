import type { SVGProps } from "react";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const Check = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M4 12l5 5 11-11" /></svg>
);
export const Copy = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...stroke} {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
);
export const ExternalLink = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M14 4h6v6" /><path d="M10 14L20 4" /><path d="M20 14v6H4V4h6" /></svg>
);
export const CreditCard = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...stroke} {...p}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h3" /></svg>
);
export const Boxes = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 12l9 4 9-4M3 17l9 4 9-4" /></svg>
);
export const KeyRound = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...stroke} {...p}><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9 3 3-3 3 2 2-3 3" /></svg>
);
export const AlertCircle = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...stroke} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" /></svg>
);
