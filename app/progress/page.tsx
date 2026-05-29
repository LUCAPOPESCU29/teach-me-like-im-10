"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import StreakCalendar from "@/components/StreakCalendar";
import XPChart from "@/components/XPChart";
import BadgeCard from "@/components/BadgeCard";
import { checkBadges } from "@/lib/badges";
import type { Badge } from "@/lib/badges";
import type { ActivityDay, XPEvent, TopicHistoryItem } from "@/lib/data";
import { XP_LEVELS } from "@/lib/xp";
import SolarSystem from "@/components/SolarSystem";
import ConceptMap from "@/components/ConceptMap";
import StreakFreezeShop from "@/components/StreakFreezeShop";
import DailyLoginReward from "@/components/DailyLoginReward";
import DailySpinWheel from "@/components/DailySpinWheel";
import PageTransition from "@/components/PageTransition";


export default function ProgressPage() {
  const { data: dataLayer, isGuest } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [xpEvents, setXpEvents] = useState<XPEvent[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [topicHistory, setTopicHistory] = useState<TopicHistoryItem[]>([]);
  const [stats, setStats] = useState({
    totalXP: 0,
    streak: 0,
    topicsExplored: 0,
    level: 1,
    title: "Curious Mind",
    nextLevelXP: 100,
  });

  useEffect(() => {
    async function load() {
      const [xpState, activityData, xpHistory, badgeData, historyData] = await Promise.all([
        dataLayer.getXP(),
        dataLayer.getActivityMap(365),
        dataLayer.getXPHistory(30),
        dataLayer.getBadgeData(),
        dataLayer.getTopicHistory(),
      ]);

      setStats({
        totalXP: xpState.totalXP,
        streak: xpState.streak,
        topicsExplored: badgeData.topicsExplored,
        level: xpState.level,
        title: xpState.title,
        nextLevelXP: xpState.nextLevelXP,
      });
      setActivity(activityData);
      setXpEvents(xpHistory);
      setBadges(checkBadges(badgeData));
      setTopicHistory(historyData);
      setLoading(false);
    }
    load();
  }, [dataLayer]);

  const earnedCount = badges.filter((b) => b.earned).length;
  const xpProgress = stats.totalXP / stats.nextLevelXP;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        <div className="text-white/30 font-mono text-sm animate-pulse">Loading progress...</div>
      </main>
    );
  }

  return (
    <PageTransition>
    <main className="relative min-h-screen max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24">
      {/* Lightweight static gradient background (was a heavy WebGL Galaxy w/ mouse repulsion) */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 20% 0%, rgba(56,189,248,0.06), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(168,85,247,0.05), transparent 50%), linear-gradient(to bottom, #020617, #0f172a)",
        }}
      />
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => router.push("/")}
          className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans mb-4 inline-block"
        >
          ← Home
        </button>
        <h1 className="font-display text-3xl sm:text-4xl text-white">My Progress</h1>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-emerald-400 text-2xl font-mono font-bold">{stats.totalXP}</p>
          <p className="text-white/30 text-xs font-sans mt-1">Total XP</p>
        </div>
        <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5">
          <p className="text-orange-400 text-2xl font-mono font-bold">{stats.streak}</p>
          <p className="text-white/30 text-xs font-sans mt-1">Day Streak</p>
        </div>
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
          <p className="text-blue-400 text-2xl font-mono font-bold">{stats.topicsExplored}</p>
          <p className="text-white/30 text-xs font-sans mt-1">Topics Explored</p>
        </div>
        <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5">
          <p className="text-purple-400 text-2xl font-mono font-bold">{earnedCount}/{badges.length}</p>
          <p className="text-white/30 text-xs font-sans mt-1">Badges Earned</p>
        </div>
      </motion.div>

      {/* Level progress */}
      <motion.div
        className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-white font-display text-lg">Level {stats.level}</span>
            <span className="text-white/30 text-sm font-sans ml-2">— {stats.title}</span>
          </div>
          <span className="text-white/30 text-xs font-mono">
            {stats.totalXP} / {stats.nextLevelXP} XP
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(xpProgress * 100, 100)}%` }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Daily Rewards */}
      <motion.div
        id="freeze-shop"
        className="mb-8 space-y-3 scroll-mt-20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.17 }}
      >
        <h2 className="text-white font-display text-lg mb-2">Daily Rewards</h2>
        <DailyLoginReward />
        <DailySpinWheel />
        <StreakFreezeShop />
      </motion.div>

      {/* Topic Constellation */}
      <motion.div
        className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <h2 className="text-white font-display text-lg mb-4">
          Solar System
          {topicHistory.length > 0 && (
            <span className="text-white/30 text-sm font-sans ml-2">
              {topicHistory.length} topic{topicHistory.length !== 1 ? "s" : ""} explored
            </span>
          )}
        </h2>
        <SolarSystem
          topics={topicHistory}
          userLevel={stats.level}
          userTitle={stats.title}
          totalXP={stats.totalXP}
        />
      </motion.div>

      {/* Concept Map */}
      {topicHistory.length >= 2 && (
        <motion.div
          className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.19 }}
        >
          <h2 className="text-white font-display text-lg mb-4">
            Concept Map
            <span className="text-white/30 text-sm font-sans ml-2">
              how your topics connect
            </span>
          </h2>
          <ConceptMap topics={topicHistory} />
        </motion.div>
      )}

      {/* Activity calendar */}
      {!isGuest && (
        <motion.div
          className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] mb-8 overflow-x-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-white font-display text-lg mb-4">Activity</h2>
          <StreakCalendar activity={activity} />
        </motion.div>
      )}

      {/* XP chart */}
      {!isGuest && xpEvents.length > 0 && (
        <motion.div
          className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-white font-display text-lg mb-4">XP Earned (Last 30 Days)</h2>
          <XPChart events={xpEvents} days={30} />
        </motion.div>
      )}

      {/* Badges */}
      <motion.div
        className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-white font-display text-lg mb-4">
          Badges
          <span className="text-white/30 text-sm font-sans ml-2">
            {earnedCount} of {badges.length} earned
          </span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {badges.map((badge, i) => (
            <BadgeCard key={badge.id} badge={badge} index={i} />
          ))}
        </div>
      </motion.div>

      {isGuest && (
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-white/30 text-sm font-sans mb-2">
            Sign in to track your activity calendar and XP history
          </p>
          <button
            onClick={() => router.push("/auth/login")}
            className="px-5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-sans hover:bg-emerald-500/20 transition-colors"
          >
            Sign in
          </button>
        </motion.div>
      )}
    </main>
  </PageTransition>
  );
}
