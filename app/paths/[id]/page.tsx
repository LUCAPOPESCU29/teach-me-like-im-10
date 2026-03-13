"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { LEARNING_PATHS } from "@/lib/paths";

export default function PathDetailPage() {
  const { data: dataLayer } = useAuth();
  const params = useParams();
  const router = useRouter();
  const pathId = params.id as string;
  const path = LEARNING_PATHS.find((p) => p.id === pathId);
  const [completedTopics, setCompletedTopics] = useState<Map<string, number>>(new Map());

  const fetchProgress = useCallback(() => {
    dataLayer.getTopicHistory().then((topics) => {
      const map = new Map<string, number>();
      for (const t of topics) {
        map.set(t.slug, t.maxLevel);
      }
      setCompletedTopics(map);
    });
  }, [dataLayer]);

  // Fetch on mount
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Refetch when page becomes visible (user navigates back)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") fetchProgress();
    }
    function handleFocus() {
      fetchProgress();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchProgress]);

  if (!path) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/30 font-sans text-sm">Path not found</p>
          <button
            onClick={() => router.push("/paths")}
            className="mt-4 text-emerald-400 text-sm font-sans hover:underline"
          >
            Browse paths
          </button>
        </div>
      </main>
    );
  }

  const completedCount = path.topics.filter((t) => completedTopics.has(t.slug)).length;
  const progress = (completedCount / path.topics.length) * 100;

  const levelColors = ["#4ade80", "#facc15", "#fb923c", "#f472b6", "#a78bfa"];

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => router.push("/paths")}
          className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans mb-4 inline-block"
        >
          ← All Paths
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ backgroundColor: `${path.color}15`, border: `1px solid ${path.color}30` }}
          >
            {path.icon}
          </div>
          <div>
            <h1 className="font-display text-3xl text-white">{path.title}</h1>
            <p className="text-white/30 text-sm font-sans">{path.description}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: path.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <span className="text-xs font-mono text-white/30">
            {completedCount}/{path.topics.length} topics
          </span>
        </div>
      </motion.div>

      {/* Topics list */}
      <div className="space-y-3">
        {path.topics.map((topic, i) => {
          const maxLevel = completedTopics.get(topic.slug) || 0;
          const isStarted = maxLevel > 0;

          return (
            <motion.button
              key={topic.slug}
              onClick={() => router.push(`/learn/${topic.slug}`)}
              className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all flex items-center gap-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ x: 4 }}
            >
              {/* Step number */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm flex-shrink-0"
                style={{
                  backgroundColor: isStarted ? `${path.color}20` : "rgba(255,255,255,0.05)",
                  color: isStarted ? path.color : "rgba(255,255,255,0.3)",
                  border: `1px solid ${isStarted ? `${path.color}40` : "rgba(255,255,255,0.1)"}`,
                }}
              >
                {isStarted ? "✓" : i + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-sans text-sm">{topic.name}</p>
                {isStarted && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((l) => (
                        <div
                          key={l}
                          className="w-1 h-3 rounded-full"
                          style={{
                            backgroundColor: l <= maxLevel ? levelColors[l - 1] : "rgba(255,255,255,0.05)",
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-white/20 text-xs font-mono">Level {maxLevel}</span>
                  </div>
                )}
              </div>

              <span className="text-white/20 text-xs font-sans">
                {isStarted ? "Continue →" : "Start →"}
              </span>
            </motion.button>
          );
        })}
      </div>
    </main>
  );
}
