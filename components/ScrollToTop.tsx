"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function useTheme() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const update = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const isDark = useTheme();

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`fixed bottom-20 sm:bottom-8 right-4 sm:right-6 z-40 w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-md transition-colors ${
            isDark
              ? "bg-white/[0.06] border-white/[0.1] text-white/50 hover:bg-white/[0.12] hover:text-white/80"
              : "bg-black/[0.04] border-black/[0.08] text-black/40 hover:bg-black/[0.08] hover:text-black/70 shadow-sm"
          }`}
          aria-label="Scroll to top"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 12V4" />
            <path d="M4 7l4-4 4 4" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
