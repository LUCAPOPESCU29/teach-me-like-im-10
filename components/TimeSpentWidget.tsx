"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

const STORAGE_KEY = "tmi10_learning_time";

interface LearningSession {
  date: string;
  minutes: number;
  topic: string;
}

function loadSessions(): LearningSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return data.sessions || [];
  } catch {
    return [];
  }
}

function formatTime(minutes: number): string {
  if (minutes <= 0) return "0 min";
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getStartOfWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().slice(0, 10);
}

function getStartOfMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function getLast7Days(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2);
}

function computeStats(sessions: LearningSession[]) {
  const today = getToday();
  const weekStart = getStartOfWeek();
  const monthStart = getStartOfMonth();

  let todayMin = 0;
  let weekMin = 0;
  let monthMin = 0;

  for (const s of sessions) {
    if (s.date === today) todayMin += s.minutes;
    if (s.date >= weekStart) weekMin += s.minutes;
    if (s.date >= monthStart) monthMin += s.minutes;
  }

  // Daily minutes for last 7 days
  const last7 = getLast7Days();
  const dailyMinutes = last7.map((day) => {
    let total = 0;
    for (const s of sessions) {
      if (s.date === day) total += s.minutes;
    }
    return { day, minutes: total };
  });

  return { todayMin, weekMin, monthMin, dailyMinutes };
}

function AnimatedNumber({ value, suffix }: { value: string; suffix?: string }) {
  const [displayed, setDisplayed] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      setDisplayed(value);
    }
  }, [value]);

  return (
    <motion.span
      key={displayed}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="font-mono"
    >
      {displayed}{suffix}
    </motion.span>
  );
}

export default function TimeSpentWidget() {
  const [stats, setStats] = useState<ReturnType<typeof computeStats> | null>(null);

  useEffect(() => {
    const sessions = loadSessions();
    setStats(computeStats(sessions));

    // Re-check every 30 seconds in case time tracker writes new data
    const interval = setInterval(() => {
      const fresh = loadSessions();
      setStats(computeStats(fresh));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (stats === null) return null;

  const hasData = stats.monthMin > 0;

  // Don't render at all when there's no data
  if (!hasData) return null;
  const maxDaily = Math.max(...stats.dailyMinutes.map((d) => d.minutes), 1);

  return (
    <motion.div
      className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-display text-lg flex items-center gap-2">
          <span className="text-lg">{"\u23F1\uFE0F"}</span> Time Spent
        </h2>
      </div>

      {/* Main headline */}
          <p className="text-white/70 text-sm font-sans mb-3">
            {"You\u2019ve spent "}
            <span className="text-white font-mono font-medium">
              <AnimatedNumber value={formatTime(stats.monthMin)} />
            </span>
            {" learning this month"}
          </p>

          {/* Breakdown row */}
          <div className="flex items-center gap-2 text-xs text-white/35 font-sans mb-4">
            <span>
              Today:{" "}
              <span className="text-white/50 font-mono">
                <AnimatedNumber value={formatTime(stats.todayMin)} />
              </span>
            </span>
            <span className="text-white/15">{"\u00B7"}</span>
            <span>
              This week:{" "}
              <span className="text-white/50 font-mono">
                <AnimatedNumber value={formatTime(stats.weekMin)} />
              </span>
            </span>
            <span className="text-white/15">{"\u00B7"}</span>
            <span>
              This month:{" "}
              <span className="text-white/50 font-mono">
                <AnimatedNumber value={formatTime(stats.monthMin)} />
              </span>
            </span>
          </div>

          {/* 7-day bar chart */}
          <div className="flex items-end gap-1.5 h-12">
            {stats.dailyMinutes.map(({ day, minutes }) => {
              const height = minutes > 0 ? Math.max((minutes / maxDaily) * 100, 8) : 4;
              const isToday = day === getToday();
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    className={`w-full rounded-sm ${
                      minutes > 0
                        ? isToday
                          ? "bg-emerald-400/60"
                          : "bg-emerald-400/25"
                        : "bg-white/[0.06]"
                    }`}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                    title={`${getDayLabel(day)}: ${formatTime(minutes)}`}
                  />
                  <span className={`text-[9px] font-sans ${isToday ? "text-white/50" : "text-white/20"}`}>
                    {getDayLabel(day)}
                  </span>
                </div>
              );
            })}
          </div>
    </motion.div>
  );
}
