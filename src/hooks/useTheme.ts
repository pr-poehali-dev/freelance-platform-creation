import { useState, useEffect } from 'react';

export type Theme = 'default' | 'dark' | 'yandex';

const THEME_KEY = 'app-theme';

const THEME_CLASSES: Record<Theme, string> = {
  default: '',
  dark: 'theme-dark',
  yandex: 'theme-yandex',
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem(THEME_KEY) as Theme) || 'default';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-yandex');
    if (THEME_CLASSES[theme]) {
      root.classList.add(THEME_CLASSES[theme]);
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return { theme, setTheme };
}
