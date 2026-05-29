"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface DailyData {
  topic: string;
  date: string;
  completed: boolean;
  userScore: number;
}

export default function DailyChallenge() {
  const router = useRouter();
  const [data, setData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const guestKey = `tmi10_daily_${today}`;
    const guestData = localStorage.getItem(guestKey);

    fetch("/api/daily-challenge")
      .then((res) => res.json())
      .then((d) => {
        const completed = d.completed || !!guestData;
        const userScore = d.userScore || (guestData ? JSON.parse(guestData).score : 0);
        setData({ topic: d.topic, date: d.date, completed, userScore });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

  const dateLabel = new Date(data.date + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <button
        onClick={() => router.push("/daily")}
        className="w-full text-left rounded-2xl relative overflow-hidden group"
        style={{
          background: data.completed
            ? "linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(16,185,129,0.04) 100%)"
            : "linear-gradient(135deg, rgba(251,191,36,0.07) 0%, rgba(245,158,11,0.03) 100%)",
          border: data.completed
            ? "1px solid rgba(52,211,153,0.18)"
            : "1px solid rgba(251,191,36,0.14)",
        }}
      >
        {/* Background mesh gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: data.completed
              ? "radial-gradient(ellipse at 85% 15%, rgba(52,211,153,0.12) 0%, transparent 55%)"
              : "radial-gradient(ellipse at 85% 15%, rgba(251,191,36,0.1) 0%, transparent 55%)",
          }}
        />

        {/* Animated corner glow on hover */}
        <motion.div
          className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none"
          style={{
            background: data.completed
              ? "rgba(52,211,153,0.15)"
              : "rgba(251,191,36,0.12)",
            filter: "blur(24px)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Fine dot pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            maskImage: "radial-gradient(ellipse at 80% 20%, black 0%, transparent 65%)",
            WebkitMaskImage: "radial-gradient(ellipse at 80% 20%, black 0%, transparent 65%)",
          }}
        />

        <div className="relative p-5">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: data.completed ? "#34d399" : "#fbbf24",
                  boxShadow: data.completed
                    ? "0 0 8px rgba(52,211,153,0.9)"
                    : "0 0 8px rgba(251,191,36,0.9)",
                }}
              />
              <span
                className="text-[10px] font-sans font-semibold tracking-[0.16em] uppercase"
                style={{ color: data.completed ? "rgba(52,211,153,0.7)" : "rgba(251,191,36,0.65)" }}
              >
                Daily Challenge
              </span>
            </div>
            <span className="text-white/18 font-sans text-[10px] tabular-nums">{dateLabel}</span>
          </div>

          {/* Topic — big and bold */}
          <p
            className="font-display text-xl leading-snug mb-4 transition-colors duration-300"
            style={{ color: data.completed ? "rgba(52,211,153,0.9)" : "rgba(255,255,255,0.92)" }}
          >
            {data.topic}
          </p>

          {/* Bottom row */}
          {data.completed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5l2.5 2.5L7.5 2" stroke="#34d399" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
                <span className="text-emerald-400/65 font-sans text-xs">Completed</span>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-4 h-1.5 rounded-full"
                    style={{
                      background: i < data.userScore ? "#34d399" : "rgba(255,255,255,0.07)",
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold"
                  style={{
                    background: "rgba(251,191,36,0.1)",
                    border: "1px solid rgba(251,191,36,0.2)",
                    color: "rgba(251,191,36,0.75)",
                  }}
                >
                  +100 XP
                </div>
                <span className="text-white/22 text-[11px] font-sans">bonus on completion</span>
              </div>
              <motion.div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}
                animate={{ x: [0, 2, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="rgba(251,191,36,0.7)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
            </div>
          )}
        </div>
      </button>
    </motion.div>
  );
}
