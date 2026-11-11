"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Theme = "dark" | "light";

// Old builds wrote the automatic theme to "theme". A separate key lets
// existing visitors re-enter time-based mode once; only explicit toggles
// are stored here.
const STORAGE_KEY = "theme-manual";
const DAY_START = 7;
const DAY_END = 18;

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
  set: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore storage errors
  }
  return null;
}

function getTimeTheme(): Theme {
  const hour = new Date().getHours();
  return hour >= DAY_START && hour < DAY_END ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Light is the SSR/default theme. The inline script in <head> applies the
  // time or stored theme before first paint, so this never flashes white.
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);
  const manualRef = useRef(false);

  useEffect(() => {
    const stored = getStoredTheme();
    manualRef.current = stored !== null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(stored ?? getTimeTheme());
    setReady(true);
  }, []);

  useEffect(() => {
    // The inline <head> script already applied the correct class. Do not
    // toggle it again until the stored/time theme has been read.
    if (!ready) return;
    document.documentElement.classList.toggle("light", theme === "light");
  }, [ready, theme]);

  // Without a manual choice, follow the clock across the 07:00 / 18:00
  // boundaries without requiring a reload.
  useEffect(() => {
    const tick = () => {
      if (!manualRef.current) setTheme(getTimeTheme());
    };
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const toggle = useCallback(() => {
    manualRef.current = true;
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const set = useCallback((t: Theme) => {
    manualRef.current = true;
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // ignore storage errors
    }
    setTheme(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle, set }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
