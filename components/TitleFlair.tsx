"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---- Title definitions ----

export interface Title {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  check: (ctx: TitleCheckContext) => boolean;
}

export interface TitleCheckContext {
  topicsLearned: number;
  scienceTopics: number;
  historyTopics: number;
  learnedAfter10pm: boolean;
  learnedBefore7am: boolean;
  completedSpeedRun: boolean;
  quizzesPerfect: number;
  streakDays: number;
  maxLevelReached: number;
  bookmarksCount: number;
  followingCount: number;
  usedExplore: boolean;
  wageredXP: boolean;
  perfectStreak: number; // consecutive 100% quizzes
  minutesStudiedToday: number;
  categoriesLearned: number;
  recoveredStreak: boolean;
  xpToday: number;
  completedFirstTopic: boolean;
}

const SCIENCE_KEYWORDS = [
  "physics", "chemistry", "biology", "science", "atom", "molecule", "cell",
  "dna", "evolution", "gravity", "quantum", "space", "planet", "star",
  "telescope", "microscope", "photosynthesis", "electricity", "magnet",
  "energy", "force", "wave", "light", "sound", "element", "periodic",
  "neuron", "brain", "ecosystem", "climate", "weather", "geology", "fossil",
];

const HISTORY_KEYWORDS = [
  "history", "ancient", "medieval", "renaissance", "revolution", "war",
  "empire", "civilization", "dynasty", "pharaoh", "roman", "greek",
  "viking", "samurai", "colonial", "independence", "constitution",
  "democracy", "monarchy", "egypt", "rome", "sparta", "aztec", "maya",
  "inca", "ottoman", "industrial", "cold war", "world war",
];

export const TITLES: Title[] = [
  {
    id: "first_steps",
    name: "First Steps",
    emoji: "\uD83D\uDC23",
    description: "Completed your first topic ever",
    color: "#4ade80",
    check: (ctx) => ctx.completedFirstTopic,
  },
  {
    id: "curious_cat",
    name: "Curious Cat",
    emoji: "\uD83D\uDC31",
    description: "Learned 5+ different topics",
    color: "#f59e0b",
    check: (ctx) => ctx.topicsLearned >= 5,
  },
  {
    id: "science_wizard",
    name: "Science Wizard",
    emoji: "\uD83E\uDDEA",
    description: "Learned 3+ science topics",
    color: "#06b6d4",
    check: (ctx) => ctx.scienceTopics >= 3,
  },
  {
    id: "history_buff",
    name: "History Buff",
    emoji: "\uD83C\uDFDB\uFE0F",
    description: "Learned 3+ history topics",
    color: "#d97706",
    check: (ctx) => ctx.historyTopics >= 3,
  },
  {
    id: "night_owl",
    name: "Night Owl",
    emoji: "\uD83E\uDD89",
    description: "Learned something after 10pm",
    color: "#7c3aed",
    check: (ctx) => ctx.learnedAfter10pm,
  },
  {
    id: "early_bird",
    name: "Early Bird",
    emoji: "\uD83D\uDC26",
    description: "Learned something before 7am",
    color: "#f97316",
    check: (ctx) => ctx.learnedBefore7am,
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    emoji: "\u26A1",
    description: "Completed a speed run",
    color: "#eab308",
    check: (ctx) => ctx.completedSpeedRun,
  },
  {
    id: "quiz_master",
    name: "Quiz Master",
    emoji: "\uD83C\uDFAF",
    description: "Aced 5+ quizzes with 100%",
    color: "#ec4899",
    check: (ctx) => ctx.quizzesPerfect >= 5,
  },
  {
    id: "streak_star",
    name: "Streak Star",
    emoji: "\u2B50",
    description: "Maintained a 7+ day streak",
    color: "#ef4444",
    check: (ctx) => ctx.streakDays >= 7,
  },
  {
    id: "deep_diver",
    name: "Deep Diver",
    emoji: "\uD83E\uDD3F",
    description: "Reached level 5 on any topic",
    color: "#8b5cf6",
    check: (ctx) => ctx.maxLevelReached >= 5,
  },
  {
    id: "bookworm",
    name: "Bookworm",
    emoji: "\uD83D\uDCDA",
    description: "Saved 10+ bookmarks",
    color: "#a855f7",
    check: (ctx) => ctx.bookmarksCount >= 10,
  },
  {
    id: "social_butterfly",
    name: "Social Butterfly",
    emoji: "\uD83E\uDD8B",
    description: "Followed 5+ people",
    color: "#14b8a6",
    check: (ctx) => ctx.followingCount >= 5,
  },
  {
    id: "explorer",
    name: "Explorer",
    emoji: "\uD83E\uDDED",
    description: "Used the Explore feature",
    color: "#c084fc",
    check: (ctx) => ctx.usedExplore,
  },
  {
    id: "risk_taker",
    name: "Risk Taker",
    emoji: "\uD83C\uDFB2",
    description: "Wagered XP on a quiz",
    color: "#f43f5e",
    check: (ctx) => ctx.wageredXP,
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    emoji: "\uD83D\uDC8E",
    description: "Got 100% on 3 quizzes in a row",
    color: "#0ea5e9",
    check: (ctx) => ctx.perfectStreak >= 3,
  },
  {
    id: "marathon_learner",
    name: "Marathon Learner",
    emoji: "\uD83C\uDFC3",
    description: "Studied for 60+ minutes in one day",
    color: "#10b981",
    check: (ctx) => ctx.minutesStudiedToday >= 60,
  },
  {
    id: "polymath",
    name: "Polymath",
    emoji: "\uD83E\uDDE0",
    description: "Learned topics in 5+ categories",
    color: "#6366f1",
    check: (ctx) => ctx.categoriesLearned >= 5,
  },
  {
    id: "comeback_kid",
    name: "Comeback Kid",
    emoji: "\uD83D\uDD25",
    description: "Recovered a streak after losing it",
    color: "#fb923c",
    check: (ctx) => ctx.recoveredStreak,
  },
  {
    id: "centurion",
    name: "Centurion",
    emoji: "\uD83D\uDCAF",
    description: "Earned 100+ XP in one day",
    color: "#facc15",
    check: (ctx) => ctx.xpToday >= 100,
  },
  {
    id: "knowledge_hoarder",
    name: "Knowledge Hoarder",
    emoji: "\uD83D\uDC32",
    description: "Learned 20+ topics total",
    color: "#22d3ee",
    check: (ctx) => ctx.topicsLearned >= 20,
  },
  {
    id: "streak_legend",
    name: "Streak Legend",
    emoji: "\uD83D\uDE80",
    description: "Maintained a 30+ day streak",
    color: "#f472b6",
    check: (ctx) => ctx.streakDays >= 30,
  },
  {
    id: "quiz_rookie",
    name: "Quiz Rookie",
    emoji: "\u2705",
    description: "Aced your first quiz with 100%",
    color: "#34d399",
    check: (ctx) => ctx.quizzesPerfect >= 1,
  },
];

