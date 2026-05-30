"use client";

import { useEffect, useState } from "react";

const MEDIA = "(prefers-reduced-motion: reduce)";

/** Returns `true` when the user has set OS-level reduce-motion preference. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(MEDIA);
    setReduced(mql.matches);
    const onChange = () => setReduced(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
