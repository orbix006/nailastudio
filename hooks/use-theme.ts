import { useContext } from 'react';
import { ThemeContext } from '@/components/ui/ThemeProvider';

/**
 * Reusable hook to fetch the active theme state and toggler functions from ThemeProvider.
 * `isMounted` is false during SSR and the initial client render, true after hydration.
 * Use it to guard any theme-dependent UI that differs between server and client.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
