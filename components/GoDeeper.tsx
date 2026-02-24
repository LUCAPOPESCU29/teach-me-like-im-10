"use client";

import { motion } from "framer-motion";
import { LEVEL_META } from "@/lib/utils";

interface GoDeeperProps {
  nextLevel: number;
  onClick: () => void;
  isLoading: boolean;
}

export default function GoDeeper({
  nextLevel,
  onClick,
  isLoading,
}: GoDeeperProps) {
  if (nextLevel > 5) return null;

  const meta = LEVEL_META[nextLevel - 1];
  const buttonText = LEVEL_META[nextLevel - 2]?.buttonText || "Go Deeper →";

  return (
    <motion.div
      className="flex justify-center my-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <button
        onClick={onClick}
        disabled={isLoading}
        className="group relative px-8 py-4 rounded-2xl font-display font-semibold text-lg text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
        style={{
          backgroundColor: `${meta.color}20`,
          border: `1px solid ${meta.color}40`,
        }}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            boxShadow: `0 0 30px ${meta.color}30`,
          }}
          animate={
            !isLoading
              ? {
                  boxShadow: [
                    `0 0 20px ${meta.color}15`,
                    `0 0 30px ${meta.color}30`,
                    `0 0 20px ${meta.color}15`,
                  ],
                }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        <span className="relative z-10 flex items-center gap-3">
          {isLoading ? (
            <>
              <motion.div
                className="w-5 h-5 border-2 rounded-full"
                style={{
                  borderColor: `${meta.color}40`,
                  borderTopColor: meta.color,
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <span style={{ color: meta.color }}>Diving deeper...</span>
            </>
          ) : (
            <span style={{ color: meta.color }}>{buttonText}</span>
          )}
        </span>
      </button>
    </motion.div>
  );
}
