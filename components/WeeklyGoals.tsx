"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import type { WeeklyGoal } from "@/lib/data";

const PRESETS = [
  {
    label: "Casual",
    emoji: "🌱",
    topicsGoal: 3,
    xpGoal: 100,
    quizzesGoal: 2,
    color: "#34d399",
    bg: "rgba(52,211,153,0.07)",
    border: "rgba(52,211,153,0.18)",
    glow: "rgba(52,211,153,0.12)",
  },
  {
    label: "Steady",
    emoji: "🌿",
    topicsGoal: 5,
    xpGoal: 250,
    quizzesGoal: 5,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.07)",
    border: "rgba(251,191,36,0.18)",
    glow: "rgba(251,191,36,0.12)",
  },
  {
    label: "Ambitious",
    emoji: "🚀",
    topicsGoal: 10,
    xpGoal: 500,
    quizzesGoal: 10,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.07)",
    border: "rgba(167,139,250,0.18)",
    glow: "rgba(167,139,250,0.12)",
  },
];

const PROGRESS_COLORS = {
  topics: "#34d399",
  xp: "#fbbf24",
  quizzes: "#a78bfa",
};

function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const complete = value >= max;
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
      <motion.div
        className="h-full rounded-full"
        style={{
          background: complete
            ? `linear-gradient(90deg, ${color}, ${color}cc)`
            : `linear-gradient(90deg, ${color}cc, ${color})`,
          boxShadow: complete ? `0 0 8px ${color}60` : "none",
        }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
      />
    </div>
  );
}

