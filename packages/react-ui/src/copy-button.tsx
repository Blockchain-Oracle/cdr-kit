"use client";

import { useState } from "react";
import { Copy, Check } from "./icons";

export interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

/** Minimal copy-to-clipboard control. Flashes a check icon for 1.4s on success. */
export function CopyButton({ value, label = "copy", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  async function onClick() {
    try {
      await navigator.clipboard?.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <button type="button" className={className} onClick={onClick} aria-label={label}>
      {copied ? <Check width={13} height={13} /> : <Copy width={13} height={13} />}
    </button>
  );
}
