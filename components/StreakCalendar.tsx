"use client";

import { motion } from "framer-motion";
import type { ActivityDay } from "@/lib/data";

interface Props {
  activity: ActivityDay[];
}

export default function StreakCalendar({ activity }: Props) {
  // Build a map of date -> count
  const activityMap = new Map<string, number>();
  for (const day of activity) {
    activityMap.set(day.date, day.count);
  }

  // Generate last 365 days
  const today = new Date();
  const days: { date: string; count: number }[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({ date: dateStr, count: activityMap.get(dateStr) || 0 });
  }

  // Group into weeks (columns)
  const weeks: typeof days[] = [];
  let currentWeek: typeof days = [];

  // Pad the first week with empty days
  const firstDay = new Date(days[0].date);
  const firstDayOfWeek = firstDay.getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: "", count: -1 });
  }

  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  function getColor(count: number): string {
    if (count < 0) return "transparent";
    if (count === 0) return "rgba(255,255,255,0.05)";
    if (count <= 2) return "rgba(52,211,153,0.3)";
    if (count <= 5) return "rgba(52,211,153,0.5)";
    return "rgba(52,211,153,0.8)";
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div>
      {/* Month labels */}
      <div className="flex gap-[3px] mb-1 ml-6">
        {weeks.map((week, i) => {
          if (i === 0) return <div key={i} className="w-[11px]" />;
          const firstValidDay = week.find(d => d.count >= 0);
          if (!firstValidDay) return <div key={i} className="w-[11px]" />;
          const date = new Date(firstValidDay.date);
          if (date.getDate() <= 7) {
            return (
              <div key={i} className="w-[11px] text-[9px] text-white/30 font-mono">
                {months[date.getMonth()]}
              </div>
            );
          }
          return <div key={i} className="w-[11px]" />;
        })}
      </div>
      <div className="flex gap-[3px]">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1">
          {["", "M", "", "W", "", "F", ""].map((d, i) => (
            <div key={i} className="h-[11px] text-[9px] text-white/20 font-mono leading-[11px]">
              {d}
            </div>
          ))}
        </div>
        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => (
              <motion.div
                key={`${wi}-${di}`}
                className="w-[11px] h-[11px] rounded-[2px]"
                style={{ backgroundColor: getColor(day.count) }}
                title={day.count >= 0 ? `${day.date}: ${day.count} actions` : ""}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: wi * 0.005 }}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[10px] text-white/20 font-mono">Less</span>
        {[0, 1, 3, 6].map((count) => (
          <div
            key={count}
            className="w-[11px] h-[11px] rounded-[2px]"
            style={{ backgroundColor: getColor(count) }}
          />
        ))}
        <span className="text-[10px] text-white/20 font-mono">More</span>
      </div>
    </div>
  );
}
