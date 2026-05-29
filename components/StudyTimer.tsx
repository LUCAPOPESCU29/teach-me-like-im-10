"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { useCelebration } from "@/components/CelebrationProvider";

/* ─── Types ─── */
type TimerState = "idle" | "focus" | "break" | "paused";
type ViewMode = "full" | "minimized";

interface StudyStats {
  totalMinutes: number;
  sessions: number;
  lastDate: string;
}

const STORAGE_KEY = "tmi10_study_stats";
const SESSION_DURATIONS = [15, 25, 45] as const;
const BREAK_DURATION = 5;
const TOTAL_SESSIONS = 4;

const QUOTES = [
  "The expert in anything was once a beginner.",
  "Small steps every day lead to big results.",
  "Curiosity is the engine of achievement.",
  "Learning is a treasure that follows its owner everywhere.",
  "The beautiful thing about learning is nobody can take it from you.",
  "Every expert was once a beginner.",
  "Your brain is a muscle. Train it daily.",
  "Knowledge is power. Keep going!",
  "One topic at a time, one level at a time.",
  "Consistency beats intensity every time.",
];

/* ─── Helpers ─── */
function getStats(): StudyStats {
  if (typeof window === "undefined") return { totalMinutes: 0, sessions: 0, lastDate: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { totalMinutes: 0, sessions: 0, lastDate: "" };
  } catch {
    return { totalMinutes: 0, sessions: 0, lastDate: "" };
  }
}

