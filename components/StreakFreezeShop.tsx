"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { getGuestFreezes, FREEZE_COST, MAX_FREEZES } from "@/lib/xp";

export default function StreakFreezeShop() {
  const { data } = useAuth();
  const [freezes, setFreezes] = useState(0);
  const [xp, setXp] = useState(0);
  const [buying, setBuying] = useState(false);
  const [justBought, setJustBought] = useState(false);
  const [error, setError] = useState("");

  const loadState = useCallback(async () => {
    const xpState = await data.getXP();
    setXp(xpState.totalXP);
    setFreezes(xpState.freezes ?? getGuestFreezes());
  }, [data]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const canAfford = xp >= FREEZE_COST;
  const atMax = freezes >= MAX_FREEZES;

  async function handleBuy() {
    if (buying || atMax) return;
    if (!canAfford) {
      setError("Not enough XP");
      setTimeout(() => setError(""), 2000);
      return;
    }
    setBuying(true);
    setError("");
    try {
      const success = await data.buyFreeze();
      if (success) {
        setJustBought(true);
        await loadState();
        setTimeout(() => setJustBought(false), 1800);
      } else {
        setError("Purchase failed");
        setTimeout(() => setError(""), 2000);
      }
    } catch {
      setError("Something went wrong");
      setTimeout(() => setError(""), 2000);
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/[0.04] via-white/[0.02] to-blue-500/[0.04] p-5">
      {/* Frost sparkle effect on purchase */}
      <AnimatePresence>
        {justBought && (
          <motion.div
            className="absolute inset-0 z-10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Frost overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-blue-400/10 rounded-2xl" />
            {/* Sparkle particles */}
            {[...Array(8)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-lg"
                style={{
                  left: `${15 + Math.random() * 70}%`,
                  top: `${10 + Math.random() * 80}%`,
                }}
                initial={{ opacity: 0, scale: 0, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0],
                  rotate: [0, 180],
                  y: [0, -20],
                }}
                transition={{
                  duration: 1.4,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
              >
                {i % 2 === 0 ? "\u2744\uFE0F" : "\u2728"}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{"\u2744\uFE0F"}</span>
          <h3 className="text-white font-display text-base">Streak Freezes</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <span className="text-yellow-400 text-xs">{"\u2B50"}</span>
          <span className="text-white/60 text-xs font-mono">{xp.toLocaleString()} XP</span>
        </div>
      </div>

      {/* Freeze crystals display */}
      <div className="flex items-center gap-3 mb-4">
        {[...Array(MAX_FREEZES)].map((_, i) => (
          <motion.div
            key={i}
            className="relative flex items-center justify-center w-14 h-14 rounded-xl border transition-colors"
            style={{
              borderColor: i < freezes ? "rgba(34, 211, 238, 0.3)" : "rgba(255, 255, 255, 0.06)",
              backgroundColor: i < freezes ? "rgba(34, 211, 238, 0.08)" : "rgba(255, 255, 255, 0.02)",
            }}
            initial={false}
            animate={
              justBought && i === freezes - 1
                ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
                : {}
            }
            transition={{ duration: 0.5 }}
          >
            <span
              className="text-2xl transition-all"
              style={{
                filter: i < freezes ? "none" : "grayscale(1) opacity(0.2)",
              }}
            >
              {"\u2744\uFE0F"}
            </span>
            {i < freezes && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400/60"
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>
        ))}

        {/* Freeze count label */}
        <div className="ml-auto text-right">
          <p className="text-white/70 text-sm font-mono">
            {freezes}/{MAX_FREEZES}
          </p>
          <p className="text-white/25 text-[10px] font-sans">owned</p>
        </div>
      </div>

      {/* Buy button */}
      <div className="flex items-center gap-3 mb-4">
        <motion.button
          onClick={handleBuy}
          disabled={buying || atMax || !canAfford}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-sans font-medium transition-all"
          style={{
            backgroundColor:
              atMax
                ? "rgba(255, 255, 255, 0.03)"
                : canAfford
                  ? "rgba(34, 211, 238, 0.12)"
                  : "rgba(255, 255, 255, 0.03)",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor:
              atMax
                ? "rgba(255, 255, 255, 0.06)"
                : canAfford
                  ? "rgba(34, 211, 238, 0.25)"
                  : "rgba(255, 255, 255, 0.06)",
            color:
              atMax
                ? "rgba(255, 255, 255, 0.25)"
                : canAfford
                  ? "rgb(34, 211, 238)"
                  : "rgba(255, 255, 255, 0.25)",
            cursor: atMax || !canAfford || buying ? "not-allowed" : "pointer",
            opacity: buying ? 0.6 : 1,
          }}
          whileTap={canAfford && !atMax && !buying ? { scale: 0.97 } : {}}
        >
          {buying ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              {"\u2744\uFE0F"}
            </motion.span>
          ) : atMax ? (
            "All Freeze Slots Full"
          ) : (
            <>
              <span>{"\u2744\uFE0F"}</span>
              Buy Freeze
              <span className="text-white/30 text-xs font-mono ml-1">
                {FREEZE_COST} XP
              </span>
            </>
          )}
        </motion.button>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-red-400/80 text-xs font-sans mb-3 text-center"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Info text */}
      <p className="text-white/25 text-xs font-sans leading-relaxed">
        Streak freezes protect your streak for 1 day if you miss learning.
        Max {MAX_FREEZES} freezes. Each freeze costs {FREEZE_COST} XP.
        Freezes can also be earned from the daily spin roulette.
      </p>
    </div>
  );
}
