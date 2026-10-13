import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Button } from '../components/ui/Button';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function getTimeBasedTheme(): Theme {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 19 ? 'light' : 'dark';
}

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') {
    return saved; 
  }
  return getTimeBasedTheme();
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="theme-canvas min-h-screen transition-colors">
          {children}
          <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

function ThemeToggleButton({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onToggle}
      className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full border-teal-200 p-0 text-teal-800 shadow-xl hover:scale-105 active:scale-95 dark:border-teal-800 dark:text-teal-200"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </Button>
  );
}