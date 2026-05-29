"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "tmi10_visited_features";

const ALL_FEATURES = [
  "/battle", "/speedrun", "/wrong-on-purpose", "/explore", "/dna",
  "/leaderboard", "/playground", "/debate", "/time-machine", "/journal",
  "/titles", "/flashcards", "/library", "/notes", "/study", "/friends",
  "/study-room", "/settings", "/progress", "/math", "/paths", "/compare", "/how-it-works",
  "/shop", "/blackjack", "/pro", "/math", "/code",
];

interface NewBadgeContextValue {
  isNew: (path: string) => boolean;
  markVisited: (path: string) => void;
}

const NewBadgeContext = createContext<NewBadgeContextValue>({
  isNew: () => false,
  markVisited: () => {},
});

export function useNewBadge() {
  return useContext(NewBadgeContext);
}

export function NewBadgeProvider({ children }: { children: ReactNode }) {
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const pathname = usePathname();

  // Load visited features from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setVisited(new Set(JSON.parse(stored)));
      }
    } catch { /* */ }
    setLoaded(true);
  }, []);

  // Auto-mark current path as visited
  useEffect(() => {
    if (!loaded) return;
    const match = ALL_FEATURES.find((f) => pathname === f || pathname.startsWith(f + "/"));
    if (match && !visited.has(match)) {
      setVisited((prev) => {
        const next = new Set(prev);
        next.add(match);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
        return next;
      });
    }
  }, [pathname, loaded, visited]);

  const isNew = useCallback(
    (path: string) => {
      if (!loaded) return false;
      return ALL_FEATURES.includes(path) && !visited.has(path);
    },
    [visited, loaded]
  );

  const markVisited = useCallback(
    (path: string) => {
      setVisited((prev) => {
        const next = new Set(prev);
        next.add(path);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
        return next;
      });
    },
    []
  );

  return (
    <NewBadgeContext.Provider value={{ isNew, markVisited }}>
      {children}
    </NewBadgeContext.Provider>
  );
}

export function NewDot({ path, size = "md" }: { path: string; size?: "sm" | "md" }) {
  const { isNew } = useNewBadge();

  if (!isNew(path)) return null;

  const px = size === "sm" ? 5 : 7;

  return (
    <span
      className="absolute -top-0.5 -right-0.5 z-10 rounded-full animate-pulse"
      style={{
        width: px,
        height: px,
        backgroundColor: "var(--accent, #34d399)",
        boxShadow: `0 0 6px var(--accent, #34d399)`,
      }}
    />
  );
}
