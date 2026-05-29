import Link from "next/link";
import { ArrowRight, Boxes, Component, Bot, FileCode2, LayoutTemplate, Rocket } from "lucide-react";

const cards = [
  {
    title: "@cdr-kit/core",
    href: "/docs/core",
    icon: Boxes,
    desc: "Typed SDK — client, condition encoders, 2-step flows, the file/IPFS path, WASM lifecycle.",
  },
  {
    title: "@cdr-kit/react",
    href: "/docs/react",
    icon: Component,
    desc: "<CdrProvider>, <VaultGate>, and hooks with first-class paying → collecting → ready status.",
  },
  {
    title: "Agent kit",
    href: "/docs/agent",
    icon: Bot,
    desc: "CdrAgent + one MCP server + 5 framework adapters (Vercel AI, LangChain, OpenAI, AgentKit, GOAT).",
  },
  {
    title: "Condition contracts",
    href: "/docs/contracts",
    icon: FileCode2,
    desc: "Subscription, TierGate, Composable + the CdrKitVault factory — audited, deployed on Aeneid.",
  },
  {
    title: "Templates",
    href: "/docs/templates",
    icon: LayoutTemplate,
    desc: "data-marketplace dashboard, built on @cdr-kit/react. Browse → subscribe → access → decrypt.",
  },
  {
    title: "Quickstart",
    href: "/docs/quickstart",
    icon: Rocket,
    desc: "npm i @cdr-kit/react and gate real CDR data in under 20 lines. Mock-mode runs with no wallet.",
  },
];

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden px-6 py-20">
      {/* navy depth glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 h-[420px]"
        style={{
          background:
            "radial-gradient(620px circle at 50% 0%, color-mix(in srgb, var(--color-fd-primary) 22%, transparent), transparent 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-5xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card/60 px-3 py-1 text-xs text-fd-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
          Live on Story Aeneid · 5 condition contracts deployed
        </span>
        <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          The developer toolkit for
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(110deg, var(--color-fd-primary), #34d399)" }}
          >
            Confidential Data Rails
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-fd-muted-foreground">
          The wagmi/Stripe layer for Story Protocol&apos;s CDR. Ship private, paid, license-gated data with audited
          condition contracts, a typed SDK, a React layer, and an autonomous agent kit.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/quickstart"
            className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Quickstart <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-card/50 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            Read the docs
          </Link>
        </div>
      </div>

      <div className="relative mx-auto mt-16 grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-2xl border border-fd-border bg-fd-card/60 p-5 transition-all hover:-translate-y-0.5 hover:border-fd-primary/40"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-fd-primary/12 text-fd-primary ring-1 ring-fd-primary/25">
                <c.icon className="h-4.5 w-4.5" />
              </span>
              <h3 className="text-base font-semibold">{c.title}</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-fd-muted-foreground">{c.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-fd-primary opacity-0 transition-opacity group-hover:opacity-100">
              Open <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
