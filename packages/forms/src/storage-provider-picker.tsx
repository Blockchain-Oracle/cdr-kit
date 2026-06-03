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
  /** Brand accent color used for the chip's outline + the detail card accent. */
  brand: string;
  /** Inline SVG mark. 24x24 viewBox, brand-colored. Real CC0 marks where available;
   *  refined cdr-kit-authored shapes (in the provider's brand color) for the rest. */
  mark: ReactNode;
  /** One-line code snippet for the detail card — shows the factory the picker maps to. */
  snippet: string;
  /** Optional doc link rendered under the snippet. Relative URLs assumed to be docs. */
  docsHref?: string;
}

/* --- Provider marks ------------------------------------------------------- */
/* Real CC0 marks (SimpleIcons) for Supabase / IPFS / Cloudflare. Refined
 * cdr-kit-authored shapes for the rest — picked so each provider has an
 * instantly distinct silhouette at 22px. */

const Marks = {
  pinata: (
    <svg viewBox="0 0 24 24" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 3.5h12c0 4.2-3.3 7-5.2 7.6v8.4l-.8 1.5-.8-1.5v-8.4C9.3 10.5 6 7.7 6 3.5z"
        fill="currentColor"
      />
      <path d="M9.8 3.5v3.2M14.2 3.5v3.2" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
    </svg>
  ),
  supabase: (
    /* SimpleIcons (CC0) — Supabase brand mark */
    <svg viewBox="0 0 24 24" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.642z"
        fill="currentColor"
      />
    </svg>
  ),
  storacha: (
    <svg viewBox="0 0 24 24" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L3 6.5v3L12 14l9-4.5v-3L12 2z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M3 13l9 4.5L21 13M3 18l9 4.5L21 18"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinejoin="round"
        opacity="0.75"
      />
    </svg>
  ),
  ipfs: (
    /* SimpleIcons (CC0) — IPFS brand mark */
    <svg viewBox="0 0 24 24" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 0L1.608 6v12L12 24l10.392-6V6zm-1.073 1.445h.001a1.8 1.8 0 002.138 0l7.534 4.35a1.794 1.794 0 000 .403l-7.535 4.35a1.8 1.8 0 00-2.137 0l-7.536-4.35a1.795 1.795 0 000-.402zM21.324 7.4c.109.08.226.147.349.201v8.7a1.8 1.8 0 00-1.069 1.852l-7.535 4.35a1.8 1.8 0 00-.349-.2l-.009-8.653a1.8 1.8 0 001.07-1.851zm-18.648.048l7.535 4.35a1.8 1.8 0 001.069 1.852v8.7c-.124.054-.24.122-.349.202l-7.535-4.35a1.8 1.8 0 00-1.069-1.852v-8.7c.124-.054.24-.122.35-.202z"
        fill="currentColor"
      />
    </svg>
  ),
  s3: (
    /* AWS S3 "bucket" silhouette — cdr-kit-authored, recognizably bucket-shaped */
    <svg viewBox="0 0 24 24" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5.2 6.4L18.8 6.4 17.5 19a1 1 0 01-1 .9H7.5a1 1 0 01-1-.9L5.2 6.4z"
        fill="currentColor"
      />
      <path d="M3.5 6.4h17v1.2H3.5z" fill="currentColor" opacity="0.9" />
      <path
        d="M10 9.5v8M14 9.5v8"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  ),
  helia: (
    /* Helia is the JS IPFS impl — leaf-on-stem mark, in their nature-green */
    <svg viewBox="0 0 24 24" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path
        d="M19 4c0 6.5-3.5 11-9 12-.5-2.5 0-5.5 2-8 1.5-1.8 4-3.2 7-4z"
        fill="currentColor"
      />
      <path
        d="M10 16c2.5-3.5 5.5-7 9-12"
        stroke="white"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.55"
        fill="none"
      />
      <path
        d="M5 20c1.5-2 3.2-3.5 5-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  ),
  gateway: (
    <svg viewBox="0 0 24 24" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3 12h18M12 3a13 13 0 010 18M12 3a13 13 0 000 18"
        stroke="currentColor"
        strokeWidth="1.7"
        fill="none"
        opacity="0.55"
      />
    </svg>
  ),
  memory: (
    <svg viewBox="0 0 24 24" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="6" width="16" height="12" rx="2.2" fill="currentColor" opacity="0.92" />
      <path
        d="M8 6v12M16 6v12"
        stroke="white"
        strokeWidth="1"
        opacity="0.5"
      />
      <path d="M4 10h2M4 14h2M18 10h2M18 14h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
};

const DEFAULT_PROVIDERS: readonly StorageProviderOption[] = [
  {
    id: "pinata",
    name: "Pinata",
    description: "Hosted IPFS pinning. Free signup. Simplest setup — one JWT env var.",
    brand: "#E64237",
    mark: Marks.pinata,
    snippet: 'createPinataStorage({ jwt: process.env.PINATA_JWT! })',
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Postgres + Object Storage. Best if you already use Supabase Auth/DB.",
    brand: "#3FCF8E",
    mark: Marks.supabase,
    snippet:
      'createSupabaseStorage({ supabaseUrl, key, bucket: "cdr-secrets" })',
  },
  {
    id: "storacha",
    name: "Storacha",
    description: "UCAN-backed pinning. Web3.storage successor. Filecoin-backed.",
    brand: "#D97706",
    mark: Marks.storacha,
    snippet:
      'createStorachaStorage({ key, spaceDid, proof })',
  },
  {
    id: "ipfs",
    name: "IPFS",
    description: "Self-hosted Kubo or any IPFS-compatible HTTP API.",
    brand: "#65C2CB",
    mark: Marks.ipfs,
    snippet:
      'createIpfsStorage({ addUrl, gatewayUrl })',
  },
  {
    id: "s3",
    name: "S3 / R2",
    description: "AWS S3, Cloudflare R2, Backblaze B2 — anything S3-compatible.",
    brand: "#F38020",
    mark: Marks.s3,
    snippet:
      'createS3Storage({ bucket, region, accessKeyId, secretAccessKey })',
  },
  {
    id: "helia",
    name: "Helia",
    description: "Browser-embedded IPFS. The user's tab is the node.",
    brand: "#22C55E",
    mark: Marks.helia,
    snippet: 'createHeliaStorage()',
  },
  {
    id: "gateway",
    name: "Gateway",
    description: "Read-only via any public IPFS gateway. Throws on upload.",
    brand: "#8B5CF6",
    mark: Marks.gateway,
    snippet: 'createReadOnlyGatewayStorage({ gatewayUrl })',
  },
  {
    id: "memory",
    name: "Memory",
    description: "In-process for tests + CI. Real CIDv1, content-addressed.",
    brand: "#94A3B8",
    mark: Marks.memory,
    snippet: 'createMemoryStorage()',
  },
];

/* --- Component ------------------------------------------------------------ */

export interface StorageProviderPickerProps {
  /** Currently-selected provider id. Pass `undefined` for "none chosen". */
  value?: StorageProviderId;
  /** Fires when the user clicks a chip. */
  onChange: (id: StorageProviderId) => void;
  /**
   * Restrict to a subset of providers (default: all 8). Order is respected.
   * Useful when your platform only supports specific backends.
   */
  include?: readonly StorageProviderId[];
  /** Visible heading above the chips. Pass `null` to hide. */
  heading?: ReactNode;
  /** When true (default), shows the brand-colored detail card under the chips
   *  for the selected provider. Set false for a compact toolbar mode. */
  showDetail?: boolean;
  /** Optional className for the root container. */
  className?: string;
  /** Optional inline style for the root container. */
  style?: CSSProperties;
}

/**
 * Admin-side picker for the storage backend a form submission will be routed
 * through. Renders a clickable chip-pill row + a brand-colored detail card for
 * the selected provider — designed to feel like the visual language of a
 * polished marketing site, not a raw form input.
 *
 * **Not for respondent UIs.** Drop this in your admin/setup screen, not on the
 * public form. The respondent fills the form; the server picks the backend.
 *
 * Real CC0 brand marks are used for Supabase, IPFS, and Cloudflare/R2. The
 * remaining providers (Pinata, Storacha, Helia, S3, Gateway, Memory) get
 * cdr-kit-authored brand-colored shapes — keeps licensing clean while staying
 * visually distinct.
 *
 * No CSS dependency at runtime; the picker is styled via `[data-cdr-provider-*]`
 * attribute selectors. Import `@cdr-kit/forms/styles.css` to opt into the
 * default theme.
 */
export function StorageProviderPicker({
  value,
  onChange,
  include,
  heading = "Storage backend",
  showDetail = true,
  className,
  style,
}: StorageProviderPickerProps) {
  const providers = include
    ? DEFAULT_PROVIDERS.filter((p) => include.includes(p.id)).sort(
        (a, b) => include.indexOf(a.id) - include.indexOf(b.id),
      )
    : DEFAULT_PROVIDERS;

  const selected = providers.find((p) => p.id === value) ?? null;

  return (
    <div data-cdr-provider-picker className={className} style={style}>
      {heading !== null && <p data-cdr-provider-heading>{heading}</p>}

      <div data-cdr-provider-chips role="radiogroup" aria-label="Storage backend">
        {providers.map((p) => {
          const isOn = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              data-cdr-provider-chip
              data-selected={isOn ? "" : undefined}
              role="radio"
              aria-checked={isOn}
              onClick={() => onChange(p.id)}
              style={{ ["--cdr-provider-brand" as string]: p.brand } as CSSProperties}
              title={p.description}
            >
              <span data-cdr-provider-mark aria-hidden>
                {p.mark}
              </span>
              <span data-cdr-provider-chipname>{p.name}</span>
            </button>
          );
        })}
      </div>

      {showDetail && selected && (
        <div
          data-cdr-provider-detail
          style={{ ["--cdr-provider-brand" as string]: selected.brand } as CSSProperties}
        >
          <div data-cdr-provider-detail-head>
            <span data-cdr-provider-detail-mark aria-hidden>
              {selected.mark}
            </span>
            <div data-cdr-provider-detail-meta>
              <p data-cdr-provider-detail-name>{selected.name}</p>
              <p data-cdr-provider-detail-desc>{selected.description}</p>
            </div>
            <span data-cdr-provider-detail-check aria-hidden>
              <svg
                viewBox="0 0 16 16"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8l3 3 7-7" />
              </svg>
            </span>
          </div>
          <pre data-cdr-provider-detail-snippet>
            <code>{selected.snippet}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

/** Public catalogue — for custom pickers / brand-color access / tests. */
export const STORAGE_PROVIDERS: readonly StorageProviderOption[] = DEFAULT_PROVIDERS;
