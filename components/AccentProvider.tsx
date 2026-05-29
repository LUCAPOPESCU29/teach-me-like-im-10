"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const STORAGE_KEY = "tmi10_accent_color";
const DEFAULT_COLOR = "#34d399";

interface AccentContextValue {
  color: string;
  setColor: (c: string) => void;
}

const AccentContext = createContext<AccentContextValue>({
  color: DEFAULT_COLOR,
  setColor: () => {},
});

export function useAccent() {
  return useContext(AccentContext);
}

export default function AccentProvider({ children }: { children: ReactNode }) {
  const [color, setColorState] = useState(DEFAULT_COLOR);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setColorState(saved);
      document.documentElement.style.setProperty("--accent", saved);
    }
  }, []);

  const setColor = (c: string) => {
    setColorState(c);
    localStorage.setItem(STORAGE_KEY, c);
    document.documentElement.style.setProperty("--accent", c);
  };

  return (
    <AccentContext.Provider value={{ color, setColor }}>
      {children}
    </AccentContext.Provider>
  );
}
