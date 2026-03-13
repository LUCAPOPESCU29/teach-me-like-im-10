"use client";

import { motion } from "framer-motion";
import type { XPEvent } from "@/lib/data";

interface Props {
  events: XPEvent[];
  days?: number;
}

export default function XPChart({ events, days = 30 }: Props) {
  // Group XP by day
  const today = new Date();
  const dailyXP: { date: string; total: number; label: string }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayTotal = events
      .filter((e) => e.createdAt.slice(0, 10) === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);
    dailyXP.push({
      date: dateStr,
      total: dayTotal,
      label: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
    });
  }

  const maxXP = Math.max(...dailyXP.map((d) => d.total), 1);

  return (
    <div>
      <div className="flex items-end gap-[3px] h-32">
        {dailyXP.map((day, i) => {
          const height = day.total > 0 ? Math.max((day.total / maxXP) * 100, 4) : 0;
          return (
            <motion.div
              key={day.date}
              className="flex-1 min-w-0 group relative"
              initial={{ height: 0 }}
              animate={{ height: "100%" }}
              transition={{ delay: i * 0.02 }}
            >
              <div className="absolute bottom-0 w-full flex flex-col items-center">
                <motion.div
                  className="w-full rounded-t-sm bg-emerald-500/40 hover:bg-emerald-500/60 transition-colors cursor-default"
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.02, duration: 0.4 }}
                  style={{ minHeight: day.total > 0 ? "3px" : "0px" }}
                  title={`${day.label}: ${day.total} XP`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
      {/* X-axis labels - show every 7 days */}
      <div className="flex gap-[3px] mt-1">
        {dailyXP.map((day, i) => (
          <div key={day.date} className="flex-1 min-w-0 text-center">
            {i % 7 === 0 ? (
              <span className="text-[9px] text-white/20 font-mono">{day.label}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
