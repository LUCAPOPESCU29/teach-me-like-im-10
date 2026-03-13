"use client";

import { motion } from "framer-motion";
import { XP_LEVELS } from "@/lib/xp";

interface LeaderboardEntry {
  display_name: string;
  total_xp: number;
  streak_count: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string | null;
  userRank?: number | null;
  userEntry?: LeaderboardEntry | null;
}

function getTitle(xp: number): string {
  let title: string = XP_LEVELS[0].title;
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xp) {
      title = XP_LEVELS[i].title;
      break;
    }
  }
  return title;
}

function getRankStyle(rank: number): string {
  if (rank === 1) return "text-amber-400";
  if (rank === 2) return "text-slate-300";
  if (rank === 3) return "text-amber-600";
  return "text-white/30";
}

function getRankIcon(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export default function LeaderboardTable({
  entries,
  userRank,
  userEntry,
}: LeaderboardTableProps) {
  return (
    <div className="space-y-2">
      {entries.map((entry, i) => {
        const rank = i + 1;
        const isTop3 = rank <= 3;

        return (
          <motion.div
            key={i}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${
              isTop3
                ? "border-white/10 bg-white/[0.03]"
                : "border-white/5 bg-white/[0.01]"
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            {/* Rank */}
            <div className={`w-10 text-center font-mono text-sm ${getRankStyle(rank)}`}>
              {isTop3 ? (
                <span className="text-lg">{getRankIcon(rank)}</span>
              ) : (
                <span>{getRankIcon(rank)}</span>
              )}
            </div>

            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-sans font-medium ${
                isTop3
                  ? "bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-white/80 border border-white/10"
                  : "bg-white/5 text-white/40"
              }`}
            >
              {entry.display_name.charAt(0).toUpperCase()}
            </div>

            {/* Name + title */}
            <div className="flex-1 min-w-0">
              <div className="text-white/80 text-sm font-sans truncate">
                {entry.display_name}
              </div>
              <div className="text-white/25 text-xs font-mono">
                {getTitle(entry.total_xp)}
              </div>
            </div>

            {/* Streak */}
            {entry.streak_count > 0 && (
              <div className="text-orange-400/60 font-mono text-xs">
                🔥{entry.streak_count}
              </div>
            )}

            {/* XP */}
            <div className="text-emerald-400 font-mono text-sm tabular-nums">
              {entry.total_xp.toLocaleString()} XP
            </div>
          </motion.div>
        );
      })}

      {/* Current user rank (if not in top 50) */}
      {userRank && userRank > entries.length && userEntry && (
        <>
          <div className="text-center text-white/15 font-mono text-xs py-2">
            · · ·
          </div>
          <motion.div
            className="flex items-center gap-4 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="w-10 text-center font-mono text-sm text-emerald-400">
              #{userRank}
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-sans font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
              {userEntry.display_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-emerald-300 text-sm font-sans truncate">
                {userEntry.display_name} (you)
              </div>
              <div className="text-emerald-400/40 text-xs font-mono">
                {getTitle(userEntry.total_xp)}
              </div>
            </div>
            {userEntry.streak_count > 0 && (
              <div className="text-orange-400/60 font-mono text-xs">
                🔥{userEntry.streak_count}
              </div>
            )}
            <div className="text-emerald-400 font-mono text-sm tabular-nums">
              {userEntry.total_xp.toLocaleString()} XP
            </div>
          </motion.div>
        </>
      )}

      {entries.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-white/30 font-sans text-sm">
            No learners on the leaderboard yet.
          </p>
          <p className="text-white/20 font-sans text-xs mt-1">
            Sign up and start learning to claim the top spot!
          </p>
        </div>
      )}
    </div>
  );
}
