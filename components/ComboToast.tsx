"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCombo } from "@/components/ComboTracker";

/**
 * Toast notification that slides in when combo increases.
 * Auto-dismisses after 3 seconds. Placed globally in the layout.
 */
export default function ComboToast() {
  const { comboCount, multiplier } = useCombo();
  const prevCountRef = useRef(comboCount);
  const [toast, setToast] = useState<{
    count: number;
    multiplier: number;
  } | null>(null);

  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = comboCount;

    // Show toast only when combo increases to 2+
    if (comboCount > prev && comboCount >= 2) {
      setToast({ count: comboCount, multiplier });

      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [comboCount, multiplier]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={`combo-toast-${toast.count}`}
          initial={{ opacity: 0, y: -40, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -30, x: "-50%" }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="fixed top-16 left-1/2 z-[80]"
        >
          <div
            className="
              flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-sans text-sm font-medium
              bg-[#0a1020]/90 backdrop-blur-xl
              border border-emerald-500/20
              shadow-lg shadow-emerald-500/10
              select-none whitespace-nowrap
            "
          >
            <span className="text-base">🔥</span>
            <span className="text-white/90">
              Combo x{toast.count}!
            </span>
            <span className="text-emerald-400">
              {toast.multiplier}x XP bonus
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
