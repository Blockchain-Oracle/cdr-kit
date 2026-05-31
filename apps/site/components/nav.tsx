"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LockboxGlyph, Npm, Github } from "./icons";
import { ThemeToggle } from "./theme-toggle";

const primary = [
  { href: "/docs", label: "Docs" },
  { href: "/docs/components", label: "Components" },
  { href: "/docs/hooks/use-access-vault", label: "Hooks" },
  { href: "/docs/agent-kit", label: "Agent Kit" },
];

const moreGroup = [
  { href: "/docs/contracts", label: "Contracts", desc: "Standard library of CDR conditions." },
  { href: "/docs/agent-kit/mcp", label: "MCP server", desc: "Drop-in stdio server for Claude / Cursor." },
  { href: "/docs/scaffolder", label: "Scaffolder", desc: "npm create cdr-kit — start in seconds." },
  { href: "/#live", label: "Live on Aeneid", desc: "Deployed condition addresses." },
];

const drawerLinks = [
  ...primary,
  { href: "/showcase/blog", label: "Showcase: blog (new)" },
  ...moreGroup.map((m) => ({ href: m.href, label: m.label })),
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!moreOpen) return;
    function onClick(e: MouseEvent) {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

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
          {primary.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
          <div className="nav-more" ref={moreRef}>
            <button
              type="button"
              className={moreOpen ? "nav-more-btn is-open" : "nav-more-btn"}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              onClick={() => setMoreOpen((v) => !v)}
            >
              More
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {moreOpen && (
              <div className="nav-more-menu" role="menu">
                {moreGroup.map((m) => (
                  <Link key={m.href} href={m.href} className="nav-more-item" role="menuitem">
                    <span className="nm-label">{m.label}</span>
                    <span className="nm-desc">{m.desc}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link className="nav-new" href="/showcase/blog">
            <span className="nav-new-dot">new · 0.2</span>
            <span className="nav-new-label">UnlockablePill</span>
          </Link>
        </nav>
        <div className="nav-right">
          <a
            className="icon-btn nav-icon-md"
            href="https://www.npmjs.com/org/cdr-kit"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="npm org"
            title="npm"
          >
            <Npm />
          </a>
          <a
            className="icon-btn nav-icon-md"
            href="https://github.com/Blockchain-Oracle/cdr-kit"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            title="GitHub"
          >
            <Github />
          </a>
          <ThemeToggle />
          <Link className="btn btn-primary btn-sm nav-cta" href="/docs">
            Get started
          </Link>
          <button
            type="button"
            className="nav-burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="nav-drawer"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={open ? "burger-x open" : "burger-x"} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>

      <div
        id="nav-drawer"
        className={open ? "nav-drawer open" : "nav-drawer"}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        hidden={!open}
      >
        <nav className="nav-drawer-links">
          {drawerLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-drawer-footer">
          <a
            href="https://www.npmjs.com/org/cdr-kit"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="npm org"
          >
            <Npm /> <span>npm</span>
          </a>
          <a
            href="https://github.com/Blockchain-Oracle/cdr-kit"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <Github /> <span>GitHub</span>
          </a>
          <span className="nav-drawer-ver">v0.2.0</span>
        </div>
      </div>
    </header>
  );
}
