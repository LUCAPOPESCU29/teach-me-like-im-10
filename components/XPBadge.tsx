"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XP_LEVELS, FREEZE_COST, MAX_FREEZES } from "@/lib/xp";
import type { XPState } from "@/lib/xp";
import { useAuth } from "@/components/AuthProvider";
import { useCelebration } from "@/components/CelebrationProvider";

interface XPBadgeProps {
  xpGain?: number | null;
}

export default function XPBadge({ xpGain }: XPBadgeProps) {
  const { data: dataLayer } = useAuth();
  const { muted, toggleMute } = useCelebration();
  const [xpState, setXpState] = useState<XPState>({
    totalXP: 0, level: 1, title: "Curious Mind", nextLevelXP: 100, streak: 0, freezes: 0,
  });
  const [buyingFreeze, setBuyingFreeze] = useState(false);
  const [showFloat, setShowFloat] = useState(false);
  const [floatAmount, setFloatAmount] = useState(0);
  const [expanded, setExpanded] = useState(false);

  // Refresh XP state on xpGain or data layer change
  useEffect(() => {
    dataLayer.getXP().then(setXpState);
  }, [xpGain, dataLayer]);

  // Floating +XP animation
  useEffect(() => {
    if (xpGain && xpGain > 0) {
      setFloatAmount(xpGain);
      setShowFloat(true);
      const timer = setTimeout(() => setShowFloat(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [xpGain]);

  const currentLevelData = XP_LEVELS.find((l, i) => {
    const next = XP_LEVELS[i + 1];
    return !next || xpState.totalXP < next.xp;
  }) || XP_LEVELS[0];

  const nextLevel = XP_LEVELS[XP_LEVELS.indexOf(currentLevelData) + 1];
  const progressPct = nextLevel
    ? ((xpState.totalXP - currentLevelData.xp) / (nextLevel.xp - currentLevelData.xp)) * 100
    : 100;

  return (
    <div className="relative">
      {/* Floating +XP */}
      <AnimatePresence>
        {showFloat && (
          <motion.div
            className="absolute -top-8 left-1/2 -translate-x-1/2 text-emerald-400 font-mono text-sm font-bold whitespace-nowrap pointer-events-none"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: -10 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 1.2 }}
          >
            +{floatAmount} XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge pill */}
      <motion.button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-200 text-sm"
        whileTap={{ scale: 0.97 }}
      >
        {xpState.streak > 0 && (
          <span className="text-orange-400 font-mono text-xs">
            🔥{xpState.streak}
          </span>
        )}
        <span className="text-emerald-400 font-mono text-xs">
          ⭐{xpState.totalXP}
        </span>
        <span className="text-white/40 text-xs font-sans hidden sm:inline">
          {xpState.title}
        </span>
      </motion.button>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="absolute left-0 mt-2 w-56 rounded-xl bg-slate-900/95 border border-white/10 backdrop-blur-xl shadow-2xl p-4 z-50"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="text-white/80 font-sans text-sm font-medium mb-1">
              {xpState.title}
            </div>
            <div className="text-white/40 font-mono text-xs mb-3">
              Level {xpState.level} · {xpState.totalXP} XP
            </div>

            {/* Progress bar */}
            {nextLevel && (
              <div className="mb-3">
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progressPct, 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="text-white/30 font-mono text-[10px] mt-1 flex justify-between">
                  <span>{xpState.totalXP} XP</span>
                  <span>{nextLevel.xp} XP</span>
                </div>
              </div>
            )}

            {/* Streak */}
            <div className="flex items-center gap-2 text-white/50 text-xs font-sans">
              <span>🔥</span>
              <span>
                {xpState.streak > 0
                  ? `${xpState.streak} day streak`
                  : "Start a streak by learning today!"}
              </span>
            </div>

            {/* Streak Freezes */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-white/50 text-xs font-sans">
                  <span>🧊</span>
                  <span>
                    {xpState.freezes} / {MAX_FREEZES} freeze{xpState.freezes !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  setBuyingFreeze(true);
                  const success = await dataLayer.buyFreeze();
                  if (success) {
                    const newState = await dataLayer.getXP();
                    setXpState(newState);
                  }
                  setBuyingFreeze(false);
                }}
                disabled={buyingFreeze || xpState.totalXP < FREEZE_COST || xpState.freezes >= MAX_FREEZES}
                className="w-full px-2 py-1.5 rounded-lg border border-cyan-500/20 text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10 font-mono text-[10px] tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {buyingFreeze
                  ? "..."
                  : xpState.freezes >= MAX_FREEZES
                    ? "MAX FREEZES"
                    : `BUY FREEZE · ${FREEZE_COST} XP`}
              </button>
            </div>

            {/* Sound toggle */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-white/50 text-xs font-sans flex items-center gap-1.5">
                  {muted ? "🔇" : "🔊"} Sound effects
                </span>
                <span className={`text-[10px] font-mono tracking-wider ${muted ? "text-white/30" : "text-emerald-400/70"}`}>
                  {muted ? "OFF" : "ON"}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
