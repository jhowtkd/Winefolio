import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  setDark: () => {},
});

const STORAGE_KEY = 'wine_sommelier_night_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Check saved local storage preference
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          return saved === 'dark';
        }
        return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
      } catch (e) {
        console.warn('Unable to access localStorage or matchMedia for theme:', e);
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
        document.body.classList.add('dark');
        localStorage.setItem(STORAGE_KEY, 'dark');
      } else {
        root.classList.remove('dark');
        document.body.classList.remove('dark');
        localStorage.setItem(STORAGE_KEY, 'light');
      }
    } catch (e) {
      console.warn('Unable to persist theme to localStorage:', e);
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);
  const setDark = (dark: boolean) => setIsDark(dark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
