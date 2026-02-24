"use client";

import { motion } from "framer-motion";
import { LEVEL_META } from "@/lib/utils";
import StreamingText from "./StreamingText";

interface LevelCardProps {
  level: number;
  content: string;
  isStreaming: boolean;
  isLoading: boolean;
}

export default function LevelCard({
  level,
  content,
  isStreaming,
  isLoading,
}: LevelCardProps) {
  const meta = LEVEL_META[level - 1];

  return (
    <motion.div
      id={`level-${level}`}
      className="relative rounded-2xl border bg-white/[0.03] backdrop-blur-sm overflow-hidden"
      style={{
        borderColor: `${meta.color}20`,
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Left accent border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: meta.color }}
      />

      <div className="p-6 sm:p-8 pl-7 sm:pl-10">
        {/* Level header */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">{meta.emoji}</span>
          <h2
            className="text-lg font-display font-semibold"
            style={{ color: meta.color }}
          >
            Level {level}: {meta.label}
          </h2>
        </div>

        {/* Content */}
        {isLoading && !content ? (
          <LoadingSkeleton color={meta.color} />
        ) : (
          <StreamingText content={content} isStreaming={isStreaming} />
        )}
      </div>

      {/* Subtle glow effect */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-5 pointer-events-none"
        style={{ backgroundColor: meta.color }}
      />
    </motion.div>
  );
}

function LoadingSkeleton({ color }: { color: string }) {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-sm font-sans" style={{ color: `${color}99` }}>
          Thinking...
        </span>
      </div>
      <div className="h-4 bg-white/5 rounded w-full" />
      <div className="h-4 bg-white/5 rounded w-5/6" />
      <div className="h-4 bg-white/5 rounded w-4/6" />
      <div className="h-4 bg-white/5 rounded w-full mt-6" />
      <div className="h-4 bg-white/5 rounded w-3/4" />
    </div>
  );
}
