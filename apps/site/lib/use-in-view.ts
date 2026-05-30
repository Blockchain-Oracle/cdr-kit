"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Adds `.in` class to .reveal-style elements on intersection. Mirrors the bundle's `app.js`
 * implementation: IntersectionObserver with threshold 0.08 + safety-net force-reveal for any
 * in-viewport `.reveal:not(.in)` elements at 200ms and 1.4s after load (in case IO doesn't fire
 * for above-the-fold content). Respects prefers-reduced-motion (instant reveal).
 *
 * Mount this hook ONCE at the layout level — it observes every `.reveal` element on the page.
 */
export function useRevealObserver(): void {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          if (i < 5) el.style.transitionDelay = `${i * 70}ms`;
          el.classList.add("in");
          io.unobserve(el);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );
    document.querySelectorAll<HTMLElement>(".reveal:not(.in)").forEach((el) => io.observe(el));

    // Safety net: ensure in-viewport elements reveal even if IO doesn't fire (e.g. above-the-fold).
    const ensure = () => {
      document.querySelectorAll<HTMLElement>(".reveal:not(.in)").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("in");
      });
    };
    const t1 = window.setTimeout(ensure, 200);
    const t2 = window.setTimeout(ensure, 1400);

    return () => {
      io.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);
}

/** Track a single element entering the viewport (for one-shot animations like the agent terminal). */
export function useInView<T extends Element>(opts: IntersectionObserverInit = { threshold: 0.3 }): [
  React.RefObject<T | null>,
  boolean,
] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      opts,
    );
    io.observe(node);
    return () => io.disconnect();
  }, [opts]);
  return [ref, inView];
}
