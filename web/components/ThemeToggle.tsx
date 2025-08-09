"use client";
import { useEffect, useState } from "react";

type Theme = 'light' | 'dark';

function detectInitial(): Theme {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {}
  return 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  // Initial mount – set theme before first paint effect
  useEffect(() => {
    const t = detectInitial();
    setTheme(t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, []);

  // Apply changes & persist
  useEffect(() => {
    if (!theme) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('theme', theme); } catch {}
  }, [theme]);

  // Sync across tabs
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setTheme(e.newValue);
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (theme === null) {
    return (
      <button aria-label="Toggle theme" className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded border opacity-0 pointer-events-none" />
    );
  }

  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      aria-label={`Activate ${next} mode`}
      className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded border hover:bg-gray-50 dark:hover:bg-gray-800"
      onClick={() => setTheme(next)}
    >
      {theme === 'dark' ? (
        // Sun icon (currently dark, show sun to indicate going light)
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84 5.34 3.42 3.92 4.84l1.42 1.42 1.42-1.42Zm10.5 0 1.41-1.42 1.42 1.42-1.42 1.42-1.41-1.42ZM12 2h0v2h0V2Zm0 18h0v2h0v-2ZM4 12H2v0h2v0Zm18 0h-2v0h2v0Zm-3.66 7.76 1.42 1.42 1.42-1.42-1.42-1.42-1.42 1.42ZM4.84 17.24l-1.42 1.42 1.42 1.42 1.42-1.42-1.42-1.42ZM12 6a6 6 0 1 1 0 12A6 6 0 0 1 12 6Z"/></svg>
      ) : (
        // Moon icon (currently light, show moon to indicate going dark)
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.64 13.01A9 9 0 1 1 11 2.36a7 7 0 1 0 10.64 10.65Z"/></svg>
      )}
      <span className="capitalize">{next}</span>
    </button>
  );
}
