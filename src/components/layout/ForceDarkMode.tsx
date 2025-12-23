import { useEffect } from 'react';

export function ForceDarkMode({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Force dark mode by adding the dark class to the html element
    const root = window.document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');

    // Cleanup function to avoid interfering when navigating to dashboard
    return () => {
      // We don't remove the dark class here because the dashboard's
      // ThemeProvider will handle it if needed
    };
  }, []);

  return <>{children}</>;
}
