"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";

interface WagerHistoryItem {
  date: string;
  amount: number;
  won: boolean;
  quizTopic: string;
}

const WAGER_HISTORY_KEY = "tmi10_wager_history";

export function getWagerHistory(): WagerHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WAGER_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addWagerHistory(item: WagerHistoryItem) {
  try {
    const history = getWagerHistory();
    history.unshift(item);
    localStorage.setItem(
      WAGER_HISTORY_KEY,
      JSON.stringify(history.slice(0, 20))
    );
  } catch {}
}

interface XPWagerProps {
  topic: string;
  onConfirm: (wagerAmount: number) => void;
  onSkip: () => void;
}

const PRESET_WAGERS = [10, 25, 50, 100];

export default function XPWager({ topic, onConfirm, onSkip }: XPWagerProps) {
  const { data: dataLayer } = useAuth();
  const [currentXP, setCurrentXP] = useState(0);
  const [selectedWager, setSelectedWager] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    dataLayer.getXP().then((xp) => setCurrentXP(xp.totalXP));
  }, [dataLayer]);

  const activeWager = showCustom
    ? parseInt(customAmount) || 0
    : selectedWager ?? 0;

  const isValidWager = activeWager > 0 && activeWager <= currentXP;

  const handleConfirm = useCallback(() => {
    if (!isValidWager) return;
    setShaking(true);
    setTimeout(() => {
      onConfirm(activeWager);
    }, 600);
  }, [isValidWager, activeWager, onConfirm]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.5, type: "spring", damping: 20 }}
      className="text-center max-w-md mx-auto"
    >
      {/* Header icon */}
      <motion.div
        className="relative w-20 h-20 mx-auto mb-6"
        animate={{ rotateY: [0, 360] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10" />
        <div className="absolute inset-2 rounded-xl border border-amber-500/20 flex items-center justify-center">
          <span className="text-3xl">&#x1f3b0;</span>
        </div>
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={{
            boxShadow: [
              "0 0 15px rgba(251,191,36,0.1)",
              "0 0 30px rgba(251,191,36,0.25)",
              "0 0 15px rgba(251,191,36,0.1)",
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      </motion.div>

      <h2 className="font-mono text-xl text-amber-400 tracking-wider mb-1">
        WAGER YOUR XP
      </h2>
      <p className="text-white/30 font-mono text-xs mb-6">
        TOPIC: <span className="text-amber-300/70">{topic.toUpperCase()}</span>
      </p>

      {/* XP Balance */}
      <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/[0.02]">
        <span className="text-white/40 font-mono text-xs">BALANCE:</span>
        <span className="text-amber-400 font-mono text-lg font-bold">
          {currentXP.toLocaleString()} XP
        </span>
      </div>

      {/* Wager presets */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {PRESET_WAGERS.map((amount) => {
          const disabled = amount > currentXP;
          const active = !showCustom && selectedWager === amount;
          return (
            <motion.button
              key={amount}
              onClick={() => {
                if (disabled) return;
                setShowCustom(false);
                setSelectedWager(amount);
              }}
              disabled={disabled}
              className={`relative px-3 py-3 rounded-xl border font-mono text-sm transition-all duration-200 ${
                active
                  ? "border-amber-500/60 bg-amber-500/15 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
                  : disabled
                    ? "border-white/5 bg-white/[0.01] text-white/15 cursor-not-allowed"
                    : "border-white/10 bg-white/[0.02] text-white/50 hover:border-amber-500/30 hover:text-amber-300/70"
              }`}
              whileHover={!disabled ? { scale: 1.03 } : {}}
              whileTap={!disabled ? { scale: 0.97 } : {}}
            >
              {amount}
            </motion.button>
          );
        })}
      </div>

      {/* Custom amount toggle */}
      <button
        onClick={() => {
          setShowCustom(!showCustom);
          setSelectedWager(null);
        }}
        className="text-white/20 font-mono text-[10px] tracking-wider hover:text-amber-400/50 transition-colors mb-3"
      >
        {showCustom ? "USE PRESETS" : "CUSTOM AMOUNT"}
      </button>

      <AnimatePresence>
        {showCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="flex items-center gap-2 justify-center pt-2">
              <input
                type="number"
                min="1"
                max={currentXP}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter XP..."
                className="w-32 px-4 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-amber-300 font-mono text-center text-sm placeholder:text-white/15 focus:outline-none focus:border-amber-500/40"
              />
              <span className="text-white/20 font-mono text-xs">XP</span>
            </div>
            {parseInt(customAmount) > currentXP && (
              <p className="text-red-400/60 font-mono text-[10px] mt-1">
                INSUFFICIENT XP BALANCE
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Potential winnings display */}
      <AnimatePresence>
        {activeWager > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="my-6 grid grid-cols-2 gap-3"
          >
            <div className="px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="text-emerald-500/50 font-mono text-[9px] tracking-wider mb-1">
                IF YOU WIN (80%+)
              </div>
              <div className="text-emerald-400 font-mono text-lg font-bold">
                +{activeWager} XP
              </div>
            </div>
            <div className="px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5">
              <div className="text-red-500/50 font-mono text-[9px] tracking-wider mb-1">
                IF YOU LOSE
              </div>
              <div className="text-red-400 font-mono text-lg font-bold">
                -{activeWager} XP
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 mt-6">
        <motion.button
          onClick={handleConfirm}
          disabled={!isValidWager}
          className={`relative px-10 py-4 font-mono text-sm tracking-[0.2em] rounded-lg overflow-hidden transition-all ${
            isValidWager
              ? "text-amber-300 cursor-pointer"
              : "text-white/15 cursor-not-allowed"
          }`}
          animate={
            shaking
              ? {
                  x: [0, -4, 4, -4, 4, -2, 2, 0],
                  transition: { duration: 0.5 },
                }
              : {}
          }
          whileHover={isValidWager ? { scale: 1.02 } : {}}
          whileTap={isValidWager ? { scale: 0.98 } : {}}
        >
          <div
            className={`absolute inset-0 border rounded-lg ${isValidWager ? "border-amber-500/50" : "border-white/5"}`}
          />
          <div
            className={`absolute inset-0 ${isValidWager ? "bg-amber-500/10" : "bg-white/[0.01]"}`}
          />
          {isValidWager && (
            <motion.div
              className="absolute inset-0 rounded-lg"
              animate={{
                boxShadow: [
                  "0 0 15px rgba(251,191,36,0.1)",
                  "0 0 30px rgba(251,191,36,0.2)",
                  "0 0 15px rgba(251,191,36,0.1)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          <span className="relative z-10">
            PLACE WAGER — {activeWager > 0 ? `${activeWager} XP` : "..."}
          </span>
        </motion.button>

        <button
          onClick={onSkip}
          className="px-6 py-2 font-mono text-[11px] tracking-wider text-white/20 hover:text-white/40 transition-colors"
        >
          SKIP — NO WAGER
        </button>
      </div>

      <p className="text-white/10 font-mono text-[9px] mt-4">
        SCORE 80% OR HIGHER TO WIN
      </p>
    </motion.div>
  );
}

/* Wager result overlay shown on the quiz complete screen */
export function WagerResult({
  won,
  amount,
}: {
  won: boolean;
  amount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: "spring", damping: 15 }}
      className="my-4"
    >
      {won ? (
        <motion.div
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10"
          animate={{
            boxShadow: [
              "0 0 20px rgba(16,185,129,0.1)",
              "0 0 40px rgba(16,185,129,0.25)",
              "0 0 20px rgba(16,185,129,0.1)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-2xl">&#x1f3c6;</span>
          <div className="text-left">
            <div className="text-emerald-400/60 font-mono text-[9px] tracking-wider">
              WAGER WON
            </div>
            <div className="text-emerald-300 font-mono text-xl font-bold">
              +{amount} XP
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-red-500/20 bg-red-500/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-2xl opacity-50">&#x1f4b8;</span>
          <div className="text-left">
            <div className="text-red-400/50 font-mono text-[9px] tracking-wider">
              WAGER LOST
            </div>
            <div className="text-red-400/70 font-mono text-xl font-bold">
              -{amount} XP
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
