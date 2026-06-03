"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Identifier for one of the storage adapters that ships with `@cdr-kit/core`.
 * Mirrors the names exported there so the picker's `value` round-trips cleanly
 * into your `storage` selection logic.
 */
export type StorageProviderId =
  | "pinata"
  | "supabase"
  | "storacha"
  | "ipfs"
  | "s3"
  | "helia"
  | "gateway"
  | "memory";

export interface StorageProviderOption {
  id: StorageProviderId;
  name: string;
  description: string;
  /** Brand accent color used for the tile's glyph + border. */
  brand: string;
  /** Inline SVG glyph (24×24 viewBox). Authored in `currentColor` so theming works. */
  glyph: ReactNode;
}

/* --- Provider catalogue --------------------------------------------------- */

/** Symbolic glyphs in 24x24. Each is a deliberate cdr-kit interpretation of the
 *  provider's shape language — NOT a copy of their official logo. Keeps the
 *  picker visually consistent + license-clean. */
const Glyphs = {
  pinata: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 8c0-1.5 1.5-3 3.5-3h7c2 0 3.5 1.5 3.5 3v6c0 1.5-1.5 3-3.5 3H12l-3 4-1.5-4h-2C5 17 5 15.5 5 14V8z" />
      <circle cx="9.5" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="11" r="1" fill="currentColor" stroke="none" />
      <path d="M9 14c1 .8 2 1 3 1s2-.2 3-1" />
    </svg>
  ),
  supabase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
      <path d="M13 3 L4 13 H11 V21 L20 11 H13 Z" fill="currentColor" fillOpacity="0.15" />
    </svg>
  ),
  storacha: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
      <path d="M4 7l8-4 8 4-8 4-8-4z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 17l8 4 8-4" />
    </svg>
  ),
  ipfs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M12 3v18M4 7.5l16 9M20 7.5l-16 9" opacity="0.5" />
    </svg>
  ),
  s3: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 7c0-1 3-2 7-2s7 1 7 2v10c0 1-3 2-7 2s-7-1-7-2V7z" />
      <path d="M5 7c0 1 3 2 7 2s7-1 7-2" />
      <path d="M5 12c0 1 3 2 7 2s7-1 7-2" opacity="0.6" />
    </svg>
  ),
  helia: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21c4-2 7-5 7-10 0-3.5-3-7-7-7s-7 3.5-7 7c0 5 3 8 7 10z" />
      <path d="M12 21V7" />
    </svg>
  ),
  gateway: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a13 13 0 010 18M12 3a13 13 0 000 18" opacity="0.55" />
    </svg>
  ),
  memory: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M8 6v12M16 6v12M4 10h2M4 14h2M18 10h2M18 14h2" />
    </svg>
  ),
};

const DEFAULT_PROVIDERS: readonly StorageProviderOption[] = [
  {
    id: "pinata",
    name: "Pinata",
    description: "Hosted IPFS pinning",
    brand: "#E64237",
    glyph: Glyphs.pinata,
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Postgres + Storage",
    brand: "#3ECF8E",
    glyph: Glyphs.supabase,
  },
  {
    id: "storacha",
    name: "Storacha",
    description: "UCAN pinning / Filecoin",
    brand: "#D97706",
    glyph: Glyphs.storacha,
  },
  {
    id: "ipfs",
    name: "IPFS",
    description: "Self-hosted Kubo",
    brand: "#5A8DEE",
    glyph: Glyphs.ipfs,
  },
  {
    id: "s3",
    name: "S3 / R2",
    description: "AWS, Cloudflare R2",
    brand: "#F59E0B",
    glyph: Glyphs.s3,
  },
  {
    id: "helia",
    name: "Helia",
    description: "Browser-embedded IPFS",
    brand: "#22C55E",
    glyph: Glyphs.helia,
  },
  {
    id: "gateway",
    name: "Gateway (read-only)",
    description: "Any public IPFS gateway",
    brand: "#8B5CF6",
    glyph: Glyphs.gateway,
  },
  {
    id: "memory",
    name: "Memory",
    description: "Tests + CI",
    brand: "#94A3B8",
    glyph: Glyphs.memory,
  },
];

/* --- Component ------------------------------------------------------------ */

export interface StorageProviderPickerProps {
  /** Currently-selected provider id. Pass `undefined` for "none chosen". */
  value?: StorageProviderId;
  /** Fires when the user clicks a tile. */
  onChange: (id: StorageProviderId) => void;
  /**
   * Restrict to a subset of providers (default: all 8). Order is respected.
   * Useful when your platform only supports specific backends.
   */
  include?: readonly StorageProviderId[];
  /** Visual heading above the tiles. Pass `null` to hide. */
  heading?: ReactNode;
  /** Optional className for the root container. */
  className?: string;
  /** Optional inline style for the root container. */
  style?: CSSProperties;
}

/**
 * Tile-grid picker for the storage backend a form submission will be routed
 * through. Visual companion to the `CdrStorageProvider` factories shipped from
 * `@cdr-kit/core` — pick a tile, then build the matching adapter on the server
 * side and pass it to `storeFormSubmission`.
 *
 * **Not for respondent UIs.** Render this in your admin/setup screen, not on the
 * public form itself. The respondent doesn't pick the backend — you do.
 *
 * No external CSS dependency — styles inline via `data-` attributes so it adapts
 * to whatever surface you drop it into. Use `[data-cdr-provider-picker]` etc. as
 * style hooks if you want to override the defaults.
 */
export function StorageProviderPicker({
  value,
  onChange,
  include,
  heading = "Storage backend",
  className,
  style,
}: StorageProviderPickerProps) {
  const providers = include
    ? DEFAULT_PROVIDERS.filter((p) => include.includes(p.id)).sort(
        (a, b) => include.indexOf(a.id) - include.indexOf(b.id),
      )
    : DEFAULT_PROVIDERS;

  return (
    <div data-cdr-provider-picker className={className} style={style}>
      {heading !== null && (
        <p data-cdr-provider-heading>{heading}</p>
      )}
      <div data-cdr-provider-grid>
        {providers.map((p) => {
          const selected = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              data-cdr-provider-option
              data-selected={selected ? "" : undefined}
              onClick={() => onChange(p.id)}
              aria-pressed={selected}
              style={{ ["--cdr-provider-brand" as string]: p.brand } as CSSProperties}
              title={`${p.name} — ${p.description}`}
            >
              <span data-cdr-provider-glyph aria-hidden>{p.glyph}</span>
              <span data-cdr-provider-meta>
                <span data-cdr-provider-name>{p.name}</span>
                <span data-cdr-provider-desc>{p.description}</span>
              </span>
              {selected && (
                <span data-cdr-provider-check aria-hidden>
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8l3 3 7-7" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Public catalogue if you want to render your own picker or check the brand color. */
export const STORAGE_PROVIDERS: readonly StorageProviderOption[] = DEFAULT_PROVIDERS;
