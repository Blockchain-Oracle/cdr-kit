import type { SVGProps } from "react";

/**
 * cdr-kit brand glyph + wordmark.
 *
 * The glyph is the "horizontal line through rounded square + orange center dot"
 * shape (data flowing through a vault with the encrypted secret inside) —
 * the same mark that lives at `/assets/logo*.svg`. Inlining here (rather than
 * importing the static SVG) means:
 *
 *   - `currentColor` on the outline → flips dark/light via parent CSS for free.
 *   - The center dot uses `var(--primary)` so it stays brand-accent in either
 *     theme, without forking a "dark variant" of the asset.
 *   - One file is the source of truth for the React surface. The static SVGs
 *     in `/assets/` remain the source of truth for README badges / npm /
 *     anywhere that needs a raw file.
 *
 * If you update the mark, update both this component AND the assets in
 * `/assets/`. (Yes, there are two homes — one for React consumers, one for
 * Markdown / static consumers. Keeping them in sync is a 10-second job and
 * worth it to avoid a build-time SVGR setup.)
 */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="cdr-kit" {...props}>
      <line x1="1.5" y1="16" x2="30.5" y2="16" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="7" y="7" width="18" height="18" rx="5.2" stroke="currentColor" strokeWidth="2.6" />
      <circle cx="16" cy="16" r="2.8" fill="var(--primary)" />
    </svg>
  );
}

/**
 * Full horizontal wordmark — `<LogoMark>` + "cdr-kit" in JetBrains Mono with
 * the dash painted brand-accent. For places that want the wordmark as a single
 * unit (footer, OG cards, embed badges); the nav composes the glyph + a CSS-
 * styled text wordmark separately so it can theme the kerning.
 */
export function LogoWordmark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 152 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="cdr-kit"
      {...props}
    >
      <g transform="translate(4 4)">
        <line x1="1.5" y1="16" x2="30.5" y2="16" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        <rect x="7" y="7" width="18" height="18" rx="5.2" stroke="currentColor" strokeWidth="2.6" />
        <circle cx="16" cy="16" r="2.8" fill="var(--primary)" />
      </g>
      <text
        x="46"
        y="27.5"
        fontFamily="'JetBrains Mono', ui-monospace, SFMono-Regular, monospace"
        fontSize="21"
        fontWeight="700"
        letterSpacing="-0.8"
      >
        <tspan fill="currentColor">cdr</tspan>
        <tspan fill="var(--primary)">-</tspan>
        <tspan fill="currentColor">kit</tspan>
      </text>
    </svg>
  );
}
