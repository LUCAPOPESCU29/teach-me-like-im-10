"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import BadgeCard from "@/components/BadgeCard";
import { checkBadges } from "@/lib/badges";
import type { Badge, BadgeCheckData } from "@/lib/badges";

interface ProfileData {
  profile: {
    id: string;
    displayName: string;
    totalXP: number;
    streakCount: number;
    level: number;
    title: string;
    rank: number;
    joinedAt: string;
  };
  topics: { slug: string; name: string; maxLevel: number; lang: string }[];
  badgeData: BadgeCheckData;
}

const LEVEL_COLORS = ["#4ade80", "#facc15", "#fb923c", "#f472b6", "#a78bfa"];

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [data, setData] = useState<ProfileData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/profile/${userId}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
        setBadges(checkBadges(d.badgeData));
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
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
      } catch {}
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

  const { profile, topics } = data;
  const earnedBadges = badges.filter((b) => b.earned);
  const joinDate = new Date(profile.joinedAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans mb-6 inline-block"
        >
          &larr; Home
        </button>
      </motion.div>

      {/* Profile header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Avatar circle with level */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 mb-4">
          <span className="text-3xl font-display text-emerald-400">
            {profile.displayName.charAt(0).toUpperCase()}
          </span>
        </div>

        <h1 className="font-display text-3xl text-white mb-1">{profile.displayName}</h1>
        <p className="text-white/30 font-mono text-sm mb-1">
          Level {profile.level} &middot; {profile.title}
        </p>
        <p className="text-white/20 font-sans text-xs">
          Joined {joinDate} &middot; Rank #{profile.rank}
        </p>

        <button
          onClick={handleShare}
          className="mt-4 px-4 py-1.5 rounded-lg border border-white/10 text-white/30 font-mono text-xs hover:bg-white/5 hover:text-white/50 transition-all"
        >
          {copied ? "COPIED!" : "SHARE PROFILE"}
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-3 gap-3 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center">
          <p className="text-emerald-400 text-2xl font-mono font-bold">{profile.totalXP}</p>
          <p className="text-white/30 text-xs font-sans mt-1">Total XP</p>
        </div>
        <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 text-center">
          <p className="text-orange-400 text-2xl font-mono font-bold">{profile.streakCount}</p>
          <p className="text-white/30 text-xs font-sans mt-1">Day Streak</p>
        </div>
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-center">
          <p className="text-blue-400 text-2xl font-mono font-bold">{topics.length}</p>
          <p className="text-white/30 text-xs font-sans mt-1">Topics</p>
        </div>
      </motion.div>

      {/* Earned badges */}
      {earnedBadges.length > 0 && (
        <motion.div
          className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-white font-display text-lg mb-4">
            Badges
            <span className="text-white/30 text-sm font-sans ml-2">
              {earnedBadges.length} earned
            </span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {earnedBadges.map((badge, i) => (
              <BadgeCard key={badge.id} badge={badge} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Topics explored */}
      {topics.length > 0 && (
        <motion.div
          className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-white font-display text-lg mb-4">Topics Explored</h2>
          <div className="space-y-2">
            {topics.map((topic, i) => (
              <motion.button
                key={`${topic.slug}-${topic.lang}`}
                onClick={() => router.push(`/learn/${topic.slug}`)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all text-left"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.03 }}
              >
                <span className="text-white/70 font-serif text-sm flex-1">{topic.name}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          lvl <= topic.maxLevel
                            ? LEVEL_COLORS[lvl - 1]
                            : "rgba(255,255,255,0.08)",
                      }}
                    />
                  ))}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </main>
  );
}
