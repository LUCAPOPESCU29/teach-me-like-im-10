"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import type { TopicHistoryItem, XPEvent } from "@/lib/data";
import PageTransition from "@/components/PageTransition";

/* ─── Types ─── */
interface LearningSession {
  date: string;
  minutes: number;
  topic: string;
}

interface JournalEntry {
  date: string;
  dateLabel: string;
  topics: string[];
  xpEarned: number;
  minutesSpent: number;
  quizzes: number;
  narrative: string;
  mood: { label: string; emoji: string; color: string };
}

/* ─── localStorage readers ─── */
function loadLearningSessions(): LearningSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("tmi10_learning_time");
    if (!raw) return [];
    return JSON.parse(raw).sessions || [];
  } catch {
    return [];
  }
}

function loadGuestTopicKeys(): { slug: string; topicName: string }[] {
  if (typeof window === "undefined") return [];
  const prefix = "tmi10_";
  const excluded = new Set([
    "tmi10_xp", "tmi10_streak", "tmi10_lang", "tmi10_bookmarks",
    "tmi10_badges", "tmi10_weekly_goal", "tmi10_weekly_goal_auth",
    "tmi10_learning_time", "tmi10_study_stats", "tmi10_speedruns",
    "tmi10_freezes", "tmi10_streak_risk_dismissed", "tmi10_journal_cache",
  ]);
  const topics: { slug: string; topicName: string }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix) && !excluded.has(key)) {
      const slug = key.replace(prefix, "").replace(/^[a-z]{2}_/, "");
      topics.push({ slug, topicName: slug.replace(/-/g, " ") });
    }
  }
  return topics;
}

function loadGuestXPTotal(): number {
  try {
    return parseInt(localStorage.getItem("tmi10_xp") || "0", 10);
  } catch {
    return 0;
  }
}

/* ─── Narrative generation ─── */
const openers = [
  "Today you explored",
  "You spent time learning about",
  "Your curiosity led you to",
  "You dived into",
  "You ventured into the world of",
];

const quizPhrases = [
  "and aced a quiz along the way!",
  "and tested your knowledge with a quiz!",
  "and challenged yourself with a quiz.",
];

const singleTopicPhrases = [
  "You went deep on a single subject \u2014 focused learning at its best.",
  "Deep focus on one topic today. That\u2019s how mastery works.",
  "Single-topic day. Sometimes depth beats breadth.",
];

const multiTopicPhrases = [
  "A wide-ranging day of exploration!",
  "You covered a lot of ground today.",
  "Quite the intellectual buffet!",
];

const restDayPhrases = [
  "A quiet day. Sometimes the best ideas come from rest.",
  "No learning logged today \u2014 and that\u2019s perfectly fine. Recharge!",
  "Rest day. Your brain is still processing yesterday\u2019s discoveries.",
  "A pause in the journey. The path will be here tomorrow.",
];

function pickRandom<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h;
}

function generateNarrative(entry: Omit<JournalEntry, "narrative" | "mood" | "dateLabel">): string {
  const seed = hashStr(entry.date);
  if (entry.topics.length === 0) {
    return pickRandom(restDayPhrases, seed);
  }

  const topicNames = entry.topics.map((t) => t.replace(/-/g, " "));
  const opener = pickRandom(openers, seed);

  let body: string;
  if (topicNames.length === 1) {
    body = `${opener} ${topicNames[0]}. ${pickRandom(singleTopicPhrases, seed + 1)}`;
  } else if (topicNames.length === 2) {
    body = `${opener} ${topicNames[0]} and ${topicNames[1]}. ${pickRandom(multiTopicPhrases, seed + 1)}`;
  } else {
    const last = topicNames[topicNames.length - 1];
    const rest = topicNames.slice(0, -1).join(", ");
    body = `${opener} ${rest}, and ${last}. ${pickRandom(multiTopicPhrases, seed + 1)}`;
  }

  if (entry.quizzes > 0) {
    body += " " + pickRandom(quizPhrases, seed + 2);
  }

  if (entry.minutesSpent > 60) {
    body += ` Over ${Math.floor(entry.minutesSpent / 60)} hours of learning \u2014 impressive dedication!`;
  } else if (entry.minutesSpent > 20) {
    body += ` ${Math.round(entry.minutesSpent)} minutes well spent.`;
  }

  return body;
}

