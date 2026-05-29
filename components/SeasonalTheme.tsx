"use client";

import { useState, useEffect, useMemo, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";


// ── Season / Event Definitions ──

interface SeasonalEvent {
  name: string;
  emoji: string;
  banner: string;
  colors: { primary: string; secondary: string };
  check: (month: number, day: number) => boolean;
}

const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    name: "Halloween",
    emoji: "\uD83C\uDF83",
    banner: "Spooky Learning",
    colors: { primary: "#f97316", secondary: "#a855f7" },
    check: (m, d) => (m === 10 && d >= 15) || (m === 11 && d <= 1),
  },
  {
    name: "Winter Holiday",
    emoji: "\uD83C\uDF84",
    banner: "Holiday Learning",
    colors: { primary: "#3b82f6", secondary: "#eab308" },
    check: (m, d) => (m === 12 && d >= 15) || (m === 1 && d <= 5),
  },
  {
    name: "Spring",
    emoji: "\uD83C\uDF38",
    banner: "Spring into Learning",
    colors: { primary: "#ec4899", secondary: "#22c55e" },
    check: (m, d) => m === 3 && d >= 20 || m === 4 && d <= 20,
  },
  {
    name: "Summer",
    emoji: "\u2600\uFE0F",
    banner: "Summer Brain",
    colors: { primary: "#f59e0b", secondary: "#f97316" },
    check: (m, d) => (m === 6 && d >= 15) || m === 7 || (m === 8 && d <= 31),
  },
  {
    name: "Back to School",
    emoji: "\uD83C\uDF93",
    banner: "Back to School",
    colors: { primary: "#3b82f6", secondary: "#10b981" },
    check: (m, d) => (m === 8 && d >= 25) || (m === 9 && d <= 15),
  },
];

// ── Hook Return Type ──

export interface SeasonalThemeData {
  active: boolean;
  name: string;
  emoji: string;
  colors: { primary: string; secondary: string };
  xpBonus: number;
}

// ── Context ──

const SeasonalThemeContext = createContext<SeasonalThemeData>({
  active: false,
  name: "",
  emoji: "",
  colors: { primary: "", secondary: "" },
  xpBonus: 1,
});

export function useSeasonalTheme(): SeasonalThemeData {
  return useContext(SeasonalThemeContext);
}

// ── Detect Current Event ──

function detectEvent(): SeasonalEvent | null {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return SEASONAL_EVENTS.find((e) => e.check(month, day)) ?? null;
}

// ── Banner Component ──

function SeasonalBanner({
  event,
  onDismiss,
}: {
  event: SeasonalEvent;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative overflow-hidden"
      >
        <div
          className="relative flex items-center justify-center gap-3 px-4 py-2.5 text-sm border-b"
          style={{
            background: `linear-gradient(135deg, ${event.colors.primary}12, ${event.colors.secondary}10)`,
            borderColor: `${event.colors.primary}30`,
          }}
        >
          {/* Subtle gradient accent line at top */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${event.colors.primary}60, ${event.colors.secondary}60, transparent)`,
            }}
          />

          <span className="text-base">{event.emoji}</span>

          <span
            className="font-medium tracking-wide"
            style={{
              background: `linear-gradient(135deg, ${event.colors.primary}, ${event.colors.secondary})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {event.banner}
          </span>

          <span className="text-white/40 text-xs hidden sm:inline">
            &mdash;
          </span>

          <span className="text-white/50 text-xs hidden sm:inline">
            2x XP this weekend!
          </span>

          <button
            onClick={onDismiss}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1"
            aria-label="Dismiss seasonal banner"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 3l8 8M11 3l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main Component ──

export default function SeasonalTheme({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const event = useMemo(() => detectEvent(), []);

  useEffect(() => {
    setMounted(true);
    // Respect global seasonal off setting
    if (localStorage.getItem("tmi10_seasonal_off") === "true") {
      setDismissed(true);
      return;
    }
    if (event) {
      const stored = sessionStorage.getItem(
        `seasonal-dismissed-${event.name}`
      );
      if (stored === "true") {
        setDismissed(true);
      }
    }
  }, [event]);

  const handleDismiss = () => {
    setDismissed(true);
    if (event) {
      sessionStorage.setItem(`seasonal-dismissed-${event.name}`, "true");
    }
  };

  const themeData: SeasonalThemeData = useMemo(
    () =>
      event
        ? {
            active: true,
            name: event.name,
            emoji: event.emoji,
            colors: event.colors,
            xpBonus: 1,
          }
        : {
            active: false,
            name: "",
            emoji: "",
            colors: { primary: "", secondary: "" },
            xpBonus: 1,
          },
    [event]
  );

  return (
    <SeasonalThemeContext.Provider value={themeData}>
      {mounted && event && !dismissed && (
        <SeasonalBanner event={event} onDismiss={handleDismiss} />
      )}
      {children}
    </SeasonalThemeContext.Provider>
  );

}
