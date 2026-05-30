"use client";

import { Sun, Moon } from "./icons";

const STORAGE_KEY = "cdr-theme";

function setTheme(next: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", next);
  try {
    if (next === "dark") localStorage.setItem(STORAGE_KEY, "dark");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore — private mode or quota errors */
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  setTheme(current === "dark" ? "light" : "dark");
}

/** Sun/moon toggle. The current theme is set on `<html data-theme>` by an inline init script in
 *  `app/layout.tsx` (FOUC-safe); this button just flips it and persists to localStorage. */
export function ThemeToggle() {
  return (
    <button
      className="icon-btn theme-toggle"
      aria-label="Toggle theme"
      title="Toggle theme"
      type="button"
      onClick={toggleTheme}
    >
      <Moon className="moon" />
      <Sun className="sun" />
    </button>
  );
}