function getMood(entry: { topics: string[]; xpEarned: number; minutesSpent: number; quizzes: number }): JournalEntry["mood"] {
  if (entry.topics.length === 0) return { label: "Resting", emoji: "\uD83D\uDCA4", color: "text-blue-300" };
  if (entry.xpEarned >= 100 && entry.topics.length >= 3) return { label: "On Fire", emoji: "\uD83D\uDD25", color: "text-orange-400" };
  if (entry.quizzes > 0 && entry.xpEarned >= 50) return { label: "Productive", emoji: "\uD83D\uDE80", color: "text-emerald-400" };
  if (entry.minutesSpent >= 30) return { label: "Focused", emoji: "\uD83C\uDFAF", color: "text-purple-400" };
  if (entry.topics.length >= 2) return { label: "Curious", emoji: "\uD83E\uDDD0", color: "text-yellow-400" };
  return { label: "Casual", emoji: "\u2615", color: "text-white/50" };
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(minutes: number): string {
  if (minutes <= 0) return "0 min";
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/* ─── Build journal entries from data ─── */
function buildJournalEntries(
  sessions: LearningSession[],
  topicHistory: TopicHistoryItem[],
  xpEvents: XPEvent[],
): JournalEntry[] {
  // Collect all unique dates
  const dateSet = new Set<string>();
  sessions.forEach((s) => dateSet.add(s.date));
  topicHistory.forEach((t) => {
    const d = t.updatedAt.slice(0, 10);
    if (d) dateSet.add(d);
  });
  xpEvents.forEach((e) => {
    const d = e.createdAt.slice(0, 10);
    if (d) dateSet.add(d);
  });

  // Also add last 7 days so recent days always appear
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dateSet.add(d.toISOString().slice(0, 10));
  }

  const entries: JournalEntry[] = [];

  for (const date of dateSet) {
    // Topics active on this day from sessions
    const dayTopics = new Set<string>();
    let dayMinutes = 0;
    sessions.filter((s) => s.date === date).forEach((s) => {
      dayTopics.add(s.topic);
      dayMinutes += s.minutes;
    });

    // Topics from history updated this day
    topicHistory
      .filter((t) => t.updatedAt.slice(0, 10) === date)
      .forEach((t) => dayTopics.add(t.slug));

    // XP events for this day
    const dayXPEvents = xpEvents.filter((e) => e.createdAt.slice(0, 10) === date);
    const dayXP = dayXPEvents.reduce((sum, e) => sum + e.amount, 0);
    const dayQuizzes = dayXPEvents.filter(
      (e) => e.source.includes("quiz") || e.source.includes("teachback")
    ).length;

    // Add topics from XP events
    dayXPEvents.forEach((e) => {
      if (e.topicSlug) dayTopics.add(e.topicSlug);
    });

    const topics = Array.from(dayTopics);
    const base = { date, topics, xpEarned: dayXP, minutesSpent: dayMinutes, quizzes: dayQuizzes };

    entries.push({
      ...base,
      dateLabel: formatDateLabel(date),
      narrative: generateNarrative(base),
      mood: getMood(base),
    });
  }

  // Sort most recent first
  entries.sort((a, b) => b.date.localeCompare(a.date));
  return entries;
}

/* ─── Calendar grid ─── */
function CalendarView({ entries, currentMonth, onChangeMonth }: {
  entries: JournalEntry[];
  currentMonth: Date;
  onChangeMonth: (d: Date) => void;
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();

  const activeDates = new Set(entries.filter((e) => e.topics.length > 0).map((e) => e.date));
  const today = new Date().toISOString().slice(0, 10);

  const monthLabel = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    const d = new Date(year, month - 1, 1);
    onChangeMonth(d);
  };
  const nextMonth = () => {
    const d = new Date(year, month + 1, 1);
    onChangeMonth(d);
  };

  return (
    <div className="w-full">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="text-white/40 hover:text-white/70 transition-colors text-sm font-sans px-2 py-1">
          &larr;
        </button>
        <span className="text-white/70 font-sans text-sm font-medium">{monthLabel}</span>
        <button onClick={nextMonth} className="text-white/40 hover:text-white/70 transition-colors text-sm font-sans px-2 py-1">
          &rarr;
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-[10px] text-white/25 font-sans">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isActive = activeDates.has(dateStr);
          const isToday = dateStr === today;

          return (
            <motion.div
              key={dateStr}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-sans relative transition-colors ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/[0.02] text-white/25 border border-transparent"
              } ${isToday ? "ring-1 ring-emerald-400/40" : ""}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.008 }}
            >
              {day}
              {isActive && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function JournalPage() {
  const { data } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sessions, topicHistory, xpEvents] = await Promise.all([
          Promise.resolve(loadLearningSessions()),
          data.getTopicHistory(),
          data.getXPHistory(90),
        ]);
        const built = buildJournalEntries(sessions, topicHistory, xpEvents);
        setEntries(built);
      } catch {
        // Fallback: build from localStorage only
        const sessions = loadLearningSessions();
        const guestTopics = loadGuestTopicKeys();
        const topicHistory: TopicHistoryItem[] = guestTopics.map((t) => ({
          slug: t.slug,
          topicName: t.topicName,
          lang: "en",
          maxLevel: 0,
          updatedAt: new Date().toISOString(),
        }));
        const built = buildJournalEntries(sessions, topicHistory, []);
        setEntries(built);
      }
      setLoading(false);
    }
    load();
  }, [data]);

  const activeDays = useMemo(() => entries.filter((e) => e.topics.length > 0).length, [entries]);
  const totalXP = useMemo(() => entries.reduce((sum, e) => sum + e.xpEarned, 0), [entries]);

  return (
    <PageTransition>
    <main className="min-h-screen flex flex-col items-center px-4 pt-12 sm:pt-16 pb-24 relative">
      {/* Header */}
      <motion.div
        className="text-center mb-8 max-w-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-display text-4xl sm:text-5xl text-white mb-3">
          {"\uD83D\uDCD3"} Learning Journal
        </h1>
        <p className="text-white/35 text-sm sm:text-base font-serif">
          Your learning story, written day by day
        </p>

        {/* Quick stats */}
        {!loading && activeDays > 0 && (
          <motion.div
            className="flex items-center justify-center gap-4 mt-4 text-xs font-sans text-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span>
              <span className="text-white/60 font-mono">{activeDays}</span> active days
            </span>
            <span className="text-white/10">{"\u00B7"}</span>
            <span>
              <span className="text-white/60 font-mono">{totalXP}</span> XP earned
            </span>
            <span className="text-white/10">{"\u00B7"}</span>
            <span>
              <span className="text-white/60 font-mono">{entries.length}</span> entries
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* View toggle */}
      <motion.div
        className="flex items-center gap-1 mb-6 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <button
          onClick={() => setView("list")}
          className={`px-4 py-1.5 rounded-lg text-sm font-sans transition-all ${
            view === "list"
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          {"\uD83D\uDCDC"} Entries
        </button>
        <button
          onClick={() => setView("calendar")}
          className={`px-4 py-1.5 rounded-lg text-sm font-sans transition-all ${
            view === "calendar"
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          {"\uD83D\uDCC5"} Calendar
        </button>
      </motion.div>

      <div className="w-full max-w-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              className="w-6 h-6 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : view === "calendar" ? (
          <motion.div
            className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CalendarView entries={entries} currentMonth={calMonth} onChangeMonth={setCalMonth} />
          </motion.div>
        ) : entries.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl mb-4">{"\uD83D\uDCD6"}</div>
            <p className="text-white/40 font-serif text-lg mb-2">Your journal is empty</p>
            <p className="text-white/25 font-sans text-sm">
              Start exploring topics and your story will write itself.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.date}
                  className={`p-5 rounded-2xl border transition-colors ${
                    entry.topics.length > 0
                      ? "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12]"
                      : "border-white/[0.04] bg-white/[0.01]"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  {/* Date header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white/70 text-sm font-sans font-medium">
                      {entry.dateLabel}
                    </h3>
                    <span className={`text-xs font-sans flex items-center gap-1 ${entry.mood.color}`}>
                      <span>{entry.mood.emoji}</span>
                      {entry.mood.label}
                    </span>
                  </div>

                  {/* Narrative */}
                  <p className="text-white/55 font-serif text-[15px] leading-relaxed mb-4 italic">
                    {entry.narrative}
                  </p>

                  {/* Topic pills */}
                  {entry.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {entry.topics.map((topic) => (
                        <span
                          key={topic}
                          className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400/70 text-[11px] font-sans border border-emerald-500/15"
                        >
                          {topic.replace(/-/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats row */}
                  {(entry.xpEarned > 0 || entry.minutesSpent > 0) && (
                    <div className="flex items-center gap-3 text-[11px] font-sans text-white/25">
                      {entry.xpEarned > 0 && (
                        <span>
                          {"\u2728"}{" "}
                          <span className="text-white/40 font-mono">{entry.xpEarned}</span> XP
                        </span>
                      )}
                      {entry.minutesSpent > 0 && (
                        <span>
                          {"\u23F1\uFE0F"}{" "}
                          <span className="text-white/40 font-mono">{formatTime(entry.minutesSpent)}</span>
                        </span>
                      )}
                      {entry.quizzes > 0 && (
                        <span>
                          {"\uD83C\uDFAF"}{" "}
                          <span className="text-white/40 font-mono">{entry.quizzes}</span>{" "}
                          {entry.quizzes === 1 ? "quiz" : "quizzes"}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
      </PageTransition>
  );
}
