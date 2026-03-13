"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import PathCard from "@/components/PathCard";
import { LEARNING_PATHS } from "@/lib/paths";

export default function PathsPage() {
  const { data: dataLayer } = useAuth();
  const router = useRouter();
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());

  const fetchProgress = useCallback(() => {
    dataLayer.getTopicHistory().then((topics) => {
      const completed = new Set(topics.filter((t) => t.maxLevel >= 1).map((t) => t.slug));
      setCompletedTopics(completed);
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

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24">
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
        <h1 className="font-display text-3xl sm:text-4xl text-white">Learning Paths</h1>
        <p className="text-white/30 text-sm font-sans mt-2">
          Follow curated sequences of topics to build deep understanding
        </p>
      </motion.div>

      <div className="space-y-3">
        {LEARNING_PATHS.map((path, i) => (
          <PathCard
            key={path.id}
            path={path}
            completedTopics={completedTopics}
            index={i}
          />
        ))}
      </div>
    </main>
  );
}
