"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TITLES,
  useEarnedTitles,
  useActiveTitle,
  TitleBadge,
  TitleSelector,
  type Title,
} from "./TitleFlair";

// Progress hints for locked titles
const PROGRESS_HINTS: Record<string, (ctx: Record<string, number | boolean>) => string> = {
  first_steps: () => "Complete your first topic to unlock",
  curious_cat: (ctx) => `${Math.min(ctx.topicsLearned as number, 5)}/5 topics learned`,
  science_wizard: (ctx) => `${Math.min(ctx.scienceTopics as number, 3)}/3 science topics`,
  history_buff: (ctx) => `${Math.min(ctx.historyTopics as number, 3)}/3 history topics`,
  night_owl: () => "Learn something after 10pm",
  early_bird: () => "Learn something before 7am",
  speed_demon: () => "Complete a speed run",
  quiz_master: (ctx) => `${Math.min(ctx.quizzesPerfect as number, 5)}/5 perfect quizzes`,
  streak_star: (ctx) => `${Math.min(ctx.streakDays as number, 7)}/7 day streak`,
  deep_diver: (ctx) => `Max level: ${ctx.maxLevelReached}/5`,
  bookworm: (ctx) => `${Math.min(ctx.bookmarksCount as number, 10)}/10 bookmarks`,
  social_butterfly: (ctx) => `${Math.min(ctx.followingCount as number, 5)}/5 people followed`,
  explorer: () => "Use the Explore feature",
  risk_taker: () => "Wager XP on a quiz",
  perfectionist: (ctx) => `${Math.min(ctx.perfectStreak as number, 3)}/3 perfect quizzes in a row`,
  marathon_learner: (ctx) => `${Math.min(ctx.minutesStudiedToday as number, 60)}/60 min studied today`,
  polymath: (ctx) => `${Math.min(ctx.categoriesLearned as number, 5)}/5 categories`,
  comeback_kid: () => "Recover a lost streak",
  centurion: (ctx) => `${Math.min(ctx.xpToday as number, 100)}/100 XP today`,
  knowledge_hoarder: (ctx) => `${Math.min(ctx.topicsLearned as number, 20)}/20 topics`,
  streak_legend: (ctx) => `${Math.min(ctx.streakDays as number, 30)}/30 day streak`,
  quiz_rookie: (ctx) => `${Math.min(ctx.quizzesPerfect as number, 1)}/1 perfect quiz`,
};

export default function TitleShowcase() {
  const { earned, context } = useEarnedTitles();
  const [activeTitle, setActive] = useActiveTitle();
  const [selectorOpen, setSelectorOpen] = useState(false);

  const earnedIds = new Set(earned.map((t) => t.id));

  function getHint(title: Title): string {
    const hintFn = PROGRESS_HINTS[title.id];
    if (!hintFn || !context) return title.description;
    return hintFn(context as unknown as Record<string, number | boolean>);
  }

  return (
    <div>
      {/* Active title display */}
      {activeTitle && (
        <div className="mb-6 flex items-center gap-3">
          <span className="text-white/30 text-xs font-sans">Active title:</span>
          <TitleBadge title={activeTitle} size="md" onClick={() => setSelectorOpen(true)} />
        </div>
      )}

      {!activeTitle && earned.length > 0 && (
        <button
          onClick={() => setSelectorOpen(true)}
          className="mb-6 px-4 py-2 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 text-emerald-400/60 text-xs font-sans hover:bg-emerald-500/10 hover:text-emerald-400 transition-all"
        >
          + Choose a title to display
        </button>
      )}

      {/* Title grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {TITLES.map((title, i) => {
          const isEarned = earnedIds.has(title.id);
          const isActive = activeTitle?.id === title.id;

          return (
            <motion.button
              key={title.id}
              onClick={() => {
                if (isEarned) {
                  setActive(title.id);
                }
              }}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center ${
                isEarned
                  ? "cursor-pointer hover:scale-[1.03]"
                  : "cursor-default"
              } ${
                isActive
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : isEarned
                  ? "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                  : "border-white/5 bg-white/[0.01]"
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              style={
                isEarned
                  ? {
                      boxShadow: isActive
                        ? `0 0 20px ${title.color}20`
                        : `0 0 8px ${title.color}10`,
                    }
                  : undefined
              }
            >
              {/* Emoji / lock */}
              <span
                className={`text-3xl ${isEarned ? "" : "grayscale opacity-30"}`}
                style={isEarned ? undefined : { filter: "grayscale(1) brightness(0.5)" }}
              >
                {isEarned ? title.emoji : "?"}
              </span>

              {/* Title name */}
              <span
                className="text-xs font-sans font-medium leading-tight"
                style={{
                  color: isEarned ? title.color : "rgba(255,255,255,0.2)",
                }}
              >
                {isEarned ? title.name : "???"}
              </span>

              {/* Description or hint */}
              <span className="text-[10px] text-white/25 leading-tight">
                {isEarned ? title.description : getHint(title)}
              </span>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  <span className="text-[10px] text-emerald-400">{"\u2713"}</span>
                </motion.div>
              )}

              {/* Earned glow ring */}
              {isEarned && !isActive && (
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    border: `1px solid ${title.color}20`,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 text-center">
        <p className="text-white/20 text-xs font-sans">
          {earned.length} / {TITLES.length} titles earned
        </p>
      </div>

      {/* Selector modal */}
      <TitleSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        earnedTitles={earned}
        activeTitle={activeTitle}
        onSelect={setActive}
      />
    </div>
  );
}
