"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getStats, QUOTES, type StudyStats } from "@/components/StudyTimer";
import PageTransition from "@/components/PageTransition";

const StudyTimer = dynamic(() => import("@/components/StudyTimer"), {
  ssr: false,
});

/* ─── Helpers ─── */
function getStreak(stats: StudyStats): number {
  if (!stats.lastDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(stats.lastDate + "T00:00:00");
  const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Studied today — check consecutive days backwards from localStorage history
    return computeConsecutiveDays(stats);
  }
  if (diffDays === 1) {
    return computeConsecutiveDays(stats);
  }
  return 0;
}

function computeConsecutiveDays(stats: StudyStats): number {
  // Simple streak: if they have a lastDate, count at least 1
  // For a more robust streak, we'd need daily logs, but this gives a reasonable approximation
  if (!stats.lastDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(stats.lastDate + "T00:00:00");
  const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 1) return 0;
  // At least 1 day streak
  return Math.max(1, Math.min(stats.sessions, 365));
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/* ─── Stat Card ─── */
function StatCard({
  label,
  value,
  sub,
  color = "emerald",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: "emerald" | "blue" | "amber" | "rose";
}) {
  const colorMap = {
    emerald: "border-emerald-500/15 text-emerald-400",
    blue: "border-blue-500/15 text-blue-400",
    amber: "border-amber-500/15 text-amber-400",
    rose: "border-rose-500/15 text-rose-400",
  };
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/10 p-4 flex flex-col items-center gap-1">
      <span className="font-sans text-[10px] text-white/30 tracking-wider uppercase">
        {label}
      </span>
      <span className={`font-mono text-2xl ${colorMap[color]}`}>{value}</span>
      {sub && (
        <span className="font-sans text-[10px] text-white/20">{sub}</span>
      )}
    </div>
  );
}

/* ─── Page ─── */
export default function StudyPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StudyStats>({ totalMinutes: 0, sessions: 0, lastDate: "" });
  const [showTimer, setShowTimer] = useState(false);

  useEffect(() => {
    setStats(getStats());
  }, []);

  // Refresh stats periodically while timer is visible
  useEffect(() => {
    if (!showTimer) return;
    const interval = setInterval(() => setStats(getStats()), 5000);
    return () => clearInterval(interval);
  }, [showTimer]);

  const streak = useMemo(() => getStreak(stats), [stats]);
  const avgPerDay = stats.sessions > 0 ? Math.round(stats.totalMinutes / Math.max(streak, 1)) : 0;
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  return (
    <PageTransition>
    <main className="min-h-screen flex flex-col items-center px-4 pt-10 sm:pt-16 pb-24 sm:pb-12">
      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl sm:text-4xl text-white mb-2">
          Study Timer
        </h1>
        <p className="text-white/30 font-sans text-sm max-w-md">
          Focus deeply with the Pomodoro technique. Earn XP for every session.
        </p>
      </motion.div>

      {/* Start Timer Button */}
      <motion.div
        className="mb-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <button
          onClick={() => setShowTimer(true)}
          className="group relative px-8 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-sans text-base hover:bg-emerald-500/15 hover:border-emerald-500/40 transition-all duration-300"
        >
          <span className="relative z-10 flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="8" cy="9" r="6" />
              <path d="M8 6v3l2 1.5" />
              <path d="M6 2h4" />
            </svg>
            Start Study Session
          </span>
        </button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="w-full max-w-lg grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <StatCard
          label="Total Time"
          value={formatMinutes(stats.totalMinutes)}
          color="emerald"
        />
        <StatCard
          label="Sessions"
          value={String(stats.sessions)}
          color="blue"
        />
        <StatCard
          label="Streak"
          value={`${streak}d`}
          sub="consecutive days"
          color="amber"
        />
        <StatCard
          label="Avg / Day"
          value={formatMinutes(avgPerDay)}
          color="rose"
        />
      </motion.div>

      {/* Motivational quote */}
      <motion.div
        className="w-full max-w-lg rounded-xl bg-white/[0.02] border border-white/[0.06] p-5 mb-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <p className="text-white/25 font-serif text-sm italic leading-relaxed">
          &ldquo;{quote}&rdquo;
        </p>
      </motion.div>

      {/* How Pomodoro works */}
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <h2 className="font-sans text-xs text-white/30 tracking-wider uppercase mb-3">
          How Pomodoro Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { step: "1", title: "Focus", desc: "Pick 15, 25, or 45 min and concentrate", icon: "brain" },
            { step: "2", title: "Break", desc: "Rest for 5 minutes between sessions", icon: "coffee" },
            { step: "3", title: "Repeat", desc: "Complete 4 sessions for maximum retention", icon: "repeat" },
            { step: "4", title: "Earn XP", desc: "+25 XP per completed focus session", icon: "star" },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-3 rounded-xl bg-white/[0.02] border border-white/[0.06] p-3.5"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="font-mono text-[10px] text-emerald-400">
                  {item.step}
                </span>
              </div>
              <div>
                <p className="font-sans text-sm text-white/60 font-medium">
                  {item.title}
                </p>
                <p className="font-sans text-[11px] text-white/25 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Timer Modal */}
      {showTimer && (
        <StudyTimer
          defaultView="full"
          onClose={() => {
            setShowTimer(false);
            setStats(getStats());
          }}
        />
      )}
    </main>
      </PageTransition>
  );
}