function saveStats(stats: StudyStats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {}
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function getRandomQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

/* ─── Circular Progress Ring ─── */
function ProgressRing({
  progress,
  size = 200,
  strokeWidth = 6,
  isFocus,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  isFocus: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={isFocus ? "#4ade80" : "#60a5fa"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-linear"
        style={{ filter: `drop-shadow(0 0 6px ${isFocus ? "rgba(74,222,128,0.3)" : "rgba(96,165,250,0.3)"})` }}
      />
    </svg>
  );
}

/* ─── Main Component ─── */
export default function StudyTimer({
  defaultView = "full",
  onClose,
}: {
  defaultView?: ViewMode;
  onClose?: () => void;
}) {
  const { data } = useAuth();
  const { playSound, celebrate } = useCelebration();

  // Timer state
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [focusDuration, setFocusDuration] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [currentSession, setCurrentSession] = useState(1);
  const [quote, setQuote] = useState(getRandomQuote);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedStateRef = useRef<"focus" | "break">("focus");

  // Total duration for current phase (in seconds)
  const totalDuration =
    timerState === "break" || (timerState === "paused" && pausedStateRef.current === "break")
      ? BREAK_DURATION * 60
      : focusDuration * 60;
  const progress = 1 - secondsLeft / totalDuration;

  const isFocus = timerState === "focus" || (timerState === "paused" && pausedStateRef.current === "focus");

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const completeSession = useCallback(async () => {
    // Award XP
    try {
      await data.addXP(25, "study_session");
      celebrate({ xp: 25, confetti: true, sound: "complete" });
    } catch {}

    // Update stats
    const stats = getStats();
    const today = new Date().toISOString().slice(0, 10);
    stats.totalMinutes += focusDuration;
    stats.sessions += 1;
    stats.lastDate = today;
    saveStats(stats);

    // Move to break or finish
    if (currentSession < TOTAL_SESSIONS) {
      setTimerState("break");
      setSecondsLeft(BREAK_DURATION * 60);
      setQuote(getRandomQuote());
    } else {
      // All sessions done
      setTimerState("idle");
      setCurrentSession(1);
      setSecondsLeft(focusDuration * 60);
      playSound("levelUp");
    }
  }, [data, celebrate, playSound, focusDuration, currentSession]);

  const completeBreak = useCallback(() => {
    playSound("chime");
    setCurrentSession((s) => s + 1);
    setTimerState("focus");
    setSecondsLeft(focusDuration * 60);
    setQuote(getRandomQuote());
  }, [playSound, focusDuration]);

  // Tick
  useEffect(() => {
    if (timerState === "focus" || timerState === "break") {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            if (timerState === "focus") {
              completeSession();
            } else {
              completeBreak();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState, completeSession, completeBreak]);

  function handleStart() {
    playSound("pop");
    setTimerState("focus");
    setSecondsLeft(focusDuration * 60);
    setCurrentSession(1);
    setQuote(getRandomQuote());
  }

  function handlePause() {
    playSound("pop");
    pausedStateRef.current = timerState === "focus" ? "focus" : "break";
    setTimerState("paused");
  }

  function handleResume() {
    playSound("pop");
    setTimerState(pausedStateRef.current);
  }

  function handleReset() {
    playSound("whoosh");
    setTimerState("idle");
    setSecondsLeft(focusDuration * 60);
    setCurrentSession(1);
  }

  /* ─── Minimized Pill ─── */
  if (viewMode === "minimized") {
    return (
      <motion.button
        onClick={() => setViewMode("full")}
        className="fixed bottom-20 sm:bottom-6 left-4 z-[60] flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a1020]/70 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20 cursor-pointer hover:border-emerald-500/20 transition-colors"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            timerState === "focus"
              ? "bg-emerald-400 animate-pulse"
              : timerState === "break"
              ? "bg-blue-400 animate-pulse"
              : timerState === "paused"
              ? "bg-amber-400"
              : "bg-white/20"
          }`}
        />
        <span className="font-mono text-xs text-white/70">{formatTime(secondsLeft)}</span>
        {timerState !== "idle" && (
          <span className="text-[10px] text-white/30 font-sans">
            {timerState === "focus" ? "Focus" : timerState === "break" ? "Break" : "Paused"}
          </span>
        )}
      </motion.button>
    );
  }

  /* ─── Full Modal ─── */
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (timerState !== "idle") {
            setViewMode("minimized");
          } else if (onClose) {
            onClose();
          }
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Modal content */}
      <motion.div
        className="relative w-full max-w-sm rounded-2xl bg-[#0a0f1e]/95 backdrop-blur-xl border border-white/10 p-6 shadow-2xl shadow-black/40"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Close / Minimize buttons */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans text-sm text-white/50 tracking-wide">
            {timerState === "idle"
              ? "Study Timer"
              : timerState === "focus"
              ? "Focus Time"
              : timerState === "break"
              ? "Break Time"
              : "Paused"}
          </h2>
          <div className="flex items-center gap-2">
            {timerState !== "idle" && (
              <button
                onClick={() => setViewMode("minimized")}
                className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-colors flex items-center justify-center"
                aria-label="Minimize"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 6h8" />
                </svg>
              </button>
            )}
            <button
              onClick={() => {
                if (timerState !== "idle") {
                  setViewMode("minimized");
                } else if (onClose) {
                  onClose();
                }
              }}
              className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 1l8 8M9 1l-8 8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Session counter */}
        {timerState !== "idle" && (
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {Array.from({ length: TOTAL_SESSIONS }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  i < currentSession
                    ? "bg-emerald-400"
                    : i === currentSession - 1
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-white/10"
                }`}
              />
            ))}
            <span className="ml-2 text-[10px] font-sans text-white/30">
              Session {currentSession} of {TOTAL_SESSIONS}
            </span>
          </div>
        )}

        {/* Timer ring + digits */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            <ProgressRing
              progress={timerState === "idle" ? 0 : progress}
              size={200}
              strokeWidth={6}
              isFocus={isFocus}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-4xl text-white/90 tabular-nums">
                {formatTime(secondsLeft)}
              </span>
              <span className="font-sans text-[10px] text-white/25 mt-1 tracking-wider uppercase">
                {timerState === "idle"
                  ? "Ready"
                  : timerState === "focus"
                  ? "Focusing"
                  : timerState === "break"
                  ? "Resting"
                  : "Paused"}
              </span>
            </div>
          </div>
        </div>

        {/* Duration picker (only when idle) */}
        <AnimatePresence mode="wait">
          {timerState === "idle" && (
            <motion.div
              key="duration-picker"
              className="flex items-center justify-center gap-2 mb-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {SESSION_DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setFocusDuration(d);
                    setSecondsLeft(d * 60);
                    playSound("pop");
                  }}
                  className={`px-3 py-1.5 rounded-lg border font-mono text-xs transition-all duration-200 ${
                    focusDuration === d
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-white/[0.02] border-white/[0.08] text-white/30 hover:text-white/50 hover:border-white/15"
                  }`}
                >
                  {d}m
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {timerState === "idle" && (
            <button
              onClick={handleStart}
              className="px-6 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-sans text-sm hover:bg-emerald-500/15 hover:border-emerald-500/40 transition-all"
            >
              Start Focus
            </button>
          )}
          {(timerState === "focus" || timerState === "break") && (
            <>
              <button
                onClick={handlePause}
                className="px-5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/50 font-sans text-sm hover:bg-white/[0.08] hover:text-white/70 transition-all"
              >
                Pause
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white/30 font-sans text-sm hover:bg-white/[0.06] hover:text-white/50 transition-all"
              >
                Reset
              </button>
            </>
          )}
          {timerState === "paused" && (
            <>
              <button
                onClick={handleResume}
                className="px-5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-sans text-sm hover:bg-emerald-500/15 hover:border-emerald-500/40 transition-all"
              >
                Resume
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white/30 font-sans text-sm hover:bg-white/[0.06] hover:text-white/50 transition-all"
              >
                Reset
              </button>
            </>
          )}
        </div>

        {/* Quote */}
        {timerState !== "idle" && (
          <motion.p
            key={quote}
            className="mt-5 text-center text-white/20 font-serif text-xs italic leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            &ldquo;{quote}&rdquo;
          </motion.p>
        )}

        {/* XP reward hint */}
        {timerState === "idle" && (
          <p className="mt-4 text-center text-white/15 font-sans text-[10px]">
            Earn +25 XP for each completed focus session
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── Export helpers for the study page ─── */
export { getStats, STORAGE_KEY, QUOTES, formatTime };
export type { StudyStats };
