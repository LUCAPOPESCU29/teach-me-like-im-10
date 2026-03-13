"use client";

import { motion } from "framer-motion";
import type { Badge } from "@/lib/badges";

interface Props {
  badge: Badge;
  index: number;
}

export default function BadgeCard({ badge, index }: Props) {
  return (
    <motion.div
      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
        badge.earned
          ? "border-white/10 bg-white/5"
          : "border-white/5 bg-white/[0.02] opacity-40"
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: badge.earned ? 1 : 0.4, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <span className="text-3xl">{badge.icon}</span>
      <span
        className="text-xs font-mono font-medium text-center"
        style={{ color: badge.earned ? badge.color : "rgba(255,255,255,0.3)" }}
      >
        {badge.name}
      </span>
      <span className="text-[10px] text-white/30 text-center leading-tight">
        {badge.description}
      </span>
      {badge.earned && (
        <motion.div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.05 + 0.3, type: "spring" }}
        >
          <span className="text-[10px]">✓</span>
        </motion.div>
      )}
    </motion.div>
  );
}
