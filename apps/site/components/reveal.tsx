"use client";

import { useRevealObserver } from "@/lib/use-in-view";

/** Mounts the IntersectionObserver that adds `.in` to every `.reveal` element on the page.
 *  Place once in the root layout. */
export function Reveal() {
  useRevealObserver();
  return null;
}
