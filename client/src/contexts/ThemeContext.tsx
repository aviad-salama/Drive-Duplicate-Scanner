import {
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Button } from '../components/ui/Button';
import { ThemeContext, type Theme } from './ThemeContextValue';

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

function ThemeToggleButton({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onToggle}
      className="theme-toggle"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </Button>
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const contextValue = useMemo(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="theme-canvas min-h-screen transition-colors">
          {children}
          <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
