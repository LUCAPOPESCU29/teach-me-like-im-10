"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { LearningPath } from "@/lib/paths";

interface Props {
  path: LearningPath;
  completedTopics: Set<string>;
  index: number;
}

export default function PathCard({ path, completedTopics, index }: Props) {
  const router = useRouter();
  const completed = path.topics.filter((t) => completedTopics.has(t.slug)).length;
  const progress = (completed / path.topics.length) * 100;

  return (
    <motion.button
      onClick={() => router.push(`/paths/${path.id}`)}
      className="w-full text-left p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: `${path.color}15`, border: `1px solid ${path.color}30` }}
        >
          {path.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-display text-lg">{path.title}</h3>
          <p className="text-white/30 text-sm font-sans mt-0.5">{path.description}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: path.color }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ delay: index * 0.08 + 0.3, duration: 0.5 }}
              />
            </div>
            <span className="text-xs font-mono text-white/30 flex-shrink-0">
              {completed}/{path.topics.length}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
