"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { hasPerk, PERK } from "@/lib/perks";

const STORAGE_KEY = "tmi10_daily_reward";
const BASE_XP = 10;
const STREAK_BONUS_PER_DAY = 2;
const MAX_STREAK_BONUS = 20;
const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

interface RewardData {
  lastClaimed: string;
  streak: number;
  totalClaimed: number;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function getDayOfWeek(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function loadRewardData(): RewardData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RewardData;
  } catch {
    return null;
  }
}

function saveRewardData(data: RewardData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function DailyLoginReward() {
  const { data } = useAuth();
  const [visible, setVisible] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [streak, setStreak] = useState(1);
  const [xpAmount, setXpAmount] = useState(BASE_XP);

  useEffect(() => {
    const today = getToday();
    const saved = loadRewardData();

    if (saved && saved.lastClaimed === today) return;

    let newStreak = 1;
    if (saved && saved.lastClaimed === getYesterday()) {
      newStreak = saved.streak + 1;
    }

    const bonus = Math.min(newStreak * STREAK_BONUS_PER_DAY, MAX_STREAK_BONUS);
    let total = BASE_XP + bonus;
    if (hasPerk(PERK.VIP_DAILY)) total *= 2;
    setStreak(newStreak);
    setXpAmount(total);
    setVisible(true);
  }, []);

  const handleClaim = useCallback(async () => {
    if (claimed) return;
    setClaimed(true);

    try {
      await data.addXP(xpAmount);
    } catch {
      // silent
    }

    const today = getToday();
    const saved = loadRewardData();
    const totalClaimed = (saved?.totalClaimed ?? 0) + 1;
    saveRewardData({ lastClaimed: today, streak, totalClaimed });

    setTimeout(() => setVisible(false), 2500);
  }, [claimed, data, xpAmount, streak]);

  if (!visible) return null;

  const todayIdx = getDayOfWeek();
  const streakCapped = Math.min(streak, 7);
  const hasStreak = streak > 1;

  return (
    <div className="w-full max-w-xl mt-5">
      <AnimatePresence>
        {!claimed ? (
          <motion.div
            key="unclaimed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ ease: [0.32, 0.72, 0, 1] }}
            className="relative overflow-hidden rounded-2xl"
            style={{
              background: hasStreak
                ? "linear-gradient(135deg, rgba(251,191,36,0.07) 0%, rgba(249,115,22,0.04) 100%)"
                : "linear-gradient(135deg, rgba(52,211,153,0.06) 0%, rgba(16,185,129,0.03) 100%)",
              border: hasStreak
                ? "1px solid rgba(251,191,36,0.16)"
                : "1px solid rgba(52,211,153,0.14)",
            }}
          >
            {/* Animated background pulse */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: hasStreak
                  ? "radial-gradient(ellipse at 90% 50%, rgba(251,191,36,0.1) 0%, transparent 60%)"
                  : "radial-gradient(ellipse at 90% 50%, rgba(52,211,153,0.08) 0%, transparent 60%)",
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative flex items-stretch gap-0">
              {/* Left — info panel */}
              <div className="flex-1 p-4">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: hasStreak ? "#fbbf24" : "#34d399",
                      boxShadow: hasStreak
                        ? "0 0 7px rgba(251,191,36,0.9)"
                        : "0 0 7px rgba(52,211,153,0.9)",
                    }}
                  />
                  <span
                    className="text-[10px] font-sans font-semibold tracking-[0.16em] uppercase"
                    style={{ color: hasStreak ? "rgba(251,191,36,0.65)" : "rgba(52,211,153,0.65)" }}
                  >
                    Daily Bonus
                  </span>
                  {hasStreak && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(249,115,22,0.12)",
                        border: "1px solid rgba(249,115,22,0.25)",
                      }}
                    >
                      <span className="text-[9px]">🔥</span>
                      <span className="text-[10px] font-sans font-semibold" style={{ color: "rgba(249,115,22,0.85)" }}>
                        {streak}-day streak
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Week day pills */}
                <div className="flex gap-1.5 mb-3">
                  {WEEK_DAYS.map((label, i) => {
                    const isToday = i === todayIdx;
                    const inStreak = i > todayIdx - streakCapped && i < todayIdx;
                    const isFuture = i > todayIdx;

                    return (
                      <motion.div
                        key={i}
                        className="flex flex-col items-center gap-1"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.04 }}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-sans font-semibold relative"
                          style={{
                            background: isToday
                              ? hasStreak
                                ? "linear-gradient(135deg, #fbbf24, #f97316)"
                                : "linear-gradient(135deg, #34d399, #10b981)"
                              : inStreak
                              ? "rgba(251,191,36,0.14)"
                              : isFuture
                              ? "rgba(255,255,255,0.03)"
                              : "rgba(255,255,255,0.04)",
                            border: isToday
                              ? "none"
                              : inStreak
                              ? "1px solid rgba(251,191,36,0.28)"
                              : "1px solid rgba(255,255,255,0.06)",
                            color: isToday
                              ? "#000"
                              : inStreak
                              ? "rgba(251,191,36,0.75)"
                              : isFuture
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(255,255,255,0.25)",
                            boxShadow: isToday
                              ? hasStreak
                                ? "0 0 10px rgba(251,191,36,0.5)"
                                : "0 0 10px rgba(52,211,153,0.5)"
                              : "none",
                          }}
                        >
                          {inStreak ? (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1.5 4l2 2L6.5 1.5" stroke="rgba(251,191,36,0.75)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            label
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <p className="text-white/22 text-[11px] font-sans">
                  {hasStreak
                    ? `+${STREAK_BONUS_PER_DAY} XP bonus per streak day`
                    : "Come back tomorrow to build a streak!"}
                </p>
              </div>

              {/* Divider */}
              <div className="w-px self-stretch my-4" style={{ background: hasStreak ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.06)" }} />

              {/* Right — claim button */}
              <div className="flex items-center justify-center p-4">
                <motion.button
                  onClick={handleClaim}
                  className="relative flex flex-col items-center gap-1 w-16 h-16 rounded-2xl font-sans font-bold overflow-hidden"
                  style={{
                    background: hasStreak
                      ? "linear-gradient(135deg, #fbbf24, #f97316)"
                      : "linear-gradient(135deg, #34d399, #10b981)",
                    color: "#000",
                    boxShadow: hasStreak
                      ? "0 4px 20px rgba(251,191,36,0.35), 0 1px 0 rgba(255,255,255,0.2) inset"
                      : "0 4px 20px rgba(52,211,153,0.3), 0 1px 0 rgba(255,255,255,0.2) inset",
                  }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {/* Shimmer */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                  />
                  <span className="relative text-base font-black leading-none mt-3">+{xpAmount}</span>
                  <span className="relative text-[9px] font-semibold uppercase tracking-wide opacity-70 mb-2">XP</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="claimed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl p-4 text-center"
            style={{
              background: "rgba(52,211,153,0.06)",
              border: "1px solid rgba(52,211,153,0.18)",
            }}
          >
            <div className="flex items-center justify-center gap-2.5">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12, delay: 0.1 }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)" }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l2.5 2.5L10 3" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
              <span className="text-emerald-400 font-sans text-sm font-semibold">
                +{xpAmount} XP claimed!
              </span>
              {hasStreak && (
                <motion.span
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-orange-400/70 text-xs font-mono"
                >
                  🔥 {streak}-day streak
                </motion.span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
