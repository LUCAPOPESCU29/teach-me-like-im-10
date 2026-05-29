"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import type { TopicHistoryItem } from "@/lib/data";
import { unslugify } from "@/lib/utils";

const LEVEL_COLORS = [
  "#34d399",  // emerald
  "#fbbf24",  // amber
  "#f97316",  // orange
  "#f43f5e",  // rose
  "#a855f7",  // purple
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
      transition={{ delay: 0.6, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
    >
      <h3 className="text-white/25 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] mb-3.5 px-1">
        Continue Learning
      </h3>
      <div className="flex flex-col gap-1.5">
        {topics.map((topic, i) => (
          <motion.button
            key={topic.slug}
            onClick={() => router.push(`/learn/${topic.slug}`)}
            className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.025] hover:bg-white/[0.055] hover:border-white/[0.11] text-left group relative overflow-hidden"
            style={{ transition: "all 0.45s cubic-bezier(0.32,0.72,0,1)" }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.65 + i * 0.07, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Left accent line */}
            <div
              className="absolute left-0 top-[20%] bottom-[20%] w-[2px] rounded-full opacity-0 group-hover:opacity-100"
              style={{
                background: `linear-gradient(to bottom, ${LEVEL_COLORS[Math.max(0, topic.maxLevel - 1)]}, transparent)`,
                transition: "opacity 0.4s cubic-bezier(0.32,0.72,0,1)",
              }}
            />

            {/* Progress pips */}
            <div className="flex gap-1 shrink-0">
              {Array.from({ length: 5 }).map((_, lvl) => (
                <div
                  key={lvl}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: lvl < topic.maxLevel
                      ? LEVEL_COLORS[lvl]
                      : "rgba(255,255,255,0.07)",
                    boxShadow: lvl < topic.maxLevel
                      ? `0 0 5px ${LEVEL_COLORS[lvl]}60`
                      : "none",
                  }}
                />
              ))}
            </div>

            {/* Topic name */}
            <span className="flex-1 text-white/55 group-hover:text-white/90 font-sans text-sm transition-colors duration-300 truncate capitalize">
              {topic.topicName || unslugify(topic.slug)}
            </span>

            {/* Level badge */}
            <span className="text-white/18 font-sans text-xs shrink-0">
              Level {topic.maxLevel}/5
            </span>

            {/* Arrow */}
            <div className="w-5 h-5 rounded-full bg-white/[0.04] group-hover:bg-white/[0.09] flex items-center justify-center shrink-0" style={{ transition: "all 0.4s cubic-bezier(0.32,0.72,0,1)" }}>
              <svg
                width="8"
                height="8"
                viewBox="0 0 8 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                className="text-white/20 group-hover:text-white/50 transition-colors duration-300 translate-x-px"
              >
                <path d="M2 1.5l3 2.5-3 2.5" />
              </svg>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
