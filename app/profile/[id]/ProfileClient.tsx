"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BadgeCard from "@/components/BadgeCard";
import { checkBadges } from "@/lib/badges";
import type { Badge, BadgeCheckData } from "@/lib/badges";
import PageTransition from "@/components/PageTransition";
import FollowButton from "@/components/FollowButton";
import { useAuth } from "@/components/AuthProvider";

interface ProfileData {
  profile: {
    id: string;
    displayName: string;
    totalXP: number;
    streakCount: number;
    avatarUrl: string | null;
    level: number;
    title: string;
    rank: number;
    joinedAt: string;
  };
  topics: { slug: string; name: string; maxLevel: number; lang: string }[];
  topTopics: { slug: string; name: string; maxLevel: number; lang: string }[];
  badgeData: BadgeCheckData;
  activity: { date: string; count: number }[];
  stats: {
    totalXP: number;
    streak: number;
    topicsCount: number;
    badgesCount: number;
  };
}

const LEVEL_COLORS = ["#4ade80", "#facc15", "#fb923c", "#f472b6", "#a78bfa"];

const BANNER_GRADIENTS: Record<string, { from: string; to: string }> = {
  emerald: { from: "#059669", to: "#34d399" },
  blue: { from: "#2563eb", to: "#60a5fa" },
  purple: { from: "#7c3aed", to: "#a78bfa" },
  pink: { from: "#db2777", to: "#f472b6" },
  amber: { from: "#d97706", to: "#fbbf24" },
  red: { from: "#dc2626", to: "#f87171" },
  cyan: { from: "#0891b2", to: "#22d3ee" },
  rose: { from: "#e11d48", to: "#fb7185" },
  indigo: { from: "#4f46e5", to: "#818cf8" },
  teal: { from: "#0d9488", to: "#2dd4bf" },
  sunset: { from: "#ea580c", to: "#fbbf24" },
  galaxy: { from: "#6d28d9", to: "#ec4899" },
};

