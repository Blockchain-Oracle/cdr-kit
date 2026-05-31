"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Download } from "./icons";

const PNG = [0x89, 0x50, 0x4e, 0x47];
const JPG = [0xff, 0xd8, 0xff];
const GIF = [0x47, 0x49, 0x46];
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46];

function matchesMagic(bytes: Uint8Array, magic: number[]): boolean {
  if (bytes.length < magic.length) return false;
  for (let i = 0; i < magic.length; i++) if (bytes[i] !== magic[i]) return false;
  return true;
}

function detectImageMime(bytes: Uint8Array): string | undefined {
  if (matchesMagic(bytes, PNG)) return "image/png";
  if (matchesMagic(bytes, JPG)) return "image/jpeg";
  if (matchesMagic(bytes, GIF)) return "image/gif";
  if (matchesMagic(bytes, WEBP_RIFF) && bytes.length > 11 && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return undefined;
}

function tryUtf8(bytes: Uint8Array): string | undefined {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (text.length === 0) return undefined;
    return text;
  } catch {
    return undefined;
  }
}

/** Default decrypted-bytes renderer for `<UnlockablePill>`. Auto-detects image vs text vs binary. */
export function unlockedAuto(bytes: Uint8Array): ReactNode {
  return <AutoContent bytes={bytes} />;
}

function AutoContent({ bytes }: { bytes: Uint8Array }) {
  const imageMime = useMemo(() => detectImageMime(bytes), [bytes]);
  const text = useMemo(() => (imageMime ? undefined : tryUtf8(bytes)), [bytes, imageMime]);
  const [url, setUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!imageMime && text !== undefined) return;
    const blobMime = imageMime ?? "application/octet-stream";
    // Copy into a plain ArrayBuffer to avoid SharedArrayBuffer typing friction with Blob constructor.
    const buf = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buf).set(bytes);
    const blob = new Blob([buf], { type: blobMime });
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [bytes, imageMime, text]);

  if (imageMime && url) return <img className="cdr-ui-unl-img" src={url} alt="decrypted" />;
  if (text !== undefined) return <pre className="cdr-ui-unl-text">{text}</pre>;
  if (url) {
    return (
      <a className="cdr-ui-unl-dl" href={url} download={`payload-${bytes.byteLength}b.bin`}>
        <Download width={14} height={14} />
        Download payload · {bytes.byteLength.toLocaleString()} bytes
      </a>
    );
  }
  return null;
}
