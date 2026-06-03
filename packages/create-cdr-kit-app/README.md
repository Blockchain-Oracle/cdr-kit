<p align="center">
  <a href="https://cdrkit.xyz">
    <img src="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/icon.svg" alt="cdr-kit" width="80">
  </a>
</p>

# create-cdr-kit-app

> One-command scaffolder for Story CDR apps. Real Aeneid integration, premium dark design, zero mock.

```bash
pnpm create cdr-kit-app my-app
# or
npm create cdr-kit-app@latest my-app
# or
yarn create cdr-kit-app my-app
```

Pick from 5 templates — every generated app is wired to live Aeneid testnet (chain 1315), uses RainbowKit + wagmi, and styles itself with the `@cdr-kit/react-ui` token system (dark + light theme, FOUC-prevention init script).

---

## Templates

| flag                          | what you get                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `--template starter`          | Minimal Node script — full CDR allocate → write → read flow on real Aeneid            |
| `--template blog`             | Next.js blog with `<UnlockablePill>` inline paywalls — Confide-style                  |
| `--template paywall`          | Single-page subscription paywall — `<SubscribeButton>` + decrypted-payload reveal     |
| `--template data-marketplace` | Dark hero + live vault discovery grid via `useDiscoverVaults()` + Subscribe-per-card  |
| `--template forms`            | Encrypted form submissions via `@cdr-kit/forms` — server-side Pinata + decrypt route  |

```bash
pnpm create cdr-kit-app my-marketplace --template data-marketplace
cd my-marketplace
cp .env.example .env       # add WALLET_PRIVATE_KEY + PINATA_JWT
pnpm dev
```

---

## What every generated app ships with

- Next.js 16 + App Router, TypeScript strict mode
- `WagmiProvider` + `QueryClientProvider` + `RainbowKitProvider` (dark theme)
- `CdrConfigProvider` pointing at Aeneid testnet
- `@cdr-kit/react-ui` CSS tokens (`--cdr-ui-*`) for dark/light parity
- `.env.example` listing exactly the env vars you need
- README explaining how to grab testnet IP from the faucet

---

## Requirements

- Node ≥ 20
- pnpm ≥ 8 (or npm 9+ / yarn 4+)
- Funded Aeneid testnet wallet — free IP at <https://aeneid.faucet.story.foundation/>

---

## CLI flags

```bash
pnpm create cdr-kit-app [name] [options]

  --template <name>   one of: starter | blog | paywall | data-marketplace | forms
  --no-install        skip pnpm install (useful for previewing template files)
  --no-git            skip git init
  --help              show usage
  --version           print the scaffolder version
```

---

## Links

- Full docs: <https://cdrkit.xyz/docs/scaffolder>
- npm: <https://www.npmjs.com/package/create-cdr-kit-app>
- GitHub: <https://github.com/Blockchain-Oracle/cdr-kit>
- Story Protocol: <https://www.story.foundation>
- Hackathon: <https://build.usecdr.dev>
