"use client";
import { useEffect, useState } from "react";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const t = getInitialTheme();
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded border hover:bg-gray-50 dark:hover:bg-gray-800"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
    >
      {theme === "dark" ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.64 13.01A9 9 0 1 1 11 2.36a7 7 0 1 0 10.64 10.65Z"/></svg>
          <span>Dark</span>
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84 5.34 3.42 3.92 4.84l1.42 1.42 1.42-1.42Zm10.5 0 1.41-1.42 1.42 1.42-1.42 1.42-1.41-1.42ZM12 2h0v2h0V2Zm0 18h0v2h0v-2ZM4 12H2v0h2v0Zm18 0h-2v0h2v0Zm-3.66 7.76 1.42 1.42 1.42-1.42-1.42-1.42-1.42 1.42ZM4.84 17.24l-1.42 1.42 1.42 1.42 1.42-1.42-1.42-1.42ZM12 6a6 6 0 1 1 0 12A6 6 0 0 1 12 6Z"/></svg>
          <span>Light</span>
        </>
      )}
    </button>
  );
}