// ---- localStorage helpers ----

const ACTIVE_TITLE_KEY = "tmi10_active_title";
const TITLE_DATA_KEY = "tmi10_title_data";

interface TitleData {
  learnedAfter10pm?: boolean;
  learnedBefore7am?: boolean;
  completedSpeedRun?: boolean;
  quizzesPerfect?: number;
  perfectStreak?: number;
  usedExplore?: boolean;
  wageredXP?: boolean;
  recoveredStreak?: boolean;
  xpToday?: number;
  xpTodayDate?: string;
  minutesStudiedToday?: number;
  minutesStudiedDate?: string;
  followingCount?: number;
}

function getTitleData(): TitleData {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TITLE_DATA_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTitleData(data: TitleData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TITLE_DATA_KEY, JSON.stringify(data));
}

/** Call this from quiz completions, speed runs, etc. to track title-related events */
export function recordTitleEvent(event: Partial<TitleData>) {
  const data = getTitleData();
  const today = new Date().toISOString().slice(0, 10);

  if (event.learnedAfter10pm) data.learnedAfter10pm = true;
  if (event.learnedBefore7am) data.learnedBefore7am = true;
  if (event.completedSpeedRun) data.completedSpeedRun = true;
  if (event.usedExplore) data.usedExplore = true;
  if (event.wageredXP) data.wageredXP = true;
  if (event.recoveredStreak) data.recoveredStreak = true;

  if (event.quizzesPerfect) {
    data.quizzesPerfect = (data.quizzesPerfect || 0) + event.quizzesPerfect;
    data.perfectStreak = (data.perfectStreak || 0) + 1;
  }

  if (event.followingCount !== undefined) {
    data.followingCount = event.followingCount;
  }

  // Track daily XP
  if (event.xpToday) {
    if (data.xpTodayDate !== today) {
      data.xpToday = event.xpToday;
      data.xpTodayDate = today;
    } else {
      data.xpToday = (data.xpToday || 0) + event.xpToday;
    }
  }

  // Track daily study minutes
  if (event.minutesStudiedToday) {
    if (data.minutesStudiedDate !== today) {
      data.minutesStudiedToday = event.minutesStudiedToday;
      data.minutesStudiedDate = today;
    } else {
      data.minutesStudiedToday = (data.minutesStudiedToday || 0) + event.minutesStudiedToday;
    }
  }

  saveTitleData(data);
}

/** Reset perfect streak when a quiz is not perfect */
export function resetPerfectStreak() {
  const data = getTitleData();
  data.perfectStreak = 0;
  saveTitleData(data);
}

