"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LEVEL_COLORS = ["#4ade80", "#facc15", "#fb923c", "#f472b6", "#a78bfa"];

interface SpeedRunTimerProps {
  isRunning: boolean;
  currentLevel: number;
  completedLevels: number;
  elapsedMs: number;
  isComplete: boolean;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

export { formatTime };

export default function SpeedRunTimer({
  isRunning,
  currentLevel,
  completedLevels,
  elapsedMs,
  isComplete,
}: SpeedRunTimerProps) {
  return (
    <motion.div
      className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm overflow-hidden p-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background pulse when running */}
      {isRunning && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{
            boxShadow: [
              "inset 0 0 30px rgba(52, 211, 153, 0.03)",
              "inset 0 0 60px rgba(52, 211, 153, 0.08)",
              "inset 0 0 30px rgba(52, 211, 153, 0.03)",
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Celebration effect on complete */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.15, 0],
              background: [
                "linear-gradient(135deg, #4ade80, #a78bfa)",
                "linear-gradient(135deg, #a78bfa, #4ade80)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">
        {/* Timer display */}
        <div className="text-center mb-5">
          <motion.div
            className={`font-mono text-5xl sm:text-6xl tracking-wider ${
              isComplete
                ? "text-amber-400"
                : isRunning
                ? "text-emerald-400"
                : "text-white/40"
            }`}
            animate={
              isRunning
                ? { textShadow: ["0 0 20px rgba(52,211,153,0.3)", "0 0 40px rgba(52,211,153,0.5)", "0 0 20px rgba(52,211,153,0.3)"] }
                : isComplete
                ? { textShadow: "0 0 30px rgba(251,191,36,0.4)" }
                : {}
            }
            transition={isRunning ? { duration: 1.5, repeat: Infinity } : {}}
          >
            {formatTime(elapsedMs)}
          </motion.div>
          <p className="text-white/30 text-xs font-mono tracking-widest mt-2 uppercase">
            {isComplete ? "Final Time" : isRunning ? "Speed Run Active" : "Ready"}
          </p>
        </div>

        {/* Level progress dots */}
        <div className="flex items-center justify-center gap-3">
          {LEVEL_COLORS.map((color, i) => {
            const levelNum = i + 1;
            const isCompleted = completedLevels >= levelNum;
            const isCurrent = currentLevel === levelNum;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <motion.div
                  className="relative w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: isCompleted
                      ? `${color}30`
                      : isCurrent
                      ? `${color}15`
                      : "rgba(255,255,255,0.04)",
                    border: `2px solid ${
                      isCompleted ? color : isCurrent ? `${color}80` : "rgba(255,255,255,0.08)"
                    }`,
                  }}
                  animate={
                    isCurrent && isRunning
                      ? {
                          borderColor: [`${color}40`, color, `${color}40`],
                          scale: [1, 1.1, 1],
                        }
                      : {}
                  }
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  {isCompleted ? (
                    <motion.svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <path d="M3 8.5L6.5 12L13 4" />
                    </motion.svg>
                  ) : (
                    <span
                      className="text-xs font-mono font-bold"
                      style={{ color: isCurrent ? color : "rgba(255,255,255,0.2)" }}
                    >
                      {levelNum}
                    </span>
                  )}
                </motion.div>
                {/* Connector line */}
                {i < 4 && (
                  <div className="absolute" style={{ display: "none" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Connector lines between dots */}
        <div className="flex items-center justify-center gap-0 mt-[-22px] mb-[-6px] pointer-events-none" aria-hidden>
          <div className="w-8" />
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[2px] flex-1 max-w-[20px] mx-0"
              style={{
                backgroundColor:
                  completedLevels > i + 1
                    ? LEVEL_COLORS[i]
                    : "rgba(255,255,255,0.06)",
                opacity: completedLevels > i + 1 ? 0.5 : 1,
              }}
            />
          ))}
          <div className="w-8" />
        </div>
      </div>
    </motion.div>
  );
}
