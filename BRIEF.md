# cdr-kit — project brief

> **For the designer:** this is the one-pager that tells you what cdr-kit is and what we're trying to look like. Read this before sketching a logo or any architecture asset.

---

## What cdr-kit is — in 3 sentences

cdr-kit is the developer toolkit for Story Protocol's Confidential Data Rails (CDR) — the privacy primitive that lets anyone write encrypted data on-chain, gated by a programmable condition, and only the people who satisfy the condition can decrypt. It ships **15 npm packages** (Solidity ABIs, a typed SDK, React components, an autonomous-agent client, 5 framework adapters, an MCP server, a CLI, a one-command scaffolder, and a multi-skill Claude Code plugin), plus a dashboard / docs site at **cdrkit.xyz**. Think of it as the wagmi/RainbowKit/clerk for confidential on-chain data.

---

## Key outputs

- **15 npm packages** under [@cdr-kit](https://www.npmjs.com/org/cdr-kit) — all MIT, all live on Aeneid testnet at v0.7.1.
- **Live dashboard + docs** at [cdrkit.xyz](https://cdrkit.xyz) — Next.js 16, App Router, Turbopack, fumadocs-mdx.
- **`create-cdr-kit-app`** scaffolder with 5 templates (starter / blog / paywall / data-marketplace / forms).
- **Claude Code plugin** with 11 skills + 2 reference cheatsheets (`cdr skill install`).

---

## Visual direction

Dark, premium, security-first. Story Protocol ecosystem-adjacent. Not crypto-meme, not corporate SaaS — it's a developer tool with a serious surface (encryption, threshold cryptography, escrows) that should feel like it was designed by people who care.

### Color palette (current — these are live in `apps/site/app/globals.css`)

| token              | value                          | role                                                   |
| ------------------ | ------------------------------ | ------------------------------------------------------ |
| `--paper`          | `#0a0a0a` (near-black)         | page background                                        |
| `--ink`            | `#f4f0ea`                      | primary text                                           |
| `--ink-2`          | `#a7a39c`                      | secondary text                                         |
| `--primary`        | `#e86c2e` (amber-orange)       | brand accent, CTA buttons, "live" dots                 |
| `--primary-soft`   | `rgba(232,108,46,0.12)`        | accent backgrounds (badges, hovers)                    |
| `--signal`         | `#1E9C66` (green)              | success / "decrypted" states                           |
| `--warn`           | `#C0863A`                      | warnings                                               |
| `--danger`         | `#D32D2D`                      | errors                                                 |

### Typography

- Headings + body: Inter (system fallback ok)
- Mono / addresses / kbd: JetBrains Mono or similar variable-mono
- Numbers (vault uuids, prices) leaned mono for that "encoded" feel

### Tone

- Light copy density. The component renderers do the talking.
- No emoji in product surface (only ever in dev tooling).
- No buzzwords ("web3-native", "decentralized stack", etc.). Just what it does.

---

## Logo direction

We don't have one yet — this is what we want to convey.

### Concept
- **CDR** = Confidential Data Rails. The logo should suggest *containment* + *something flowing through that containment*.
- Inspirations: a stylized **vault** glyph (think a turned key icon, not a bank-safe); a **key**; an interleaved **rail/track**; or an abstract glyph that reads as a lowercase "c" + "k" doing something interesting.
- Should sit happily next to the Story Protocol mark without clashing.

### Constraints
- Works at 16×16 (favicon) and 512×512 (hero) without losing identity.
- Single-color version (white-on-dark) must hold up. Two-color is great if it works.
- Wordmark: "cdr-kit" (lowercase, no period), space between glyph and wordmark.
- The amber-orange `#e86c2e` is the brand accent — happy for the logo to use it, also happy for the logo to be neutral and let the surrounding UI carry the color.

### Don't
- Hexagons. Globes. Glowing-circuit-board patterns. Generic "blockchain" tropes.
- Anything that needs gradients to read at 16×16.
- Combining-letter monograms that look like a startup pivot from 2017.

### Once we have it
- Drop the final glyph as `apps/site/app/icon.png` (Next.js App Router auto-detects this as the favicon — no `<link rel="icon">` needed).
- Drop the SVG version as `apps/site/public/logo.svg` for use in the Nav.
- Provide a `logo-mono.svg` and `logo-wordmark.svg` for README headers.

---

## Architecture asset (future — design after logo lands)

I want to replace our current markdown ascii / nested-list diagrams with a real image. The asset should show **the 3-layer stack** that defines cdr-kit:

```
Layer 3 — Framework adapters    →  vercel-ai · openai · langchain · agentkit · goat
                                   create-cdr-kit-app · @cdr-kit/mcp · @cdr-kit/cli
Layer 2 — TypeScript SDK        →  @cdr-kit/core · @cdr-kit/agent · @cdr-kit/react · @cdr-kit/react-ui · @cdr-kit/forms · @cdr-kit/story
Layer 1 — Solidity conditions   →  CdrKitVault (factory) + 9 conditions (Open, Subscription, TierGate, Composable,
                                   CreatorWrite, TimeWindow, DeadManSwitch, ConditionalEscrow, MultiSig) → CDR precompile
```

Style notes:
- Same dark + amber palette as the docs site.
- Top-right corner: the cdr-kit logo (once we have it).
- Should also have a sibling "key outputs / links" hero card that includes:
  - GitHub: <https://github.com/Blockchain-Oracle/cdr-kit>
  - npm: <https://www.npmjs.com/org/cdr-kit>
  - Docs: <https://cdrkit.xyz>
  - Hackathon: <https://build.usecdr.dev>
  - Story Protocol: <https://www.story.foundation>

If you want to do a premium pass that matches the [21st.dev](https://21st.dev) / [Linear changelog](https://linear.app/changelog) visual energy, that's the bar.

---

## Relevant links (use these — don't invent others)

| what                    | url                                              |
| ----------------------- | ------------------------------------------------ |
| GitHub                  | <https://github.com/Blockchain-Oracle/cdr-kit>   |
| npm org                 | <https://www.npmjs.com/org/cdr-kit>              |
| Docs / dashboard        | <https://cdrkit.xyz>                             |
| Story Protocol          | <https://www.story.foundation>                   |
| Story brand assets      | <https://www.story.foundation/brand> (check the press kit) |
| Hackathon (CDR build)   | <https://build.usecdr.dev>                       |
| Confide (origin pattern for forms) | <https://github.com/Blockchain-Oracle/confide> |

---

## Project facts (for any "about" copy you need to write)

- **15 npm packages** at v0.7.1.
- **9 deployed condition contracts** on Aeneid testnet (chain 1315).
- **34 agent tools** wired through all 5 framework adapters.
- **11 skills** in the Claude Code plugin.
- **5 scaffolder templates**: starter, blog, paywall, data-marketplace, forms.
- License: MIT.

---

## Out of scope

- Mainnet deployment (still testnet-only — CDR mainnet not yet live).
- Token / mint / NFT collection of any kind for cdr-kit itself. We build on Story IP, not our own.
- Any "let users buy a license to use cdr-kit" notion. The toolkit is free.

---

If anything is unclear, ask before sketching. Better one round-trip than three.