// ── Inline heatmap for profile (server data driven) ──
function ProfileHeatmap({ activity }: { activity: { date: string; count: number }[] }) {
  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of activity) {
      map.set(a.date, a.count);
    }
    return map;
  }, [activity]);

  const { days, grid } = useMemo(() => {
    const d: string[] = [];
    const today = new Date();
    const weeks = 16;
    const start = new Date(today);
    start.setDate(start.getDate() - (weeks * 7 - 1));
    for (let dt = new Date(start); dt <= today; dt.setDate(dt.getDate() + 1)) {
      d.push(dt.toISOString().split("T")[0]);
    }

    const cols: string[][] = [];
    let currentCol: string[] = [];
    const firstDow = new Date(d[0]).getDay();
    for (let i = 0; i < firstDow; i++) currentCol.push("");
    for (const day of d) {
      const dow = new Date(day).getDay();
      if (dow === 0 && currentCol.length > 0) {
        cols.push(currentCol);
        currentCol = [];
      }
      currentCol.push(day);
    }
    if (currentCol.length > 0) {
      while (currentCol.length < 7) currentCol.push("");
      cols.push(currentCol);
    }

    return { days: d, grid: cols };
  }, []);

  function getColor(count: number): string {
    if (count === 0) return "rgba(255,255,255,0.04)";
    if (count === 1) return "rgba(52,211,153,0.25)";
    if (count === 2) return "rgba(52,211,153,0.45)";
    if (count <= 4) return "rgba(52,211,153,0.65)";
    return "rgba(52,211,153,1)";
  }

  const totalActive = days.filter((d) => (activityMap.get(d) || 0) > 0).length;

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-3">
        <span className="text-white/30 text-xs font-sans">{totalActive} active days</span>
      </div>
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="inline-flex gap-[1px]">
          {grid.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-[1px]">
              {col.map((day, rowIdx) => (
                <div
                  key={`${colIdx}-${rowIdx}`}
                  className="w-[11px] h-[11px] rounded-[2px] transition-colors duration-150"
                  title={day ? `${activityMap.get(day) || 0} activities on ${day}` : undefined}
                  style={{
                    backgroundColor: day
                      ? getColor(activityMap.get(day) || 0)
                      : "transparent",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-[9px] text-white/20 font-sans">Less</span>
        {[0, 1, 2, 3, 5].map((count) => (
          <div
            key={count}
            className="w-[10px] h-[10px] rounded-[2px]"
            style={{ backgroundColor: getColor(count) }}
          />
        ))}
        <span className="text-[9px] text-white/20 font-sans">More</span>
      </div>
    </div>
  );
}

// ── Main profile client component ──
export default function ProfileClient() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { user } = useAuth();

  const [data, setData] = useState<ProfileData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Try to read the viewed user's profile_custom from localStorage (only works for own profile)
  const [bannerGradient, setBannerGradient] = useState(BANNER_GRADIENTS.emerald);
  const [avatarEmoji, setAvatarEmoji] = useState("");
  const [bio, setBio] = useState("");
  const [activeTitle, setActiveTitle] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/profile/${userId}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
        const allBadges = checkBadges(d.badgeData);
        setBadges(allBadges);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [userId]);

  // Check admin status — only runs when viewing your own profile
  useEffect(() => {
    if (!user || user.id !== userId) return;
    fetch("/api/admin/check")
      .then((res) => setIsAdmin(res.ok))
      .catch(() => {});
  }, [user, userId]);

  // Load profile customization from localStorage (matches current viewer's stored data for that user)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("tmi10_profile_custom");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only apply customization if this is the viewer's own profile
        const authRaw = localStorage.getItem("sb-auth-token") || "";
        let currentUserId = "";
        try {
          // Try to get user id from supabase session
          const sessions = JSON.parse(localStorage.getItem("sb-auth-token") || "null");
          if (sessions?.user?.id) currentUserId = sessions.user.id;
        } catch { /* guest */ }
        // For guest users, check if the profile_custom applies
        if (!currentUserId || currentUserId === userId) {
          if (parsed.bannerId && BANNER_GRADIENTS[parsed.bannerId]) {
            setBannerGradient(BANNER_GRADIENTS[parsed.bannerId]);
          }
          if (parsed.avatar) setAvatarEmoji(parsed.avatar);
          if (parsed.bio) setBio(parsed.bio);
        }
      }
      const title = localStorage.getItem("tmi10_active_title");
      if (title) setActiveTitle(title);
    } catch { /* */ }
  }, [userId]);

  async function handleShare() {
    const url = `${window.location.origin}/profile/${userId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data?.profile.displayName} on Teach Me Like I'm 10`,
          text: `Check out ${data?.profile.displayName}'s learning profile!`,
          url,
        });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white/30 font-mono text-sm animate-pulse">Loading profile...</div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400/60 font-mono text-sm">{error || "Profile not found"}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-white/30 text-sm font-sans hover:text-white/50"
          >
            Go home
          </button>
        </div>
      </main>
    );
  }

  const { profile, topTopics, activity } = data;
  const earnedBadges = badges.filter((b) => b.earned);
  const unearnedBadges = badges.filter((b) => !b.earned);
  const joinDate = new Date(profile.joinedAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Find active title definition
  const TITLES_MAP: Record<string, { emoji: string; name: string; color: string }> = {
    first_steps: { emoji: "\uD83D\uDC23", name: "First Steps", color: "#4ade80" },
    curious_cat: { emoji: "\uD83D\uDC31", name: "Curious Cat", color: "#f59e0b" },
    science_wizard: { emoji: "\uD83E\uDDEA", name: "Science Wizard", color: "#06b6d4" },
    history_buff: { emoji: "\uD83C\uDFDB\uFE0F", name: "History Buff", color: "#d97706" },
    night_owl: { emoji: "\uD83E\uDD89", name: "Night Owl", color: "#7c3aed" },
    early_bird: { emoji: "\uD83D\uDC26", name: "Early Bird", color: "#f97316" },
    speed_demon: { emoji: "\u26A1", name: "Speed Demon", color: "#eab308" },
    quiz_master: { emoji: "\uD83C\uDFAF", name: "Quiz Master", color: "#ec4899" },
    streak_star: { emoji: "\u2B50", name: "Streak Star", color: "#ef4444" },
    deep_diver: { emoji: "\uD83E\uDD3F", name: "Deep Diver", color: "#8b5cf6" },
    bookworm: { emoji: "\uD83D\uDCDA", name: "Bookworm", color: "#a855f7" },
    social_butterfly: { emoji: "\uD83E\uDD8B", name: "Social Butterfly", color: "#14b8a6" },
    explorer: { emoji: "\uD83E\uDDED", name: "Explorer", color: "#c084fc" },
    risk_taker: { emoji: "\uD83C\uDFB2", name: "Risk Taker", color: "#f43f5e" },
    perfectionist: { emoji: "\uD83D\uDC8E", name: "Perfectionist", color: "#0ea5e9" },
    marathon_learner: { emoji: "\uD83C\uDFC3", name: "Marathon Learner", color: "#10b981" },
    polymath: { emoji: "\uD83E\uDDE0", name: "Polymath", color: "#6366f1" },
    comeback_kid: { emoji: "\uD83D\uDD25", name: "Comeback Kid", color: "#fb923c" },
    centurion: { emoji: "\uD83D\uDCAF", name: "Centurion", color: "#facc15" },
    knowledge_hoarder: { emoji: "\uD83D\uDC32", name: "Knowledge Hoarder", color: "#22d3ee" },
    streak_legend: { emoji: "\uD83D\uDE80", name: "Streak Legend", color: "#f472b6" },
    quiz_rookie: { emoji: "\u2705", name: "Quiz Rookie", color: "#34d399" },
  };

  const titleInfo = activeTitle ? TITLES_MAP[activeTitle] : null;

  const statsItems = [
    { label: "Total XP", value: profile.totalXP.toLocaleString(), color: "emerald" },
    { label: "Day Streak", value: profile.streakCount, color: "orange" },
    { label: "Topics", value: data.stats.topicsCount, color: "blue" },
    { label: "Badges", value: earnedBadges.length, color: "purple" },
  ];

  const colorMap: Record<string, { border: string; bg: string; text: string }> = {
    emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/5", text: "text-emerald-400" },
    orange: { border: "border-orange-500/20", bg: "bg-orange-500/5", text: "text-orange-400" },
    blue: { border: "border-blue-500/20", bg: "bg-blue-500/5", text: "text-blue-400" },
    purple: { border: "border-purple-500/20", bg: "bg-purple-500/5", text: "text-purple-400" },
  };

  return (
    <PageTransition>
      <main className="min-h-screen max-w-2xl mx-auto px-4 sm:px-6 pb-24">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4 pb-4"
        >
          <button
            onClick={() => router.push("/")}
            className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans inline-block"
          >
            &larr; Home
          </button>
        </motion.div>

        {/* Profile Banner */}
        <motion.div
          className="relative w-full h-24 sm:h-28 rounded-2xl overflow-hidden mb-4 sm:mb-5"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          style={{
            background: `linear-gradient(135deg, ${bannerGradient.from}, ${bannerGradient.to})`,
          }}
        >
          {/* Subtle dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
          {/* Rank badge */}
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/30 backdrop-blur-sm border border-white/10">
            <span className="text-white/80 text-xs font-mono">Rank #{profile.rank}</span>
          </div>
        </motion.div>

        {/* Avatar + Name section */}
        <motion.div
          className="relative z-10 text-center mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Avatar */}
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full border-[3px] border-[#0a0f1a] mx-auto"
            style={{
              background: `linear-gradient(135deg, ${bannerGradient.from}35, ${bannerGradient.to}20)`,
              boxShadow: `0 0 20px ${bannerGradient.from}30`,
            }}
          >
            {avatarEmoji ? (
              <span className="text-3xl">{avatarEmoji}</span>
            ) : (
              <span
                className="text-3xl font-display"
                style={{ color: bannerGradient.from }}
              >
                {profile.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Display name */}
          <h1 className="font-display text-3xl text-white mt-3 mb-1">{profile.displayName}</h1>

          {/* Title / Flair */}
          {titleInfo ? (
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span
                className="inline-flex items-center gap-1 px-3 py-0.5 rounded-lg text-xs font-sans font-medium"
                style={{
                  border: `1.5px solid ${titleInfo.color}40`,
                  background: `${titleInfo.color}10`,
                  color: titleInfo.color,
                }}
              >
                <span>{titleInfo.emoji}</span>
                <span>{titleInfo.name}</span>
              </span>
            </div>
          ) : (
            <p className="text-white/30 font-mono text-sm mb-1">
              Level {profile.level} &middot; {profile.title}
            </p>
          )}

          {/* Bio */}
          {bio && (
            <p className="text-white/40 font-sans text-sm italic mt-1 max-w-md mx-auto">
              &ldquo;{bio}&rdquo;
            </p>
          )}

          <p className="text-white/20 font-sans text-xs mt-2">
            Joined {joinDate}
          </p>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <FollowButton targetUserId={userId} />
            <button
              onClick={handleShare}
              className="px-4 py-1.5 rounded-lg border border-white/10 text-white/30 font-mono text-xs hover:bg-white/5 hover:text-white/50 transition-all card-hover"
            >
              {copied ? "COPIED!" : "SHARE PROFILE"}
            </button>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/8 text-emerald-400 font-mono text-xs hover:bg-emerald-500/15 hover:border-emerald-500/50 transition-all"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                ADMIN
              </Link>
            )}
          </div>
        </motion.div>

        {/* Stats Row — 4-column grid with glassmorphism */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {statsItems.map((stat) => {
            const c = colorMap[stat.color];
            return (
              <div
                key={stat.label}
                className={`p-4 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] text-center card-hover`}
              >
                <p className={`${c.text} text-2xl font-mono font-bold`}>{stat.value}</p>
                <p className="text-white/30 text-xs font-sans mt-1">{stat.label}</p>
              </div>
            );
          })}
        </motion.div>

        {/* Activity Heatmap */}
        {activity && activity.length > 0 && (
          <motion.div
            className="p-5 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-white font-display text-lg mb-4">Activity</h2>
            <ProfileHeatmap activity={activity} />
          </motion.div>
        )}

        {/* Top Topics */}
        {topTopics.length > 0 && (
          <motion.div
            className="p-5 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h2 className="text-white font-display text-lg mb-4">
              Top Topics
              <span className="text-white/30 text-sm font-sans ml-2">
                {topTopics.length} best
              </span>
            </h2>
            <div className="space-y-3">
              {topTopics.map((topic, i) => (
                <motion.button
                  key={`${topic.slug}-${topic.lang}`}
                  onClick={() => router.push(`/learn/${topic.slug}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all text-left card-hover"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.04 }}
                >
                  <span className="text-white/70 font-serif text-sm flex-1 truncate">
                    {topic.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Level progress bar */}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className="w-5 h-1.5 rounded-full transition-colors"
                          style={{
                            backgroundColor:
                              lvl <= topic.maxLevel
                                ? LEVEL_COLORS[lvl - 1]
                                : "rgba(255,255,255,0.08)",
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-white/20 text-[10px] font-mono w-6 text-right">
                      {topic.maxLevel}/5
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Badges Earned */}
        <motion.div
          className="p-5 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-white font-display text-lg mb-4">
            Badges
            <span className="text-white/30 text-sm font-sans ml-2">
              {earnedBadges.length}/{badges.length} earned
            </span>
          </h2>
          {earnedBadges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
              {earnedBadges.map((badge, i) => (
                <BadgeCard key={badge.id} badge={badge} index={i} />
              ))}
            </div>
          ) : (
            <p className="text-white/20 text-sm font-sans mb-4">No badges earned yet</p>
          )}
          {/* Unearned badges — grayed out */}
          {unearnedBadges.length > 0 && (
            <>
              <div className="border-t border-white/[0.06] my-4" />
              <p className="text-white/15 text-xs font-sans mb-3">Locked</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {unearnedBadges.map((badge, i) => (
                  <BadgeCard key={badge.id} badge={badge} index={i + earnedBadges.length} />
                ))}
              </div>
            </>
          )}
        </motion.div>
      </main>
    </PageTransition>
  );
}