function getWeekLabel(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

export default function WeeklyGoals() {
  const { data: dataLayer } = useAuth();
  const [goal, setGoal] = useState<WeeklyGoal | null | undefined>(undefined);
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ topicsGoal: 5, xpGoal: 250, quizzesGoal: 5 });

  useEffect(() => {
    dataLayer.getWeeklyGoal().then(setGoal);
  }, [dataLayer]);

  async function handleSetGoal(g: { topicsGoal: number; xpGoal: number; quizzesGoal: number }) {
    await dataLayer.setWeeklyGoal(g);
    const updated = await dataLayer.getWeeklyGoal();
    setGoal(updated);
    setShowCustom(false);
  }

  async function handleReset() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("tmi10_weekly_goal");
      localStorage.removeItem("tmi10_weekly_goal_auth");
    }
    setGoal(null);
  }

  if (goal === undefined) return null;

  // ── No goal set — setup ───────────────────────────────────────────────────
  if (goal === null) {
    return (
      <motion.div
        className="rounded-2xl border border-white/[0.08] overflow-hidden"
        style={{ background: "rgba(255,255,255,0.025)" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <h2 className="text-white/85 font-display text-base">Weekly Goal</h2>
            </div>
            <span className="text-white/18 text-[10px] font-sans">{getWeekLabel()}</span>
          </div>
          <p className="text-white/28 text-xs font-sans mb-4 pl-7">
            How much do you want to learn?
          </p>

          {/* Preset cards */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {PRESETS.map((p, i) => (
              <motion.button
                key={p.label}
                onClick={() => handleSetGoal(p)}
                className="relative overflow-hidden p-3 rounded-xl text-center group"
                style={{
                  background: p.bg,
                  border: `1px solid ${p.border}`,
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06, ease: [0.32, 0.72, 0, 1] }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {/* Top glow */}
                <div
                  className="absolute inset-x-0 top-0 h-8 pointer-events-none"
                  style={{ background: `linear-gradient(to bottom, ${p.glow}, transparent)` }}
                />
                <span className="relative text-xl block mb-1.5">{p.emoji}</span>
                <span
                  className="relative block text-xs font-sans font-semibold mb-0.5"
                  style={{ color: p.color }}
                >
                  {p.label}
                </span>
                <span className="relative block text-[10px] font-sans" style={{ color: `${p.color}66` }}>
                  {p.topicsGoal} topics
                </span>
                <span className="relative block text-[10px] font-sans" style={{ color: `${p.color}66` }}>
                  {p.xpGoal} XP
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {!showCustom ? (
            <button
              onClick={() => setShowCustom(true)}
              className="w-full py-2.5 text-white/22 text-xs font-sans hover:text-white/40 transition-colors duration-300 border-t border-white/[0.05]"
            >
              or set custom goals...
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-white/[0.05]"
            >
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "topicsGoal", label: "Topics", min: 1, max: 50, step: 1 },
                    { key: "xpGoal", label: "XP", min: 10, max: 5000, step: 10 },
                    { key: "quizzesGoal", label: "Quizzes", min: 1, max: 50, step: 1 },
                  ].map(({ key, label, min, max, step }) => (
                    <div key={key}>
                      <label className="text-white/28 text-[10px] font-sans block mb-1">{label}</label>
                      <input
                        type="number"
                        min={min}
                        max={max}
                        step={step}
                        value={custom[key as keyof typeof custom]}
                        onChange={(e) => setCustom({ ...custom, [key]: +e.target.value || min })}
                        className="w-full px-2 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white font-mono text-xs text-center focus:outline-none focus:border-emerald-500/30 transition-colors"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSetGoal(custom)}
                    className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-sans hover:bg-emerald-500/18 transition-colors"
                  >
                    Set Goal
                  </button>
                  <button
                    onClick={() => setShowCustom(false)}
                    className="px-3.5 py-1.5 rounded-full text-white/28 text-xs font-sans hover:text-white/50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ── Goal set — progress view ──────────────────────────────────────────────
  const allComplete =
    goal.topicsCompleted >= goal.topicsGoal &&
    goal.xpEarned >= goal.xpGoal &&
    goal.quizzesCompleted >= goal.quizzesGoal;

  const rows = [
    {
      label: "Topics",
      icon: "📖",
      value: goal.topicsCompleted,
      max: goal.topicsGoal,
      color: PROGRESS_COLORS.topics,
    },
    {
      label: "XP",
      icon: "⭐",
      value: goal.xpEarned,
      max: goal.xpGoal,
      color: PROGRESS_COLORS.xp,
    },
    {
      label: "Quizzes",
      icon: "🧠",
      value: goal.quizzesCompleted,
      max: goal.quizzesGoal,
      color: PROGRESS_COLORS.quizzes,
    },
  ];

  return (
    <motion.div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: allComplete
          ? "linear-gradient(135deg, rgba(52,211,153,0.07), rgba(16,185,129,0.03))"
          : "rgba(255,255,255,0.025)",
        borderColor: allComplete ? "rgba(52,211,153,0.22)" : "rgba(255,255,255,0.08)",
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {allComplete && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 70% 0%, rgba(52,211,153,0.08) 0%, transparent 60%)",
        }} />
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-base">{allComplete ? "✅" : "🎯"}</span>
            <h2 className="text-white/85 font-display text-base">Weekly Goal</h2>
            {allComplete && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }}
              >
                Done!
              </motion.span>
            )}
          </div>
          <span className="text-white/18 text-[10px] font-sans">{getWeekLabel()}</span>
        </div>

        <div className="space-y-3.5">
          {rows.map((row, i) => {
            const complete = row.value >= row.max;
            return (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{row.icon}</span>
                    <span className="text-white/45 text-xs font-sans">{row.label}</span>
                    {complete && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                        style={{ background: `${row.color}20`, border: `1px solid ${row.color}40` }}
                      >
                        <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                          <path d="M1 3l1.5 1.5L5 1.5" stroke={row.color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.div>
                    )}
                  </div>
                  <span className="text-white/32 text-[10px] font-mono tabular-nums">
                    {row.value}<span className="text-white/16">/{row.max}</span>
                  </span>
                </div>
                <ProgressBar value={row.value} max={row.max} color={row.color} />
              </motion.div>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleReset}
        className="w-full py-2.5 text-white/18 text-[10px] font-sans hover:text-white/35 transition-colors duration-300 border-t border-white/[0.05]"
      >
        Reset goal
      </button>
    </motion.div>
  );
}
