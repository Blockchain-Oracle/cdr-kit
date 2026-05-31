"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

const MOBILE_BREAKPOINT = 560;

export interface FloatingPos {
  /** "popover" anchors to the trigger; "sheet" pins to bottom of viewport. */
  mode: "popover" | "sheet";
  top: number;
  left: number;
  /** "above" means the card sits above the anchor (flipped due to overflow). */
  placement: "below" | "above";
  /** Card width — bounded so it never overflows the viewport. */
  width: number;
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Custom anchored-popover positioning. Zero deps. Flips above when overflow + collapses to bottom-sheet on narrow viewports. */
export function useFloatingCard(open: boolean, anchorRef: RefObject<HTMLElement | null>): FloatingPos {
  const [pos, setPos] = useState<FloatingPos>({ mode: "popover", top: 0, left: 0, placement: "below", width: 360 });
  const rafRef = useRef<number | null>(null);

  const recompute = useCallback(() => {
    if (!anchorRef.current || typeof window === "undefined") return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (vw <= MOBILE_BREAKPOINT) {
      setPos({ mode: "sheet", top: 0, left: 0, placement: "below", width: vw });
      return;
    }
    const r = anchorRef.current.getBoundingClientRect();
    const width = Math.min(360, vw - 32);
    const gap = 10;
    const spaceBelow = vh - r.bottom;
    const spaceAbove = r.top;
    const placement: "below" | "above" = spaceBelow >= 280 || spaceBelow >= spaceAbove ? "below" : "above";
    const top = placement === "below" ? r.bottom + gap + window.scrollY : r.top - gap + window.scrollY;
    const idealLeft = r.left + r.width / 2 - width / 2 + window.scrollX;
    const left = Math.max(12 + window.scrollX, Math.min(idealLeft, vw - width - 12 + window.scrollX));
    setPos({ mode: "popover", top, left, placement, width });
  }, [anchorRef]);

  useIsoLayoutEffect(() => {
    if (!open) return;
    recompute();
    const onChange = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(recompute);
    };
    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange);
    return () => {
      window.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [open, recompute]);

  return pos;
}