function countMatchingTopics(slugs: string[], keywords: string[]): number {
  return slugs.filter((slug) =>
    keywords.some((kw) => slug.toLowerCase().includes(kw))
  ).length;
}

function guessCategoryFromSlug(slug: string): string {
  const s = slug.toLowerCase();
  if (SCIENCE_KEYWORDS.some((k) => s.includes(k))) return "science";
  if (HISTORY_KEYWORDS.some((k) => s.includes(k))) return "history";
  if (["math", "algebra", "geometry", "calculus", "number", "fraction", "equation"].some((k) => s.includes(k))) return "math";
  if (["art", "music", "painting", "drawing", "sculpture", "dance", "theater"].some((k) => s.includes(k))) return "arts";
  if (["code", "programming", "computer", "software", "algorithm", "python", "javascript", "html", "css", "web"].some((k) => s.includes(k))) return "tech";
  if (["language", "english", "spanish", "french", "german", "chinese", "japanese", "korean", "grammar", "writing"].some((k) => s.includes(k))) return "language";
  if (["geography", "country", "continent", "ocean", "mountain", "river", "map", "capital"].some((k) => s.includes(k))) return "geography";
  if (["philosophy", "ethics", "logic", "socrates", "plato", "aristotle"].some((k) => s.includes(k))) return "philosophy";
  if (["sport", "football", "soccer", "basketball", "tennis", "swimming", "olympic"].some((k) => s.includes(k))) return "sports";
  if (["cook", "food", "recipe", "baking", "cuisine", "nutrition"].some((k) => s.includes(k))) return "food";
  return "general";
}

// ---- Hook: useEarnedTitles ----

export function useEarnedTitles(): { earned: Title[]; all: Title[]; context: TitleCheckContext | null } {
  const [context, setContext] = useState<TitleCheckContext | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const titleData = getTitleData();
    const today = new Date().toISOString().slice(0, 10);

    // Gather topic slugs from localStorage
    const topicSlugs: string[] = [];
    const prefix = "tmi10_";
    const excluded = new Set([
      "tmi10_xp", "tmi10_streak", "tmi10_lang", "tmi10_bookmarks",
      "tmi10_badges", "tmi10_weekly_goal", "tmi10_weekly_goal_auth",
      "tmi10_active_title", "tmi10_title_data", "tmi10_easter_eggs",
      "tmi10_learning_time", "tmi10_study_stats", "tmi10_speedruns",
      "tmi10_explorations", "tmi10_combo_session", "tmi10_wop_stats",
      "tmi10_onboarding_done", "tmi10_freezes",
    ]);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && !excluded.has(key) && !key.startsWith("tmi10_notes_") && !key.startsWith("tmi10_daily_") && !key.startsWith("tmi10_challenge_")) {
        const slug = key.replace(prefix, "").replace(/^[a-z]{2}_/, "");
        topicSlugs.push(slug);
      }
    }

    // Check max level across topics
    let maxLevel = 0;
    for (const slug of topicSlugs) {
      try {
        const raw = localStorage.getItem(`${prefix}${slug}`) || localStorage.getItem(`${prefix}en_${slug}`);
        if (raw) {
          const levels = JSON.parse(raw);
          const topMax = Math.max(...levels.filter((l: { complete: boolean }) => l.complete).map((l: { level: number }) => l.level), 0);
          if (topMax > maxLevel) maxLevel = topMax;
        }
      } catch {}
    }

    // Bookmarks
    let bookmarksCount = 0;
    try {
      const raw = localStorage.getItem("tmi10_bookmarks");
      if (raw) bookmarksCount = JSON.parse(raw).length;
    } catch {}

    // Streak
    let streakDays = 0;
    try {
      const raw = localStorage.getItem("tmi10_streak");
      if (raw) {
        const streak = JSON.parse(raw);
        streakDays = streak.count || 0;
      }
    } catch {}

    // XP
    let totalXP = 0;
    try {
      const raw = localStorage.getItem("tmi10_xp");
      if (raw) totalXP = JSON.parse(raw).totalXP || JSON.parse(raw) || 0;
    } catch {}

    // Speed runs
    let completedSpeedRun = titleData.completedSpeedRun || false;
    try {
      const raw = localStorage.getItem("tmi10_speedruns");
      if (raw && JSON.parse(raw).length > 0) completedSpeedRun = true;
    } catch {}

    // Explore usage
    let usedExplore = titleData.usedExplore || false;
    try {
      const raw = localStorage.getItem("tmi10_explorations");
      if (raw && JSON.parse(raw).length > 0) usedExplore = true;
    } catch {}

    // Study time
    let minutesStudiedToday = titleData.minutesStudiedDate === today ? (titleData.minutesStudiedToday || 0) : 0;
    try {
      const raw = localStorage.getItem("tmi10_learning_time");
      if (raw) {
        const timeData = JSON.parse(raw);
        if (timeData[today]) {
          minutesStudiedToday = Math.max(minutesStudiedToday, Math.floor((timeData[today] || 0) / 60));
        }
      }
    } catch {}

    // Time of day checks
    const hour = new Date().getHours();
    let learnedAfter10pm = titleData.learnedAfter10pm || false;
    let learnedBefore7am = titleData.learnedBefore7am || false;
    if (hour >= 22) learnedAfter10pm = true;
    if (hour < 7) learnedBefore7am = true;

    // Categories
    const categories = new Set(topicSlugs.map(guessCategoryFromSlug));

    // XP today
    let xpToday = 0;
    if (titleData.xpTodayDate === today) {
      xpToday = titleData.xpToday || 0;
    }

    const ctx: TitleCheckContext = {
      topicsLearned: topicSlugs.length,
      scienceTopics: countMatchingTopics(topicSlugs, SCIENCE_KEYWORDS),
      historyTopics: countMatchingTopics(topicSlugs, HISTORY_KEYWORDS),
      learnedAfter10pm,
      learnedBefore7am,
      completedSpeedRun,
      quizzesPerfect: titleData.quizzesPerfect || 0,
      streakDays,
      maxLevelReached: maxLevel,
      bookmarksCount,
      followingCount: titleData.followingCount || 0,
      usedExplore,
      wageredXP: titleData.wageredXP || false,
      perfectStreak: titleData.perfectStreak || 0,
      minutesStudiedToday,
      categoriesLearned: categories.size,
      recoveredStreak: titleData.recoveredStreak || false,
      xpToday,
      completedFirstTopic: topicSlugs.length > 0,
    };

    // Persist time-of-day detections
    if (learnedAfter10pm !== titleData.learnedAfter10pm || learnedBefore7am !== titleData.learnedBefore7am) {
      recordTitleEvent({ learnedAfter10pm, learnedBefore7am });
    }

    setContext(ctx);
  }, []);

  const earned = context ? TITLES.filter((t) => t.check(context)) : [];

  return { earned, all: TITLES, context };
}

