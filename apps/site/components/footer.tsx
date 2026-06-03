import Link from "next/link";
import { LogoMark } from "./brand/logo";

const COLUMNS: { heading: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    heading: "Docs",
    links: [
      { href: "/docs/quickstart", label: "Quickstart" },
      { href: "/docs/components/vault-gate", label: "Components" },
      { href: "/docs/hooks/use-access-vault", label: "Hooks" },
      { href: "/docs/contracts", label: "Contracts" },
    ],
  },
  {
    heading: "Agent kit",
    links: [
      { href: "/docs/agent-kit", label: "CdrAgent" },
      { href: "/docs/agent-kit/mcp", label: "MCP server" },
      { href: "/docs/agent-kit/vercel-ai", label: "Framework adapters" },
      { href: "/docs/scaffolder", label: "Examples" },
    ],
  },
  {
    heading: "Project",
    links: [
      { href: "https://github.com/Blockchain-Oracle/cdr-kit", label: "GitHub", external: true },
      { href: "https://www.npmjs.com/org/cdr-kit", label: "npm org", external: true },
      { href: "https://story.foundation", label: "Story Protocol", external: true },
      { href: "https://docs.story.foundation/developers/cdr-sdk", label: "CDR docs", external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div>
            <Link className="brand" href="/" aria-label="cdr-kit home">
              <span className="glyph" aria-hidden="true">
                <LogoMark />
              </span>
              <span className="word">
                cdr<b>-</b>kit
              </span>
            </Link>
            <p className="muted" style={{ marginTop: 12, fontSize: "0.9rem", maxWidth: 320 }}>
              The developer toolkit for Story Protocol&apos;s Confidential Data Rails. MIT licensed.
            </p>
            <span className="badge badge-live" style={{ marginTop: 14 }}>
              <span className="dot" />
              Live on Aeneid
            </span>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4>{col.heading}</h4>
              <ul>
                {col.links.map((l) =>
                  l.external ? (
                    <li key={l.href}>
                      <a href={l.href} target="_blank" rel="noopener noreferrer">
                        {l.label}
                      </a>
                    </li>
                  ) : (
                    <li key={l.href}>
                      <Link href={l.href}>{l.label}</Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span className="mono">© 2026 cdr-kit · MIT · built on Story Protocol</span>
          <span className="mono">v0.1.0</span>
        </div>
      </div>
    </footer>
  );
}
