'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type ThemeType = 'woodnest' | 'ocean' | 'forest' | 'amethyst' | 'crimson' | 'dune' | 'frost' | 'cyber';

export const THEMES: { id: ThemeType; name: string; base: string; accent: string }[] = [
  { id: 'woodnest', name: 'WoodNest Default', base: '#070f12', accent: '#ffb780' },
  { id: 'ocean', name: 'Ocean Deep', base: '#050b14', accent: '#60a5fa' },
  { id: 'forest', name: 'Forest Canopy', base: '#06120b', accent: '#4ade80' },
  { id: 'amethyst', name: 'Royal Amethyst', base: '#0f0712', accent: '#d8b4fe' },
  { id: 'crimson', name: 'Crimson Night', base: '#120707', accent: '#fca5a5' },
  { id: 'dune', name: 'Golden Dune', base: '#141005', accent: '#fde047' },
  { id: 'frost', name: 'Silver Frost', base: '#0f1115', accent: '#e2e8f0' },
  { id: 'cyber', name: 'Neon Cyber', base: '#050512', accent: '#2dd4bf' }
];

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, initialTheme = 'woodnest' }: { children: ReactNode, initialTheme?: ThemeType }) {
  const [theme, setThemeState] = useState<ThemeType>(initialTheme);

  // Fallback sync if client load differs from server (rare)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleSetTheme = async (newTheme: ThemeType) => {
    // Optimistic UI update
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);

    // Save to database
    try {
      await fetch('/api/settings/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme })
      });
    } catch (error) {
      console.error('Failed to save theme to DB:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
