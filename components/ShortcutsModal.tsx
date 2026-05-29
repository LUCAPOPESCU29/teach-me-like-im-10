"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

const SHORTCUTS = [
  { key: "/", description: "Focus search" },
  { key: "?", description: "Show shortcuts" },
  { key: "h", description: "Go home" },
  { key: "p", description: "Progress" },
  { key: "b", description: "Quiz Battle" },
  { key: "m", description: "Math" },
  { key: "l", description: "Library" },
  { key: "Esc", description: "Close modal" },
];

export default function ShortcutsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md mx-4 rounded-2xl border border-white/[0.08] bg-[#0a1020]/95 backdrop-blur-xl p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#0a1020]/95 light-modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-sans font-medium text-white/90">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.1] transition-all duration-200 text-xs"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Shortcuts list */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {SHORTCUTS.map((s) => (
                <div key={s.key} className="flex items-center gap-3">
                  <kbd className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 bg-white/[0.08] border border-white/[0.15] rounded-md font-mono text-xs text-white/70">
                    {s.key}
                  </kbd>
                  <span className="text-sm font-sans text-white/50">
                    {s.description}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer hint */}
            <div className="mt-5 pt-4 border-t border-white/[0.06]">
              <p className="text-xs font-sans text-white/30 text-center">
                Shortcuts are disabled when typing in an input field
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
