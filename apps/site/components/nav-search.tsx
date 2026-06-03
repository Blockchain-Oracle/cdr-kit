"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Pagefind-backed docs search.
 *
 * Pagefind runs as a post-build step (`pagefind --site .next/server/app …`) and
 * emits a static index to `public/pagefind/`. The browser loads `/pagefind/pagefind.js`
 * at runtime, runs the index in-WASM, returns results in single-digit ms. No API route,
 * no server-side index rebuild, nothing to debug.
 *
 * Keyboard: Cmd/Ctrl+K opens, Esc closes, ↑/↓ navigates, Enter follows.
 */

interface PagefindResult {
  id: string;
  data(): Promise<{
    url: string;
    raw_url: string;
    meta: { title?: string };
    excerpt: string;
  }>;
}

interface PagefindAPI {
  search(query: string): Promise<{ results: PagefindResult[] }>;
}

interface Hit {
  id: string;
  title: string;
  url: string;
  excerpt: string;
}

declare global {
  interface Window {
    pagefind?: PagefindAPI;
  }
}

const __dynImport = (specifier: string): Promise<unknown> => {
  // Hide the literal specifier from Next/Turbopack static-analysis — pagefind is
  // a *post-build* asset that lives under /pagefind/, not in node_modules.
  const dyn = new Function("s", "return import(s)") as (s: string) => Promise<unknown>;
  return dyn(specifier);
};

/** Pagefind URLs come from the prerendered html source — strip the .html so the
 *  client links to the route Next.js actually serves. Idempotent. */
function normalizeSearchUrl(url: string): string {
  // Drop trailing /index.html or .html
  let u = url.replace(/\/index\.html$/i, "/");
  u = u.replace(/\.html$/i, "");
  // Collapse a trailing slash (except for the root) so "/docs/" → "/docs"
  if (u.length > 1 && u.endsWith("/")) u = u.slice(0, -1);
  return u;
}

async function loadPagefind(): Promise<PagefindAPI | null> {
  if (typeof window === "undefined") return null;
  if (window.pagefind) return window.pagefind;
  try {
    const mod = (await __dynImport("/pagefind/pagefind.js")) as PagefindAPI;
    window.pagefind = mod;
    return mod;
  } catch {
    return null;
  }
}

export function NavSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<number | undefined>(undefined);
  const pagefindRef = useRef<PagefindAPI | null>(null);
  const pagefindMissing = useRef(false);

  // Cmd/Ctrl+K opens; Esc closes
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

  // Lazy-load Pagefind on first open
  useEffect(() => {
    if (!open || pagefindRef.current || pagefindMissing.current) return;
    void loadPagefind().then((pf) => {
      if (pf) pagefindRef.current = pf;
      else pagefindMissing.current = true;
    });
  }, [open]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setHits([]);
      setLoading(false);
      return;
    }
    const pf = pagefindRef.current ?? (await loadPagefind());
    if (!pf) {
      setHits([]);
      setLoading(false);
      pagefindMissing.current = true;
      return;
    }
    pagefindRef.current = pf;
    setLoading(true);
    try {
      const search = await pf.search(q);
      const data = await Promise.all(search.results.slice(0, 8).map((r) => r.data()));
      setHits(
        data.map((d, i) => ({
          id: search.results[i]!.id,
          title: d.meta.title ?? d.url,
          // Pagefind indexes the prerendered .html files, so the urls come back as
          // /docs/foo.html — Next.js's app router serves them at /docs/foo (no extension).
          // Strip the trailing .html / index.html so clicking a result doesn't 404.
          url: normalizeSearchUrl(d.url),
          excerpt: d.excerpt,
        })),
      );
    } catch {
      setHits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => void runSearch(query), 60);
    return () => window.clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  return (
    <>
      <button
        type="button"
        className="nav-search-trigger"
        onClick={() => setOpen(true)}
        aria-label="Search docs"
        title="Search docs (⌘K)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="nav-search-placeholder">Search docs</span>
        <kbd className="nav-search-kbd">⌘K</kbd>
      </button>

      {open && (
        <div
          className="nav-search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Search docs"
          onClick={() => setOpen(false)}
        >
          <div className="nav-search-panel" onClick={(e) => e.stopPropagation()}>
            <div className="nav-search-inputrow">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setFocused(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setFocused((i) => Math.min(i + 1, hits.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setFocused((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter" && hits[focused]) {
                    window.location.href = hits[focused]!.url;
                  }
                }}
                placeholder="Search components, hooks, contracts…"
                aria-label="Search query"
              />
              <kbd className="nav-search-esckbd">esc</kbd>
            </div>
            <div className="nav-search-results">
              {loading && query && <p className="nav-search-hint">Searching&hellip;</p>}
              {!loading && pagefindMissing.current && (
                <p className="nav-search-empty">
                  Search index is built at <code>pnpm build</code>. Run a production build to enable
                  search.
                </p>
              )}
              {!loading && hits.length === 0 && query && !pagefindMissing.current && (
                <p className="nav-search-empty">
                  No docs pages match &ldquo;{query}&rdquo;. Try <em>vault</em>, <em>hook</em>, or{" "}
                  <em>condition</em>.
                </p>
              )}
              {!loading && hits.length === 0 && !query && (
                <p className="nav-search-hint">Type to search the docs.</p>
              )}
              {hits.map((hit, i) => (
                <Link
                  key={hit.id}
                  href={hit.url}
                  className={i === focused ? "nav-search-result is-focused" : "nav-search-result"}
                  onMouseEnter={() => setFocused(i)}
                  onClick={() => setOpen(false)}
                >
                  <span className="nav-search-title">{hit.title}</span>
                  <span
                    className="nav-search-url"
                    dangerouslySetInnerHTML={{ __html: hit.excerpt }}
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
