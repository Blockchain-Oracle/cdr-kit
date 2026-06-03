"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useDocsSearch } from "fumadocs-core/search/client";

/**
 * Compact docs search button → dialog. Hits `/api/search` (Orama, via fumadocs).
 * The visual style matches the rest of the cdr-kit nav — same icon-btn pattern,
 * dark popover with the same border/radius tokens.
 *
 * Keyboard: Cmd/Ctrl+K opens, Esc closes, ArrowUp/Down navigates results, Enter follows.
 */
export function NavSearch() {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { search, setSearch, query } = useDocsSearch({ type: "fetch" });

  // Cmd/Ctrl+K to open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  const results = query.data === "empty" || !query.data ? [] : query.data;

  return (
    <>
      <button
        type="button"
        className="icon-btn nav-icon-md nav-search-btn"
        onClick={() => setOpen(true)}
        aria-label="Search docs"
        title="Search docs (⌘K)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="nav-search-kbd">⌘K</span>
      </button>

      {open && (
        <div className="nav-search-overlay" role="dialog" aria-modal="true" aria-label="Search docs" onClick={() => setOpen(false)}>
          <div className="nav-search-panel" onClick={(e) => e.stopPropagation()}>
            <div className="nav-search-inputrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setFocused(0); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setFocused((i) => Math.min(i + 1, results.length - 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setFocused((i) => Math.max(i - 1, 0)); }
                  else if (e.key === "Enter" && results[focused]) {
                    window.location.href = results[focused]!.url;
                  }
                }}
                placeholder="Search components, hooks, contracts…"
                aria-label="Search query"
              />
              <kbd className="nav-search-esckbd">esc</kbd>
            </div>
            <div className="nav-search-results">
              {results.length === 0 && search && (
                <p className="nav-search-empty">No matches for &ldquo;{search}&rdquo;.</p>
              )}
              {results.length === 0 && !search && (
                <p className="nav-search-hint">Type to search the docs.</p>
              )}
              {results.map((r, i) => (
                <Link
                  key={r.id}
                  href={r.url}
                  className={i === focused ? "nav-search-result is-focused" : "nav-search-result"}
                  onMouseEnter={() => setFocused(i)}
                  onClick={() => setOpen(false)}
                >
                  <span className="nav-search-title">{r.content}</span>
                  <span className="nav-search-url">{r.url}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
