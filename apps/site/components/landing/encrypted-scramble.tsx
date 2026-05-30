"use client";

import { useEffect, useState } from "react";

const GLYPHS = "01<>{}#$%&*+=/\\|";
const TOTAL_FRAMES = 38;
const FRAME_MS = 38;

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

function scramble(target: string): string {
  return target.replace(/./g, () => randomGlyph() ?? "?");
}

/** Renders {final} after a 38-frame scramble-reveal animation. Skipped under reduced-motion.
 *  Mirrors the bundle's `app.js` `encWord` logic exactly. */
export function EncryptedScramble({ final, className }: { final: string; className?: string }) {
  const [text, setText] = useState(final);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    setText(scramble(final));
    let frame = 0;
    const iv = window.setInterval(() => {
      frame++;
      const resolved = Math.floor((frame / TOTAL_FRAMES) * final.length);
      let out = "";
      for (let i = 0; i < final.length; i++) {
        out += i < resolved ? final[i] : randomGlyph();
      }
      setText(out);
      if (frame >= TOTAL_FRAMES) {
        setText(final);
        window.clearInterval(iv);
      }
    }, FRAME_MS);
    return () => window.clearInterval(iv);
  }, [final]);
  return <span className={className}>{text}</span>;
}
