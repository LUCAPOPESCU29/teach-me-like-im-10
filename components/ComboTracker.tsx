"use client";

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Types & constants                                                  */
/* ------------------------------------------------------------------ */

interface ComboSession {
  topics: string[];
  startTime: number;
  lastActivity: number;
}

interface ComboContextValue {
  comboCount: number;
  multiplier: number;
  addTopic: (topic: string) => void;
}

const STORAGE_KEY = "tmi10_combo_session";
const TWO_HOURS = 2 * 60 * 60 * 1000;

function getMultiplier(count: number): number {
  if (count >= 5) return 2;
  if (count === 4) return 1.8;
  if (count === 3) return 1.5;
  if (count === 2) return 1.2;
  return 1;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ComboContext = createContext<ComboContextValue>({
  comboCount: 0,
  multiplier: 1,
  addTopic: () => {},
});

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function ComboProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ComboSession | null>(null);

  // Hydrate from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: ComboSession = JSON.parse(raw);
        const now = Date.now();
        // Expire if last activity was more than 2 hours ago
        if (now - parsed.lastActivity > TWO_HOURS) {
          localStorage.removeItem(STORAGE_KEY);
        } else {
          setSession(parsed);
        }
      }
    } catch {
      // Ignore corrupt data
    }
  }, []);

  // Persist to localStorage whenever session changes
  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }, [session]);

  // Check for expiry every 60 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setSession((prev) => {
        if (!prev) return null;
        if (Date.now() - prev.lastActivity > TWO_HOURS) {
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }
        return prev;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const addTopic = useCallback((topic: string) => {
    setSession((prev) => {
      const now = Date.now();

      // If no session or expired, start fresh
      if (!prev || now - prev.lastActivity > TWO_HOURS) {
        return { topics: [topic], startTime: now, lastActivity: now };
      }

      // Don't double-count the same topic
      if (prev.topics.includes(topic)) {
        return { ...prev, lastActivity: now };
      }

      return {
        ...prev,
        topics: [...prev.topics, topic],
        lastActivity: now,
      };
    });
  }, []);

  const comboCount = session?.topics.length ?? 0;
  const multiplier = getMultiplier(comboCount);

  return (
    <ComboContext.Provider value={{ comboCount, multiplier, addTopic }}>
      {children}
    </ComboContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useCombo() {
  return useContext(ComboContext);
}

/* ------------------------------------------------------------------ */
/*  Indicator (floating pill)                                          */
/* ------------------------------------------------------------------ */

export function ComboIndicator() {
  const { comboCount, multiplier } = useCombo();
  const [prevCount, setPrevCount] = useState(comboCount);
  const [pulse, setPulse] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(localStorage.getItem("tmi10_combo_hidden") === "true");
  }, []);

  if (hidden) return null;

  // Detect combo increase to trigger pulse
  useEffect(() => {
    if (comboCount > prevCount && comboCount >= 2) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 800);
      return () => clearTimeout(t);
    }
    setPrevCount(comboCount);
  }, [comboCount, prevCount]);

  // Update prevCount after pulse
  useEffect(() => {
    setPrevCount(comboCount);
  }, [comboCount]);

  return (
    <AnimatePresence>
      {comboCount >= 2 && (
        <motion.div
          key="combo-indicator"
          initial={{ opacity: 0, y: -20, scale: 0.85 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: pulse ? [1, 1.12, 1] : 1,
          }}
          exit={{ opacity: 0, y: -20, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed top-4 right-4 z-[70]"
        >
          <div
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl font-sans text-sm font-medium
              bg-[#0a1020]/80 backdrop-blur-xl
              border border-white/[0.06]
              shadow-lg shadow-black/30
              select-none
              transition-shadow duration-500
              ${pulse ? "shadow-emerald-500/20 border-emerald-500/30" : ""}
            `}
          >
            {/* Fire icon */}
            <span className="text-base">🔥</span>

            {/* Combo count */}
            <span className="text-white/90">
              {comboCount}x Combo
            </span>

            {/* Separator dot */}
            <motion.div
              className="w-1 h-1 rounded-full bg-emerald-400"
              animate={{
                scale: [0.8, 1.3, 0.8],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Multiplier */}
            <span className="text-emerald-400">
              {multiplier}x XP
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
