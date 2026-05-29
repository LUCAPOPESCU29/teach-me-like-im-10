"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { hasPerk, PERK } from "@/lib/perks";

const STORAGE_KEY = "tmi10_daily_spin";
const FREEZE_KEY = "tmi10_streak_freezes";

interface SpinData {
  lastSpin: string;
  spinsToday?: number;
  history: Array<{ date: string; prize: string }>;
}

interface Prize {
  emoji: string;
  label: string;
  weight: number;
  type: "xp" | "freeze" | "nothing";
  amount?: number;
}

const PRIZES: Prize[] = [
  { emoji: "\uD83C\uDFAF", label: "+25 XP", weight: 30, type: "xp", amount: 25 },
  { emoji: "\u2744\uFE0F", label: "Streak Freeze", weight: 10, type: "freeze" },
  { emoji: "\u2B50", label: "+50 XP", weight: 15, type: "xp", amount: 50 },
  { emoji: "\uD83D\uDCA8", label: "Nothing", weight: 20, type: "nothing" },
  { emoji: "\uD83C\uDFAF", label: "+15 XP", weight: 20, type: "xp", amount: 15 },
  { emoji: "\uD83D\uDD25", label: "+100 XP", weight: 5, type: "xp", amount: 100 },
];

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function loadSpinData(): SpinData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SpinData;
  } catch {
    return null;
  }
}

