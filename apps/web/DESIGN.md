# DESIGN.md — cdr-kit web (apps/web)

## Direction
- **"Confidential rails."** A precise, technical dev-tool product for Story Protocol's Confidential Data Rails — the "Stripe for CDR." Dark-first, dense, trustworthy, a little cryptographic-futuristic. Reads like Linear/Vercel/Resend, not a generic SaaS gradient page.
- **Anchor:** `prisma-hero` energy + `hyper-text-with-decryption` headline (scramble→resolve = a literal decrypt) + `bento-grid` (the 4 kit layers) + `code-block` (live SDK sample) + `zoom-parallax` showcase.
- **Core metaphor:** locked → threshold-collection → decrypted. Encoded in color + motion, not decoration.

## Palette (actual hex)
- Background: `#08090C`        — deep ink, faint cool cast
- Surface: `#0F1116`           — cards, panels
- Surface raised: `#171A22`    — elevated/hover, popovers
- Border: `#242935`            — hairlines (default), `#2F3543` on hover
- Text primary: `#ECEEF3`
- Text secondary: `#969DAB`
- Accent: `#7C6BFF`            — **violet = locked/encrypted/brand.** Used ONLY for primary CTA, active nav, brand marks, and the "encrypted" state.
- Accent 2: `#34E5C4`          — **teal = decrypted/unlocked/live.** Used ONLY for success/ready/active-subscription/the reveal.
- Success / Destructive: `#34E5C4` / `#FB6E78`
- The **violet→teal gradient** (`#7C6BFF → #34E5C4`) is RESERVED for the decrypt/threshold motion (access stepper, hero headline resolve). Never as generic background decoration.

## Typography (NON-Inter)
- Display: **Clash Display** (Fontshare) — 600 — H1/H2 only.
- Body/UI: **General Sans** (Fontshare) — 400/500/600 — all body, labels, buttons.
- Mono: **JetBrains Mono** (Google) — 400/500 — uuids, 0x addresses, keys, condition data, code.
- Scale (px): 12 / 14 / 16 / 20 / 24 / 32 / 48 / 64
- Hierarchy is mandatory: never one weight everywhere (display 600, headings 600, body 400, emphasis 500).

## Spacing & shape
- Base unit: 4px. Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.
- Radius: 14px cards/panels · 10px buttons/inputs · 8px chips · full pills (badges, segmented nav).
- Shadow: borders-first (no drop shadows on cards). Elevation = surface-raised + brighter border. ONE accent glow reserved for primary CTA hover + the "ready" reveal: `0 8px 36px -12px color-mix(in srgb, var(--accent) 60%, transparent)`.

## Motion
- Hover: `translateY(-2px)` + border brighten + (CTA only) accent glow, 150ms ease-out.
- Section reveal: fade-up 8px, 400ms ease-out, `once: true` — BUT verify above-the-fold sections aren't left at opacity:0 (blocklist trap).
- Headline: `hyper-text-with-decryption` (scramble→resolve) on the hero H1 only.
- Access stepper / loading: **threshold-assembly** — shards/partials converge then a violet→teal reveal; skeletons use the `--cdr-skeleton` shimmer from `@cdr-kit/react/styles.css`.
- `prefers-reduced-motion`: disable scramble + parallax + shard motion; keep instant state changes + a static reveal.

## Interaction states (required per interactive component)
- Hover / Focus (visible 2px `--accent` ring, offset) / Active / Disabled (50% + not-allowed) / Empty / Loading (skeleton, never blank flash) / Error (destructive + human `CdrError` message).

## Banned (project-specific, on top of references/blocklist.md)
- The lazy `from-violet-600 to-indigo-600` gradient. The ONLY violet gradient allowed is the semantic violet→teal decrypt motion.
- Emoji as icons — use `lucide-react` (and swap removed brand glyphs for inline SVG).
- Placeholder slop ("John Doe", lorem, `$1,234.56`, picsum). Mock data is CDR-flavored: real-looking dataset/IP titles, `0x…` addresses, uuids, IP amounts.
- Centered text-only hero on a gradient. Hero must have product substance (mockup/code/visual).
- Untouched shadcn zinc theme — every semantic var is overwritten with the palette above.
