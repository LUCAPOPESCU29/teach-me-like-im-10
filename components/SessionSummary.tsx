"use client";

import {
  useState,
  useEffect,
  useCallback,
  useSyncExternalStore,
  createContext,
  useContext,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { unslugify } from "@/lib/utils";

// ---- Types ----

interface SessionData {
  date: string;
  topicsLearned: string[];
  xpEarned: number;
  quizzesTaken: number;
  startTime: number;
}

interface SessionSummaryState {
  topicsCount: number;
  xpEarned: number;
  timeSpent: number; // minutes
}

// ---- Constants ----

const STORAGE_KEY = "tmi10_session_summary";
const STORAGE_PREFIX = "tmi10_";
const MIN_TOPICS = 2;
const MIN_MINUTES = 5;

const EXCLUDED_KEYS = new Set([
  "tmi10_xp", "tmi10_streak", "tmi10_lang", "tmi10_bookmarks", "tmi10_badges",
  "tmi10_weekly_goal", "tmi10_weekly_goal_auth", "tmi10_visited_features",
  "tmi10_accent_color", "tmi10_ghost_mode", "tmi10_font", "tmi10_text_size",
  "tmi10_animations_disabled", "tmi10_streak_reminders_off", "tmi10_goal_reminders_off",
  "tmi10_combo_hidden", "tmi10_seasonal_off", "tmi10_autoplay", "tmi10_xp_toasts_off",
  "tmi10_onboarding_done", "tmi10_study_stats", "tmi10_learning_time",
  "tmi10_combo_session", "tmi10_active_title", "tmi10_follows", "tmi10_wager_history",
  "tmi10_speedruns", "tmi10_explorations", "tmi10_wop_stats", "tmi10_xp_history",
  "tmi10_sound_muted", "tmi10_profile_custom", "tmi10_daily_reward",
  "tmi10_daily_spin", "tmi10_streak_freezes", "tmi10_session_summary",
  "tmi10_debate_history", "tmi10_notes", "tmi10_flashcards", "tmi10_journal",
  "tmi10_dna", "tmi10_compare_history",
]);

// ---- Helpers ----

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getCurrentXP(): number {
  try {
    const raw = localStorage.getItem("tmi10_xp");
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return typeof parsed === "number" ? parsed : parsed.totalXP ?? parsed.xp ?? 0;
  } catch {
    return 0;
  }
}

function getTopicKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(STORAGE_PREFIX) || EXCLUDED_KEYS.has(key)) continue;
    const afterPrefix = key.slice(STORAGE_PREFIX.length);
    const langMatch = afterPrefix.match(/^[a-z]{2}_(.+)$/);
    const slug = langMatch ? langMatch[1] : afterPrefix;
    if (slug.includes("_")) continue;
    if (slug.length < 3) continue;
    keys.push(key);
  }
  return keys;
}

function loadSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionData;
    if (parsed.date !== getToday()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(data: SessionData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function topicSlugFromKey(key: string): string {
  const afterPrefix = key.slice(STORAGE_PREFIX.length);
  const langMatch = afterPrefix.match(/^[a-z]{2}_(.+)$/);
  return langMatch ? langMatch[1] : afterPrefix;
}

// ---- External store for hook ----

let listeners: Array<() => void> = [];
let cachedState: SessionSummaryState = { topicsCount: 0, xpEarned: 0, timeSpent: 0 };

function getSnapshot(): SessionSummaryState {
  return cachedState;
}

function getServerSnapshot(): SessionSummaryState {
  return { topicsCount: 0, xpEarned: 0, timeSpent: 0 };
}

function subscribe(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notifyListeners() {
  for (const l of listeners) l();
}

function refreshState() {
  const session = loadSession();
  if (!session) {
    cachedState = { topicsCount: 0, xpEarned: 0, timeSpent: 0 };
  } else {
    const now = Date.now();
    const minutes = Math.round((now - session.startTime) / 60000);
    cachedState = {
      topicsCount: session.topicsLearned.length,
      xpEarned: session.xpEarned,
      timeSpent: minutes,
    };
  }
  notifyListeners();
}

// ---- Hook ----

export function useSessionSummary(): SessionSummaryState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ---- Component ----

export default function SessionSummary() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialTopicKeysRef = useRef<Set<string>>(new Set());
  const startXPRef = useRef<number>(0);

  // Initialize or continue session
  useEffect(() => {
    const today = getToday();
    let current = loadSession();

    if (!current) {
      const topicKeys = getTopicKeys();
      const xp = getCurrentXP();
      current = {
        date: today,
        topicsLearned: [],
        xpEarned: 0,
        quizzesTaken: 0,
        startTime: Date.now(),
      };
      initialTopicKeysRef.current = new Set(topicKeys);
      startXPRef.current = xp;
      saveSession(current);
    } else {
      // Reconstruct baseline from session data
      const allKeys = getTopicKeys();
      const learnedSet = new Set(current.topicsLearned);
      initialTopicKeysRef.current = new Set(
        allKeys.filter((k) => !learnedSet.has(topicSlugFromKey(k)))
      );
      startXPRef.current = getCurrentXP() - current.xpEarned;
    }

    setSession(current);
    refreshState();
  }, []);

  // Poll for changes every 5 seconds
  useEffect(() => {
    function checkForUpdates() {
      const current = loadSession();
      if (!current) return;

      let changed = false;

      // Check for new topics
      const currentKeys = getTopicKeys();
      for (const key of currentKeys) {
        const slug = topicSlugFromKey(key);
        if (
          !initialTopicKeysRef.current.has(key) &&
          !current.topicsLearned.includes(slug)
        ) {
          // Validate it's actually topic data (array with level/content)
          try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed) || parsed.length === 0) continue;
            if (typeof parsed[0].level !== "number" || typeof parsed[0].content !== "string") continue;
          } catch {
            continue;
          }
          current.topicsLearned.push(slug);
          changed = true;
        }
      }

      // Check XP changes
      const nowXP = getCurrentXP();
      const xpDiff = Math.max(nowXP - startXPRef.current, 0);
      if (xpDiff !== current.xpEarned) {
        current.xpEarned = xpDiff;
        changed = true;
      }

      if (changed) {
        saveSession(current);
        setSession({ ...current });
        refreshState();
      }

      // Check visibility conditions
      const minutes = (Date.now() - current.startTime) / 60000;
      if (current.topicsLearned.length >= MIN_TOPICS && minutes >= MIN_MINUTES) {
        setVisible(true);
      }
    }

    checkForUpdates();
    intervalRef.current = setInterval(checkForUpdates, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Listen for storage events from other tabs
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (!e.key) return;
      // If a new topic key was added or XP changed, trigger recheck
      if (
        (e.key.startsWith(STORAGE_PREFIX) && !EXCLUDED_KEYS.has(e.key)) ||
        e.key === "tmi10_xp"
      ) {
        refreshState();
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleShare = useCallback(async () => {
    if (!session) return;

    const minutes = Math.round((Date.now() - session.startTime) / 60000);
    const topicsList = session.topicsLearned
      .map((s) => unslugify(s))
      .join(", ");
    const text = `I learned ${session.topicsLearned.length} topics on Teach Me Like I'm 10 today! (+${session.xpEarned} XP in ${minutes}min)\n\nTopics: ${topicsList}`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  }, [session]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  if (!session || !visible || dismissed) return null;

  const minutes = Math.round((Date.now() - session.startTime) / 60000);

  return (
    <div className="w-full max-w-xl mt-6">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] p-5"
        >
          {/* Subtle emerald glow */}
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-[50px] opacity-15 pointer-events-none bg-emerald-500" />

          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">📊</span>
            <span className="text-white/60 text-xs font-sans font-semibold uppercase tracking-wider">
              Today&apos;s Learning
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-emerald-400/90 text-sm font-sans font-semibold">
              {session.topicsLearned.length} topic{session.topicsLearned.length !== 1 ? "s" : ""}
            </span>
            <span className="text-white/15">·</span>
            <span className="text-emerald-400/90 text-sm font-sans font-semibold">
              +{session.xpEarned} XP
            </span>
            <span className="text-white/15">·</span>
            <span className="text-emerald-400/90 text-sm font-sans font-semibold">
              {minutes}min
            </span>
          </div>

          {/* Topic list */}
          <div className="space-y-1.5 mb-4">
            {session.topicsLearned.map((slug) => (
              <div key={slug} className="flex items-center gap-2">
                <span className="text-emerald-400/70 text-xs">&#10003;</span>
                <span className="text-white/50 text-sm font-sans">
                  {unslugify(slug)}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleShare}
              className="px-4 py-2 rounded-xl text-xs font-sans font-medium border transition-all"
              style={{
                backgroundColor: "rgba(52, 211, 153, 0.08)",
                borderColor: "rgba(52, 211, 153, 0.15)",
                color: "rgba(52, 211, 153, 0.9)",
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {copied ? "Copied!" : "Share Summary"}
            </motion.button>
            <motion.button
              onClick={handleDismiss}
              className="px-4 py-2 rounded-xl text-xs font-sans font-medium text-white/30 hover:text-white/50 border border-white/[0.06] hover:border-white/[0.1] transition-all"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Dismiss
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
