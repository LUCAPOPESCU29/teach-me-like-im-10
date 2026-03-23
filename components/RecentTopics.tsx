"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import type { TopicHistoryItem } from "@/lib/data";
import { unslugify } from "@/lib/utils";

const LEVEL_COLORS = [
  "bg-emerald-400",
  "bg-yellow-400",
  "bg-orange-400",
  "bg-rose-400",
  "bg-purple-400",
];

export default function RecentTopics() {
  const { data } = useAuth();
  const router = useRouter();
  const [topics, setTopics] = useState<TopicHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    data.getTopicHistory().then((history) => {
      setTopics(history.slice(0, 5));
      setLoading(false);
    });
  }, [data]);

  if (loading || topics.length === 0) return null;

  return (
    <motion.div
      className="w-full max-w-xl mt-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      <h3 className="text-white/25 font-sans text-xs font-semibold uppercase tracking-wider mb-3 px-1">
        Continue Learning
      </h3>
      <div className="flex flex-col gap-1.5">
        {topics.map((topic, i) => (
          <motion.button
            key={topic.slug}
            onClick={() => router.push(`/learn/${topic.slug}`)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-200 text-left group"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + i * 0.08 }}
          >
            {/* Progress dots */}
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, lvl) => (
                <div
                  key={lvl}
                  className={`w-1.5 h-1.5 rounded-full ${
                    lvl < topic.maxLevel
                      ? LEVEL_COLORS[lvl]
                      : "bg-white/[0.08]"
                  }`}
                />
              ))}
            </div>

            {/* Topic name */}
            <span className="flex-1 text-white/60 group-hover:text-white/90 font-sans text-sm transition-colors truncate">
              {topic.topicName || unslugify(topic.slug)}
            </span>

            {/* Level indicator */}
            <span className="text-white/20 font-sans text-xs">
              Level {topic.maxLevel}/5
            </span>

            {/* Arrow */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-white/10 group-hover:text-white/30 transition-colors"
            >
              <path d="M6 4l4 4-4 4" />
            </svg>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
