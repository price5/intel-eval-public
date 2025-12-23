import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="dashboard-theme">
      {children}
    </ThemeProvider>
  );
}
