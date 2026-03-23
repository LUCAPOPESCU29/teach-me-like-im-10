"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";

export default function StreakBanner() {
  const { data } = useAuth();
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    data.getXP().then((xp) => {
      setStreak(xp.streak);
      setLoading(false);
    });
  }, [data]);

  if (loading || streak === 0) return null;

  return (
    <motion.div
      className="w-full max-w-xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <div className="flex items-center justify-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <span className="text-2xl">🔥</span>
        <div className="text-center">
          <span className="text-white/90 font-sans text-sm font-medium">
            {streak} day streak!
          </span>
          <span className="text-white/30 font-sans text-xs ml-2">
            {streak >= 7
              ? "You're on fire!"
              : streak >= 3
              ? "Keep it going!"
              : "Great start!"}
          </span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-orange-400"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 + i * 0.08, type: "spring" }}
              style={{ opacity: 0.4 + (i / 7) * 0.6 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
