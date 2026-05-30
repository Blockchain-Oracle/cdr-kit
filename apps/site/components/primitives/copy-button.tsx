"use client";

import { useState } from "react";
import { Copy } from "../icons";
import { copyToClipboard } from "@/lib/copy";

const RESET_MS = 1400;

export function CopyButton({ value, label = "copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    const ok = await copyToClipboard(value);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), RESET_MS);
  };
  return (
    <button type="button" className={copied ? "copybtn copied" : "copybtn"} onClick={onClick}>
      <Copy width={13} height={13} />
      {copied ? "✓ copied" : label}
    </button>
  );
}
