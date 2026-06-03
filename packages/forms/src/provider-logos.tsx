"use client";
import type { ReactNode } from "react";

/** Inline SVG logos for the storage providers. Mirrors `src/assets/providers/*.svg`
 *  so consumers don't need a bundler asset-loader pipeline configured. */
export const ProviderLogos: Record<string, ReactNode> = {
  pinata: (
    <svg viewBox="0 0 32 32" width="100%" height="100%" role="img" aria-label="Pinata">
      <rect width="32" height="32" rx="7" fill="#E85433" />
      <path
        d="M16 6c-1.1 0-2 .9-2 2v2.1l-2.1-2.1c-.8-.8-2-.8-2.8 0s-.8 2 0 2.8L11.2 13H9.1c-1.1 0-2 .9-2 2s.9 2 2 2H13l-4.9 4.9c-.8.8-.8 2 0 2.8.4.4.9.6 1.4.6s1-.2 1.4-.6L16 20.2V26c0 1.1.9 2 2 2s2-.9 2-2v-5.8l4.1 4.1c.8.8 2 .8 2.8 0s.8-2 0-2.8L21 17h2.9c1.1 0 2-.9 2-2s-.9-2-2-2H21l2.1-2.1c.8-.8.8-2 0-2.8s-2-.8-2.8 0L18 10.1V8c0-1.1-.9-2-2-2z"
        fill="#fff"
      />
    </svg>
  ),
  storacha: (
    <svg viewBox="0 0 32 32" width="100%" height="100%" role="img" aria-label="Storacha">
      <rect width="32" height="32" rx="7" fill="#FF3B6F" />
      <path
        d="M11 9h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3zm1 4v2h6v-2h-6zm0 4v2h6v-2h-6z"
        fill="#fff"
      />
      <circle cx="22" cy="10" r="2" fill="#fff" />
    </svg>
  ),
  supabase: (
    <svg viewBox="0 0 32 32" width="100%" height="100%" role="img" aria-label="Supabase">
      <rect width="32" height="32" rx="7" fill="#3ECF8E" />
      <path
        d="M16.5 5.2c.6 0 1 .6.7 1.1l-4.2 8.4h6.3c.6 0 .9.6.5 1l-7.5 9.1c-.5.6-1.4-.1-1-.7l3.7-7.4H8.7c-.6 0-.9-.6-.5-1l7.5-10.1c.2-.3.5-.4.8-.4z"
        fill="#fff"
      />
    </svg>
  ),
  ipfs: (
    <svg viewBox="0 0 32 32" width="100%" height="100%" role="img" aria-label="IPFS / Helia">
      <rect width="32" height="32" rx="7" fill="#469EA2" />
      <path
        d="M16 4 5 10v12l11 6 11-6V10L16 4zm0 2.6 7.7 4.2L16 15 8.3 10.8 16 6.6zM7 12.5l8 4.4v8.6l-8-4.4v-8.6zm18 0v8.6l-8 4.4v-8.6l8-4.4z"
        fill="#fff"
      />
    </svg>
  ),
  cdr: (
    <svg viewBox="0 0 32 32" width="100%" height="100%" role="img" aria-label="CDR Gateway">
      <rect width="32" height="32" rx="7" fill="#6D5EFC" />
      <path
        d="M10 8h6a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-6V8zm3 3v10h3a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-3zm10 0a3 3 0 0 1 0 6h-1v-2h1a1 1 0 0 0 0-2h-1v-2h1zm0 8a3 3 0 0 1 0 6h-1v-2h1a1 1 0 0 0 0-2h-1v-2h1z"
        fill="#fff"
      />
    </svg>
  ),
};
