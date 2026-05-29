"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { XP_LEVELS } from "@/lib/xp";

interface LeaderboardEntry {
  id: string;
  display_name: string;
  xp: number;
  streak_count: number;
  rank: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string | null;
  userRank?: number | null;
  userEntry?: LeaderboardEntry | null;
  period?: "all" | "month" | "week";
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
  if (rank === 1) return "\u{1F947}";
  if (rank === 2) return "\u{1F948}";
  if (rank === 3) return "\u{1F949}";
  return `#${rank}`;
}

function getTopCrown(rank: number): string | null {
  if (rank === 1) return "\u{1F451}";
  if (rank === 2) return "\u2B50";
  if (rank === 3) return "\u{1F31F}";
  return null;
}

export default function LeaderboardTable({
  entries,
  currentUserId,
  userRank,
  userEntry,
  period = "all",
}: LeaderboardTableProps) {
  const router = useRouter();
  const isSeasonView = period !== "all";

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => {
        const rank = entry.rank;
        const isTop3 = rank <= 3;
        const isCurrentUser = currentUserId && entry.id === currentUserId;
        const crown = getTopCrown(rank);

        return (
          <motion.button
            key={entry.id || i}
            onClick={() => router.push(`/profile/${entry.id}`)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border transition-all text-left ${
              isCurrentUser
                ? "border-emerald-500/20 bg-emerald-500/5"
                : isTop3
                ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15"
                : "border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/10"
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
            <div className="relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-sans font-medium shrink-0 ${
                  isTop3
                    ? "bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-white/80 border border-white/10"
                    : "bg-white/5 text-white/40"
                }`}
              >
                {entry.display_name.charAt(0).toUpperCase()}
              </div>
              {crown && (
                <span className="absolute -top-2 -right-1 text-[10px]">{crown}</span>
              )}
            </div>

            {/* Name + title */}
            <div className="flex-1 min-w-0">
              <div className="text-white/80 text-sm font-sans truncate">
                {entry.display_name}
                {isCurrentUser && (
                  <span className="text-emerald-400/60 text-xs ml-1.5">(you)</span>
                )}
              </div>
              {!isSeasonView && (
                <div className="text-white/25 text-xs font-mono">
                  {getTitle(entry.xp)}
                </div>
              )}
            </div>

            {/* Streak */}
            {entry.streak_count > 0 && (
              <div className="text-orange-400/60 font-mono text-xs">
                {"\u{1F525}"}{entry.streak_count}
              </div>
            )}

            {/* XP */}
            <div className="text-emerald-400 font-mono text-sm tabular-nums">
              {entry.xp.toLocaleString()} XP
            </div>

            {/* Arrow hint */}
            <span className="text-white/10 text-xs">{"\u2192"}</span>
          </motion.button>
        );
      })}

      {/* Current user rank (if not in top 50) */}
      {userRank && userRank > entries.length && userEntry && (
        <>
          <div className="text-center text-white/15 font-mono text-xs py-2">
            {"\u00B7"} {"\u00B7"} {"\u00B7"}
          </div>
          <motion.button
            onClick={() => router.push(`/profile/${userEntry.id}`)}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="w-10 text-center font-mono text-sm text-emerald-400">
              #{userRank}
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-sans font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 shrink-0">
              {userEntry.display_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-emerald-300 text-sm font-sans truncate">
                {userEntry.display_name} (you)
              </div>
              {!isSeasonView && (
                <div className="text-emerald-400/40 text-xs font-mono">
                  {getTitle(userEntry.xp)}
                </div>
              )}
            </div>
            {userEntry.streak_count > 0 && (
              <div className="text-orange-400/60 font-mono text-xs">
                {"\u{1F525}"}{userEntry.streak_count}
              </div>
            )}
            <div className="text-emerald-400 font-mono text-sm tabular-nums">
              {userEntry.xp.toLocaleString()} XP
            </div>
          </motion.button>
        </>
      )}

      {entries.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">
            {isSeasonView ? "\u{1F3AF}" : "\u{1F3C6}"}
          </div>
          <p className="text-white/30 font-sans text-sm">
            {isSeasonView
              ? "No one has earned XP this period yet."
              : "No learners on the leaderboard yet."}
          </p>
          <p className="text-white/20 font-sans text-xs mt-1">
            {isSeasonView
              ? "Be the first to claim the top spot!"
              : "Sign up and start learning to claim the top spot!"}
          </p>
        </div>
      )}
    </div>
  );
}