function saveSpinData(d: SpinData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

function getConsecutiveSpins(history: Array<{ date: string }>): number {
  if (history.length === 0) return 0;
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    prev.setDate(prev.getDate() - 1);
    if (prev.toISOString().split("T")[0] === curr.toISOString().split("T")[0]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function pickWeightedPrize(): number {
  const totalWeight = PRIZES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < PRIZES.length; i++) {
    r -= PRIZES[i].weight;
    if (r <= 0) return i;
  }
  return 0;
}

function getGlowColor(prize: Prize): string {
  if (prize.type === "xp") return "rgba(251, 191, 36, 0.4)";
  if (prize.type === "freeze") return "rgba(96, 165, 250, 0.4)";
  return "rgba(255, 255, 255, 0.05)";
}

function getBorderColor(prize: Prize): string {
  if (prize.type === "xp") return "rgba(251, 191, 36, 0.5)";
  if (prize.type === "freeze") return "rgba(96, 165, 250, 0.5)";
  return "rgba(255, 255, 255, 0.1)";
}

export default function DailySpinWheel() {
  const { data } = useAuth();
  const [alreadySpun, setAlreadySpun] = useState(false);
  const [todayPrize, setTodayPrize] = useState<Prize | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const shuffleInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [shuffleDisplay, setShuffleDisplay] = useState<number[]>([0, 1, 2, 3, 4, 5]);

  useEffect(() => {
    const saved = loadSpinData();
    if (!saved) {
      setStreak(0);
      return;
    }
    const consecutiveStreak = getConsecutiveSpins(saved.history);
    setStreak(consecutiveStreak);

    if (saved.lastSpin === getToday()) {
      const maxSpins = hasPerk(PERK.LUCKY_SPINNER) ? 2 : 1;
      const usedSpins = saved.spinsToday ?? 1;
      if (usedSpins >= maxSpins) {
        setAlreadySpun(true);
      }
      const todayEntry = saved.history.find((h) => h.date === getToday());
      if (todayEntry) {
        const found = PRIZES.find((p) => p.label === todayEntry.prize);
        if (found) {
          setTodayPrize(found);
          setWinnerIndex(PRIZES.indexOf(found));
          setShowResult(true);
        }
      }
    }
  }, []);

  const handleSpin = useCallback(async () => {
    if (spinning || alreadySpun) return;
    setSpinning(true);
    setShowResult(false);
    setWinnerIndex(null);

    // Start rapid shuffle
    shuffleInterval.current = setInterval(() => {
      setShuffleDisplay(() => {
        const arr = [0, 1, 2, 3, 4, 5];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      });
    }, 80);

    const winner = pickWeightedPrize();

    // After 2 seconds, stop and reveal
    setTimeout(async () => {
      if (shuffleInterval.current) clearInterval(shuffleInterval.current);
      setShuffleDisplay([0, 1, 2, 3, 4, 5]);
      setWinnerIndex(winner);
      setSpinning(false);
      setShowResult(true);
      setAlreadySpun(true);

      const prize = PRIZES[winner];
      setTodayPrize(prize);

      // Save to localStorage
      const saved = loadSpinData();
      const history = saved?.history ?? [];
      history.push({ date: getToday(), prize: prize.label });
      const prevSpins = (saved?.lastSpin === getToday()) ? (saved?.spinsToday ?? 1) : 0;
      const newSpins = prevSpins + 1;
      const maxSpins = hasPerk(PERK.LUCKY_SPINNER) ? 2 : 1;
      saveSpinData({ lastSpin: getToday(), spinsToday: newSpins, history });

      // Update streak
      setStreak(getConsecutiveSpins(history));

      // Check if more spins available
      if (newSpins >= maxSpins) {
        setAlreadySpun(true);
      } else {
        // Allow another spin after short delay
        setTimeout(() => {
          setAlreadySpun(false);
          setShowResult(false);
          setWinnerIndex(null);
          setTodayPrize(null);
        }, 2500);
      }

      // Apply prize
      if (prize.type === "xp" && prize.amount) {
        try {
          await data.addXP(prize.amount, "daily_spin");
        } catch {
          // silent
        }
      } else if (prize.type === "freeze") {
        try {
          const raw = localStorage.getItem(FREEZE_KEY);
          const count = raw ? parseInt(raw, 10) : 0;
          localStorage.setItem(FREEZE_KEY, String(count + 1));
        } catch {
          // silent
        }
      }
    }, 2000);
  }, [spinning, alreadySpun, data]);

  useEffect(() => {
    return () => {
      if (shuffleInterval.current) clearInterval(shuffleInterval.current);
    };
  }, []);

  return (
    <div className="w-full max-w-xl mt-6">
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white/70 text-sm font-sans font-semibold flex items-center gap-2">
              <span className="text-base">{"\uD83C\uDFB0"}</span> Daily Spin
            </h3>
            {streak > 0 && (
              <p className="text-white/25 text-[11px] font-sans mt-0.5">
                {streak}-day spin streak
              </p>
            )}
          </div>
          {alreadySpun && !spinning && (
            <span className="text-white/20 text-[11px] font-sans">
              Come back tomorrow
            </span>
          )}
        </div>

        {/* Cards row */}
        <div className="relative">
          <div className="grid grid-cols-6 gap-1.5">
            {shuffleDisplay.map((prizeIdx, slotIdx) => {
              const prize = PRIZES[prizeIdx];
              const isWinner = showResult && prizeIdx === winnerIndex;
              const isDimmed = showResult && prizeIdx !== winnerIndex;

              return (
                <motion.div
                  key={`slot-${slotIdx}`}
                  className="relative flex flex-col items-center justify-center rounded-xl border p-2 min-h-[72px] transition-all duration-300"
                  style={{
                    background: isWinner
                      ? `linear-gradient(135deg, ${getGlowColor(prize)}, transparent)`
                      : "rgba(255,255,255,0.03)",
                    borderColor: isWinner
                      ? getBorderColor(prize)
                      : "rgba(255,255,255,0.06)",
                    opacity: isDimmed ? 0.3 : 1,
                    filter: spinning ? "blur(2px)" : "none",
                  }}
                  animate={
                    isWinner
                      ? { scale: [1, 1.15, 1.08], transition: { duration: 0.4, ease: "easeOut" } }
                      : { scale: 1 }
                  }
                >
                  {isWinner && (
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      style={{
                        boxShadow: `0 0 20px ${getGlowColor(prize)}, 0 0 40px ${getGlowColor(prize)}`,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0.6] }}
                      transition={{ duration: 0.6 }}
                    />
                  )}
                  <span className="text-lg relative z-10">{prize.emoji}</span>
                  <span className="text-[9px] font-sans text-white/50 mt-1 relative z-10 text-center leading-tight">
                    {prize.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Spin button or result */}
        <AnimatePresence mode="wait">
          {!alreadySpun && !spinning && (
            <motion.button
              key="spin-btn"
              onClick={handleSpin}
              className="w-full mt-4 py-2.5 rounded-xl font-sans text-sm font-semibold text-black transition-all"
              style={{ background: "var(--accent)" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Spin!
            </motion.button>
          )}

          {spinning && (
            <motion.div
              key="spinning"
              className="w-full mt-4 py-2.5 text-center text-white/30 text-sm font-sans"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              >
                Spinning...
              </motion.span>
            </motion.div>
          )}

          {showResult && todayPrize && !spinning && (
            <motion.div
              key="result"
              className="mt-4 py-2.5 text-center rounded-xl"
              style={{
                background:
                  todayPrize.type === "nothing"
                    ? "rgba(255,255,255,0.03)"
                    : todayPrize.type === "freeze"
                    ? "rgba(96, 165, 250, 0.08)"
                    : "rgba(251, 191, 36, 0.08)",
                border:
                  todayPrize.type === "nothing"
                    ? "1px solid rgba(255,255,255,0.06)"
                    : todayPrize.type === "freeze"
                    ? "1px solid rgba(96, 165, 250, 0.2)"
                    : "1px solid rgba(251, 191, 36, 0.2)",
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {todayPrize.type === "nothing" ? (
                <span className="text-white/40 text-sm font-sans">
                  {"\uD83D\uDCA8"} Better luck tomorrow!
                </span>
              ) : todayPrize.type === "freeze" ? (
                <span className="text-blue-400 text-sm font-sans font-medium">
                  {"\u2744\uFE0F"} Streak Freeze earned! Use it to protect your streak.
                </span>
              ) : (
                <span className="text-amber-400 text-sm font-sans font-medium">
                  {todayPrize.emoji} {todayPrize.label} added!
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
