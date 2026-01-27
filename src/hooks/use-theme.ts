'use client';

import { useEffect, useState } from 'react';

export type Theme = 'garden' | 'ocean' | 'sunset' | 'forest';
export type Mode = 'light' | 'dark';

const THEME_KEY = 'garden-ui-theme';
const MODE_KEY = 'garden-ui-mode';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('garden');
  const [mode, setModeState] = useState<Mode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Load saved theme and mode from localStorage
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    const savedMode = localStorage.getItem(MODE_KEY) as Mode | null;

    if (savedTheme) {
      setThemeState(savedTheme);
    }

    if (savedMode) {
      setModeState(savedMode);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Apply theme
    if (theme === 'garden') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }

    // Apply mode
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(MODE_KEY, mode);
  }, [theme, mode, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return {
    theme,
    mode,
    setTheme,
    setMode,
    toggleMode,
    mounted,
  };
}
