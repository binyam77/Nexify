import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
type Theme = 'light' | 'dark';
const VALID_THEMES: Theme[] = ['light', 'dark'];

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function readStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem('theme');
    // Whitelist validation — XSS-injected localStorage ዋጋ ቢኖር እንኳ 'light'/'dark' ካልሆነ አይተገበርም
    return VALID_THEMES.includes(saved as Theme) ? (saved as Theme) : 'light';
  } catch {
    return 'light';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // storage disabled ቢሆን ምንም አይደረግም, in-memory theme ብቻ ይቆያል
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    if (VALID_THEMES.includes(t)) setThemeState(t);
  };
  const toggleTheme = () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}