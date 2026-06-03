"use client";

import { useState } from "react";

/**
 * Per-page "Copy page" button — copies the raw MDX source so an AI agent
 * (Claude, GPT, etc.) can ingest a single page without crawling. The
 * markdown text is passed in from the server component, so this stays
 * fully client-side with no fetch round-trip.
 */
export function CopyPageButton({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard API not available — fall back silently
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="copy-page-btn"
      data-copied={copied || undefined}
      title="Copy page as markdown — paste into Claude / ChatGPT / Cursor"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {copied ? (
          <path d="M20 6 9 17l-5-5" />
        ) : (
          <>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </>
        )}
      </svg>
      <span>{copied ? "Copied" : "Copy page"}</span>
    </button>
  );
}
