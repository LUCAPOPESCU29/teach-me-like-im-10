"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

interface DayData {
  date: string; // YYYY-MM-DD
  count: number; // activity count (topics, quizzes, etc.)
}

function getDaysInRange(weeks: number): string[] {
  const days: string[] = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1));

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function getIntensity(count: number): string {
  if (count === 0) return "rgba(255,255,255,0.04)";
  if (count === 1) return "var(--accent-20, rgba(52,211,153,0.2))";
  if (count === 2) return "var(--accent-40, rgba(52,211,153,0.4))";
  if (count <= 4) return "var(--accent-60, rgba(52,211,153,0.6))";
  return "var(--accent, #34d399)";
}

function getIntensityFromAccent(count: number, accent: string): string {
  if (count === 0) return "rgba(255,255,255,0.04)";
  // Parse hex to rgb
  const r = parseInt(accent.slice(1, 3), 16);
  const g = parseInt(accent.slice(3, 5), 16);
  const b = parseInt(accent.slice(5, 7), 16);
  if (count === 1) return `rgba(${r},${g},${b},0.2)`;
  if (count === 2) return `rgba(${r},${g},${b},0.4)`;
  if (count <= 4) return `rgba(${r},${g},${b},0.65)`;
  return `rgba(${r},${g},${b},1)`;
}

function loadActivityData(): Map<string, number> {
  const map = new Map<string, number>();

  // Count from learning time
  try {
    const timeData = JSON.parse(localStorage.getItem("tmi10_learning_time") || "[]");
    for (const entry of timeData) {
      if (entry.date) {
        map.set(entry.date, (map.get(entry.date) || 0) + 1);
      }
    }
  } catch { /* */ }

  // Count from XP events
  try {
    const xpData = JSON.parse(localStorage.getItem("tmi10_xp_history") || "[]");
    for (const entry of xpData) {
      const date = entry.date?.split("T")?.[0] || entry.date;
      if (date) {
        map.set(date, (map.get(date) || 0) + 1);
      }
    }
  } catch { /* */ }

  // Count from topic progress keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("tmi10_topic_")) {
        const val = JSON.parse(localStorage.getItem(key) || "{}");
        if (val.lastAccessed) {
          const date = new Date(val.lastAccessed).toISOString().split("T")[0];
          map.set(date, (map.get(date) || 0) + 1);
        }
      }
    }
  } catch { /* */ }

  return map;
}

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export default function HeatmapCalendar({ weeks = 20 }: { weeks?: number }) {
  const [activityMap, setActivityMap] = useState<Map<string, number>>(new Map());
  const [accent, setAccent] = useState("#34d399");
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  useEffect(() => {
    setActivityMap(loadActivityData());
    setAccent(localStorage.getItem("tmi10_accent_color") || "#34d399");
  }, []);

  const days = useMemo(() => getDaysInRange(weeks), [weeks]);

  // Organize into weeks (columns)
  const grid = useMemo(() => {
    const cols: string[][] = [];
    let currentCol: string[] = [];

    // Find the day of week for the first day (0=Sun, 1=Mon, ...)
    const firstDow = new Date(days[0]).getDay();
    // Pad the first column
    for (let i = 0; i < firstDow; i++) {
      currentCol.push("");
    }

    for (const day of days) {
      const dow = new Date(day).getDay();
      if (dow === 0 && currentCol.length > 0) {
        cols.push(currentCol);
        currentCol = [];
      }
      currentCol.push(day);
    }
    if (currentCol.length > 0) {
      // Pad the last column
      while (currentCol.length < 7) currentCol.push("");
      cols.push(currentCol);
    }

    return cols;
  }, [days]);

  // Stats
  const totalActive = useMemo(() => {
    let count = 0;
    for (const day of days) {
      if ((activityMap.get(day) || 0) > 0) count++;
    }
    return count;
  }, [days, activityMap]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if ((activityMap.get(key) || 0) > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [activityMap]);

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: { text: string; col: number }[] = [];
    let lastMonth = -1;
    grid.forEach((col, colIdx) => {
      for (const day of col) {
        if (day) {
          const month = new Date(day).getMonth();
          if (month !== lastMonth) {
            lastMonth = month;
            labels.push({
              text: new Date(day).toLocaleString("en", { month: "short" }),
              col: colIdx,
            });
          }
          break;
        }
      }
    });
    return labels;
  }, [grid]);

  return (
    <div className="w-full">
      {/* Stats row */}
      <div className="flex items-center gap-4 mb-3">
        <span className="text-white/30 text-xs font-sans">
          {totalActive} active days
        </span>
        {currentStreak > 0 && (
          <span className="text-xs font-sans" style={{ color: accent }}>
            {currentStreak} day streak
          </span>
        )}
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="inline-flex gap-[1px]">
          {/* Weekday labels */}
          <div className="flex flex-col gap-[1px] mr-1">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={i} className="w-[22px] h-[13px] flex items-center">
                <span className="text-[9px] text-white/20 font-sans">{label}</span>
              </div>
            ))}
          </div>

          {/* Weeks */}
          {grid.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-[1px]">
              {col.map((day, rowIdx) => (
                <div
                  key={`${colIdx}-${rowIdx}`}
                  className="relative"
                  onMouseEnter={() => day && setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  <div
                    className="w-[13px] h-[13px] rounded-[2px] transition-colors duration-150"
                    style={{
                      backgroundColor: day
                        ? getIntensityFromAccent(activityMap.get(day) || 0, accent)
                        : "transparent",
                    }}
                  />
                  {/* Tooltip */}
                  {hoveredDay === day && day && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 px-2 py-1 rounded-md bg-[#0c1220] border border-white/10 text-[10px] font-sans text-white/70 whitespace-nowrap shadow-lg pointer-events-none">
                      {activityMap.get(day) || 0} activities · {new Date(day).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Month labels */}
        <div className="flex mt-1 ml-[26px]" style={{ gap: "1px" }}>
          {monthLabels.map((label, i) => (
            <span
              key={i}
              className="text-[9px] text-white/20 font-sans"
              style={{ marginLeft: i === 0 ? 0 : `${(label.col - (monthLabels[i - 1]?.col || 0) - 1) * 14}px` }}
            >
              {label.text}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-[9px] text-white/20 font-sans">Less</span>
        {[0, 1, 2, 3, 5].map((count) => (
          <div
            key={count}
            className="w-[11px] h-[11px] rounded-[2px]"
            style={{ backgroundColor: getIntensityFromAccent(count, accent) }}
          />
        ))}
        <span className="text-[9px] text-white/20 font-sans">More</span>
      </div>
    </div>
  );
}
