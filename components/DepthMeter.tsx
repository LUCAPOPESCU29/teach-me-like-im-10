"use client";

import { motion } from "framer-motion";
import { LEVEL_META } from "@/lib/utils";

interface DepthMeterProps {
  currentLevel: number;
  unlockedLevels: number;
}

export default function DepthMeter({
  currentLevel,
  unlockedLevels,
}: DepthMeterProps) {
  return (
    <>
      {/* Desktop: Vertical bar on the left */}
      <div className="hidden lg:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col items-center gap-0 z-40">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-3 font-sans">
          Depth
        </div>
        <div className="relative w-1.5 h-48 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="absolute bottom-0 left-0 right-0 rounded-full"
            style={{
              background: `linear-gradient(to top, ${LEVEL_META[0].color}, ${LEVEL_META[Math.max(0, Math.min(currentLevel - 1, 4))].color})`,
            }}
            initial={{ height: "0%" }}
            animate={{ height: `${(currentLevel / 5) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {LEVEL_META.map((meta) => (
            <motion.div
              key={meta.level}
              className="flex items-center gap-2 cursor-default"
              initial={{ opacity: 0.3 }}
              animate={{
                opacity: meta.level <= unlockedLevels ? 1 : 0.3,
              }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full border-2 transition-colors duration-300"
                style={{
                  borderColor:
                    meta.level <= unlockedLevels ? meta.color : "rgba(255,255,255,0.2)",
                  backgroundColor:
                    meta.level <= currentLevel ? meta.color : "transparent",
                }}
              />
              <span
                className="text-[11px] font-sans transition-colors duration-300 whitespace-nowrap"
                style={{
                  color:
                    meta.level <= unlockedLevels
                      ? "rgba(255,255,255,0.7)"
                      : "rgba(255,255,255,0.2)",
                }}
              >
                {meta.emoji} {meta.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile: Horizontal bar at top */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#0f172a]/90 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-sans shrink-0">
            Depth
          </span>
          <div className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 bottom-0 rounded-full"
              style={{
                background: `linear-gradient(to right, ${LEVEL_META[0].color}, ${LEVEL_META[Math.max(0, Math.min(currentLevel - 1, 4))].color})`,
              }}
              initial={{ width: "0%" }}
              animate={{ width: `${(currentLevel / 5) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <span
            className="text-xs font-sans font-medium"
            style={{
              color: LEVEL_META[Math.max(0, Math.min(currentLevel - 1, 4))].color,
            }}
          >
            {currentLevel}/5
          </span>
        </div>
      </div>
    </>
  );
}
