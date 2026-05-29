"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const DISMISS_KEY = "tmi10_streak_risk_dismissed";

export default function StreakRiskWarning() {
  const { data } = useAuth();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    async function check() {
      // Respect settings toggle
      if (localStorage.getItem("tmi10_streak_reminders_off") === "true") return;

      // Don't show if already dismissed today
      const dismissed = sessionStorage.getItem(DISMISS_KEY);
      if (dismissed === new Date().toISOString().slice(0, 10)) return;

      // Only show after 10pm
      const hour = new Date().getHours();
      if (hour < 22) return;

      const xp = await data.getXP();
      if (xp.streak <= 0) return;

      const hasActivity = await data.hasActivityToday();
      if (hasActivity) return;

      setStreak(xp.streak);
      setVisible(true);
    }
    check();
  }, [data]);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, new Date().toISOString().slice(0, 10));
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="w-full max-w-xl"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full border border-amber-500/30 bg-amber-500/[0.08]">
            <span className="text-amber-400 font-sans text-sm flex-1">
              ⚠️ Your {streak}-day streak is at risk! Learn something before midnight.
            </span>
            <button
              onClick={() => router.push("/progress#freeze-shop")}
              className="text-cyan-300 hover:text-cyan-200 font-sans text-xs font-medium px-3 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors whitespace-nowrap"
            >
              ❄️ Use freeze
            </button>
            <button
              onClick={() => router.push("/")}
              className="text-amber-300 hover:text-amber-200 font-sans text-xs font-medium px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors whitespace-nowrap"
            >
              Learn now
            </button>
            <button
              onClick={dismiss}
              className="text-amber-400/60 hover:text-amber-300 transition-colors text-sm leading-none"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
