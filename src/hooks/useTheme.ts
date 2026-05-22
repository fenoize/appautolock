import { useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'app-theme';
const EVENT = 'app-theme-change';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

// Initialize once on module load so the class is set before any component renders
if (typeof window !== 'undefined') {
  applyTheme(getInitialTheme());
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const handler = (e: Event) => {
      const next = (e as CustomEvent<Theme>).detail;
      if (next === 'light' || next === 'dark') setThemeState(next);
    };
    window.addEventListener(EVENT, handler);
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
        setThemeState(e.newValue);
      }
    });
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    applyTheme(t);
    localStorage.setItem(STORAGE_KEY, t);
    window.dispatchEvent(new CustomEvent<Theme>(EVENT, { detail: t }));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
