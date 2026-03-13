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
    // Check guest completion from localStorage first
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
      className="w-full max-w-md mb-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <button
        onClick={() => router.push("/daily")}
        className="w-full text-left p-5 rounded-2xl border border-amber-500/10 bg-amber-500/[0.03] hover:bg-amber-500/[0.06] hover:border-amber-500/20 transition-all duration-300 group relative overflow-hidden"
      >
        {/* Subtle glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/[0.05] rounded-full blur-2xl group-hover:bg-amber-500/[0.08] transition-all duration-500" />

        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-amber-400/60 font-mono text-[10px] tracking-[0.2em] uppercase">
              Daily Challenge
            </span>
            <span className="text-white/15 font-mono text-[10px]">{dateLabel}</span>
          </div>

          <p className="text-white/90 font-display text-xl mb-2 group-hover:text-amber-100 transition-colors duration-300">
            {data.topic}
          </p>

          {data.completed ? (
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-sm">&#10003;</span>
              <span className="text-emerald-400/50 font-mono text-xs">
                Completed &middot; {data.userScore}/5
              </span>
            </div>
          ) : (
            <p className="text-amber-400/30 font-sans text-xs">
              Complete the quiz for +100 bonus XP
            </p>
          )}
        </div>
      </button>
    </motion.div>
  );
}
