"use client";

import { useState } from "react";
import { Copy } from "./icons";

export interface ShortAddressProps {
  address: string;
  /** Leading characters to keep (after the 0x). */
  head?: number;
  /** Trailing characters to keep. */
  tail?: number;
  copyable?: boolean;
}

function truncate(addr: string, head: number, tail: number) {
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

/** Mono address chip with optional inline copy. */
export function ShortAddress({ address, head = 6, tail = 4, copyable = true }: ShortAddressProps) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard?.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1300);
    } catch {
      /* unavailable */
    }
  }
  return (
    <span className={copied ? "cdr-ui-addr-chip copied" : "cdr-ui-addr-chip"} data-cdr-ui="">
      {truncate(address, head, tail)}
      {copyable && (
        <button type="button" onClick={copy} aria-label="Copy address">
          <Copy />
        </button>
      )}
    </span>
  );
}
