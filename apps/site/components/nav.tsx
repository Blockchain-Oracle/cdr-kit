import Link from "next/link";
import { LockboxGlyph, Npm, Github } from "./icons";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/docs", label: "Docs" },
  { href: "/docs/components/vault-gate", label: "Components" },
  { href: "/components", label: "Gallery" },
  { href: "/#agent", label: "Agent Kit" },
  { href: "/#conditions", label: "Contracts" },
  { href: "/#mcp", label: "MCP" },
  { href: "/#live", label: "Live on Aeneid" },
];

export function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link className="brand" href="/" aria-label="cdr-kit home">
          <span className="glyph" aria-hidden="true">
            <LockboxGlyph />
          </span>
          <span className="word">
            cdr<b>-</b>kit
          </span>
        </Link>
        <nav className="nav-links">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-right">
          <span className="nav-ver">v0.1.0</span>
          <a
            className="icon-btn"
            href="https://www.npmjs.com/org/cdr-kit"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="npm org"
            title="npm"
          >
            <Npm />
          </a>
          <a
            className="icon-btn"
            href="https://github.com/Blockchain-Oracle/cdr-kit"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            title="GitHub"
          >
            <Github />
          </a>
          <ThemeToggle />
          <Link className="btn btn-primary btn-sm" href="/docs">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
