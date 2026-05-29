"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import LearningDNA, {
  computeDNAData,
  CATEGORY_MAP,
  STYLE_INFO,
  type LearningDNAData,
} from "@/components/LearningDNA";
import type { TopicHistoryItem } from "@/lib/data";
import PageTransition from "@/components/PageTransition";

export default function DNAPage() {
  const { data: dataLayer, user, isGuest } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dnaData, setDnaData] = useState<LearningDNAData | null>(null);
  const [topics, setTopics] = useState<TopicHistoryItem[]>([]);

  useEffect(() => {
    async function load() {
      const [xpState, badgeData, historyData] = await Promise.all([
        dataLayer.getXP(),
        dataLayer.getBadgeData(),
        dataLayer.getTopicHistory(),
      ]);

      setTopics(historyData);

      const computed = computeDNAData(
        historyData,
        xpState.totalXP,
        xpState.streak,
      );
      setDnaData(computed);
      setLoading(false);
    }
    load();
  }, [dataLayer]);

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Learner";

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white/30 font-mono text-sm animate-pulse">
          Generating your Learning DNA...
        </div>
      </main>
    );
  }

  if (!dnaData || topics.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/20"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="font-display text-2xl text-white mb-2">
            No Learning DNA Yet
          </h1>
          <p className="text-white/30 font-sans text-sm max-w-sm mx-auto mb-6">
            Explore some topics first to generate your unique learning
            fingerprint. Each topic you study shapes your DNA.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-sans hover:bg-emerald-500/20 transition-colors"
          >
            Start Exploring
          </button>
        </motion.div>
      </main>
    );
  }

  const domCat =
    CATEGORY_MAP[dnaData.dominantCategory] || CATEGORY_MAP.other;
  const styleInfo = STYLE_INFO[dnaData.learningStyle];

  return (
    <main className="relative min-h-screen max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24">
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
          &larr; Home
        </button>
        <h1 className="font-display text-3xl sm:text-4xl text-white">
          Learning DNA
        </h1>
        <p className="text-white/30 font-sans text-sm mt-1">
          Your unique learning fingerprint
        </p>
      </motion.div>

      {/* DNA Visualization */}
      <motion.div
        className="flex justify-center mb-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <LearningDNA
          dnaData={dnaData}
          displayName={displayName}
          size={380}
        />
      </motion.div>

      {/* Stats Breakdown */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <StatCard
          value={dnaData.totalXP.toString()}
          label="Total XP"
          color="#4ade80"
        />
        <StatCard
          value={dnaData.topicsExplored.toString()}
          label="Topics"
          color="#38bdf8"
        />
        <StatCard
          value={dnaData.streak.toString()}
          label="Day Streak"
          color="#fbbf24"
        />
        <StatCard
          value={dnaData.avgDepth.toString()}
          label="Avg Depth"
          color="#a78bfa"
        />
      </motion.div>

      {/* Detailed Stats */}
      <motion.div
        className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] mb-8 space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="font-display text-lg text-white">Pattern Analysis</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Learning speed */}
          <div className="space-y-1">
            <p className="text-white/40 text-xs font-sans uppercase tracking-wider">
              Learning Speed
            </p>
            <p className="text-white font-mono text-lg">
              {dnaData.topicsPerWeek}{" "}
              <span className="text-white/30 text-sm font-sans">
                topics/week
              </span>
            </p>
          </div>

          {/* Max depth */}
          <div className="space-y-1">
            <p className="text-white/40 text-xs font-sans uppercase tracking-wider">
              Max Depth Reached
            </p>
            <p className="text-white font-mono text-lg">
              Level {dnaData.maxLevelReached}
              <span className="text-white/30 text-sm font-sans ml-1">
                / 5
              </span>
            </p>
          </div>

          {/* Dominant category */}
          <div className="space-y-1">
            <p className="text-white/40 text-xs font-sans uppercase tracking-wider">
              Dominant Category
            </p>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: domCat.color }}
              />
              <p className="font-sans text-white">{domCat.label}</p>
            </div>
          </div>

          {/* Categories explored */}
          <div className="space-y-1">
            <p className="text-white/40 text-xs font-sans uppercase tracking-wider">
              Categories Explored
            </p>
            <p className="text-white font-mono text-lg">
              {Object.keys(dnaData.categoryBreakdown).length}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Topic depth chart */}
      {topics.length > 0 && (
        <motion.div
          className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-display text-lg text-white mb-4">
            Topic Depth Map
          </h2>
          <div className="space-y-2">
            {topics.slice(0, 15).map((topic) => (
              <div key={topic.slug} className="flex items-center gap-3">
                <span className="text-white/50 text-xs font-sans w-32 truncate text-right">
                  {topic.topicName}
                </span>
                <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(topic.maxLevel / 5) * 100}%`,
                      backgroundColor: domCat.color,
                      opacity: 0.4 + (topic.maxLevel / 5) * 0.6,
                    }}
                  />
                </div>
                <span className="text-white/30 font-mono text-xs w-6 text-right">
                  {topic.maxLevel}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Share prompt for guests */}
      {isGuest && (
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-white/30 text-sm font-sans mb-2">
            Sign in to save your Learning DNA and track it over time
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
  );
}

function StatCard({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <PageTransition>
    <div
      className="p-4 rounded-xl border"
      style={{
        borderColor: `${color}33`,
        backgroundColor: `${color}08`,
      }}
    >
      <p className="text-2xl font-mono font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-white/30 text-xs font-sans mt-1">{label}</p>
    </div>
      </PageTransition>
  );
}
