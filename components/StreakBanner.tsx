"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getGuestFreezes } from "@/lib/xp";
import { hasPerk, PERK } from "@/lib/perks";

export default function StreakBanner() {
  const { data } = useAuth();
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [freezes, setFreezes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [atRisk, setAtRisk] = useState(false);

  useEffect(() => {
    async function load() {
      const xp = await data.getXP();
      setStreak(xp.streak);
      setFreezes(xp.freezes ?? getGuestFreezes());

      // Check if streak is at risk: after 10pm and no activity today
      if (xp.streak > 0) {
        const hour = new Date().getHours();
        if (hour >= 22) {
          const hasActivity = await data.hasActivityToday();
          setAtRisk(!hasActivity);
        }
      }

      setLoading(false);
    }
    load();
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
        <div className="flex items-center gap-2 text-center">
          <span className="text-white/90 font-sans text-sm font-medium">
            {streak} day streak!
          </span>
          {/* Breathing dot */}
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: atRisk ? "#fbbf24" : "var(--accent)" }}
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <span className="text-white/30 font-sans text-xs">
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
        {/* Freeze shop link with count */}
        <button
          onClick={() => router.push("/progress#freeze-shop")}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/[0.08] border border-cyan-500/15 hover:bg-cyan-500/[0.15] hover:border-cyan-500/30 transition-all ml-1 group"
          title="Streak Freeze Shop"
        >
          <span className="text-sm">❄️</span>
          <span className="text-cyan-300/70 group-hover:text-cyan-300 text-[10px] font-mono transition-colors">
            {hasPerk(PERK.FROST_TITAN) ? "∞" : freezes}
          </span>
        </button>
      </div>
    </motion.div>
  );
}