// ---- Hook: useActiveTitle ----

export function useActiveTitle(): [Title | null, (titleId: string) => void] {
  const [activeTitleId, setActiveTitleId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setActiveTitleId(localStorage.getItem(ACTIVE_TITLE_KEY));
  }, []);

  const setActive = useCallback((titleId: string) => {
    localStorage.setItem(ACTIVE_TITLE_KEY, titleId);
    setActiveTitleId(titleId);
  }, []);

  const activeTitle = activeTitleId ? TITLES.find((t) => t.id === activeTitleId) || null : null;

  return [activeTitle, setActive];
}

// ---- TitleBadge component ----

interface TitleBadgeProps {
  title: Title;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
}

export function TitleBadge({ title, size = "md", onClick, className = "" }: TitleBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-4 py-1.5 text-sm gap-2",
  };

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center rounded-lg font-sans font-medium transition-all duration-200 ${
        onClick ? "hover:scale-105 cursor-pointer" : "cursor-default"
      } ${sizeClasses[size]} ${className}`}
      style={{
        border: `1.5px solid ${title.color}40`,
        background: `${title.color}10`,
        color: title.color,
        boxShadow: `0 0 12px ${title.color}15`,
      }}
    >
      <span>{title.emoji}</span>
      <span>{title.name}</span>
    </button>
  );
}

// ---- TitleSelector modal ----

interface TitleSelectorProps {
  open: boolean;
  onClose: () => void;
  earnedTitles: Title[];
  activeTitle: Title | null;
  onSelect: (titleId: string) => void;
}

export function TitleSelector({ open, onClose, earnedTitles, activeTitle, onSelect }: TitleSelectorProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0f0a] p-6"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-display text-xl">Choose Your Title</h2>
              <button
                onClick={onClose}
                className="text-white/30 hover:text-white/60 transition-colors text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {earnedTitles.length === 0 ? (
              <p className="text-white/30 font-sans text-sm text-center py-8">
                No titles earned yet. Keep learning to unlock titles!
              </p>
            ) : (
              <div className="space-y-2">
                {earnedTitles.map((title) => (
                  <button
                    key={title.id}
                    onClick={() => {
                      onSelect(title.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                      activeTitle?.id === title.id
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="text-2xl">{title.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-medium text-sm" style={{ color: title.color }}>
                        {title.name}
                      </p>
                      <p className="text-white/30 text-xs font-sans truncate">{title.description}</p>
                    </div>
                    {activeTitle?.id === title.id && (
                      <span className="text-emerald-400 text-xs font-mono">ACTIVE</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
