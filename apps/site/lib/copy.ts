"use client";

/**
 * Copy text to the clipboard. Returns true on success. Soft-fails if the Clipboard API is missing
 * or the user denies permission (returns false instead of throwing).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
