import Link from "next/link";
import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";

export default function IntroductionPage() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit", "Getting started", "Introduction"],
        title: "Introduction",
        badges: <Badge tone="live">v0.5.0</Badge>,
        lede: (
          <>
            <b>cdr-kit</b> is the developer toolkit for Story Protocol&apos;s Confidential Data Rails — the{" "}
            <span className="mono" style={{ color: "var(--ink)" }}>wagmi</span>-style layer that makes it possible to
            ship private, paid, license-gated data on Story without hand-writing Solidity, hand-rolling encryption
            flows, or wiring IP licensing primitives by hand.
          </>
        ),
        sections: [
          {
            id: "what",
            title: "What's in the kit",
            content: (
              <>
                <p>
                  15 packages, MIT-licensed, all published to{" "}
                  <a href="https://www.npmjs.com/org/cdr-kit" target="_blank" rel="noopener noreferrer">
                    npmjs.com/org/cdr-kit
                  </a>{" "}
                  at v0.5.0:
                </p>
                <ul>
                  <li>
                    <Link href="/docs/components/vault-gate">
                      <code>@cdr-kit/react</code>
                    </Link>{" "}
                    — components + hooks + theming (5 new 0.5 components, 7 new hooks)
                  </li>
                  <li>
                    <code>@cdr-kit/react-ui</code> — styled drop-ins built on the headless layer
                  </li>
                  <li>
                    <Link href="/docs/components/cdr-provider">
                      <code>@cdr-kit/core</code>
                    </Link>{" "}
                    — typed SDK (condition encoders, 2-step flows, 8 storage adapters, mock kit, WASM init)
                  </li>
                  <li>
                    <Link href="/docs/contracts">
                      <code>@cdr-kit/contracts</code>
                    </Link>{" "}
                    — Solidity ABIs + deployed addresses for 9 conditions (5 base + 4 advanced in 0.5)
                  </li>
                  <li>
                    <Link href="/docs/agent-kit">
                      <code>@cdr-kit/agent</code>
                    </Link>{" "}
                    — autonomous-agent client (discover → subscribe → access; +12 advanced helpers in 0.5)
                  </li>
                  <li>
                    <Link href="/docs/story">
                      <code>@cdr-kit/story</code>
                    </Link>{" "}
                    — Story IP creator surface (NEW in 0.5): registerIpAsset / PIL flavors / mintLicenseTokens
                  </li>
                  <li>
                    <code>@cdr-kit/tools</code> — framework-agnostic tool definitions (34 tools)
                  </li>
                  <li>
                    Framework adapters:{" "}
                    <Link href="/docs/agent-kit/vercel-ai">
                      <code>@cdr-kit/vercel-ai</code>
                    </Link>{" "}
                    ·{" "}
                    <Link href="/docs/agent-kit/openai">
                      <code>@cdr-kit/openai</code>
                    </Link>{" "}
                    ·{" "}
                    <Link href="/docs/agent-kit/langchain">
                      <code>@cdr-kit/langchain</code>
                    </Link>{" "}
                    ·{" "}
                    <Link href="/docs/agent-kit/agentkit">
                      <code>@cdr-kit/agentkit</code>
                    </Link>{" "}
                    ·{" "}
                    <Link href="/docs/agent-kit/goat">
                      <code>@cdr-kit/goat</code>
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/agent-kit/mcp">
                      <code>@cdr-kit/mcp</code>
                    </Link>{" "}
                    — the MCP server (Claude Desktop / Cursor / Windsurf / OpenClaw)
                  </li>
                  <li>
                    <Link href="/docs/cli">
                      <code>@cdr-kit/cli</code>
                    </Link>{" "}
                    — the <span className="mono">cdr</span> binary (25 commands across vault / multi-sig / escrow / IP)
                  </li>
                  <li>
                    <Link href="/docs/scaffolder">
                      <code>create-cdr-kit-app</code>
                    </Link>{" "}
                    — the scaffolder
                  </li>
                </ul>
              </>
            ),
          },
          {
            id: "where",
            title: "Where to start",
            content: (
              <>
                <ul>
                  <li>
                    <Link href="/docs/quickstart">Quickstart</Link> — install, gate encrypted data in under 60s.
                  </li>
                  <li>
                    <Link href="/docs/components/vault-gate">VaultGate component</Link> — the canonical drop-in.
                  </li>
                  <li>
                    <Link href="/docs/agent-kit">Agent kit overview</Link> — autonomous agents that buy data.
                  </li>
                  <li>
                    <Link href="/docs/contracts">Condition library</Link> — the Solidity standard library.
                  </li>
                </ul>
              </>
            ),
          },
        ],
        next: { href: "/docs/quickstart", label: "Quickstart" },
      }}
    />
  );
}
