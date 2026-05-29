"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const StudyTimer = dynamic(() => import("@/components/StudyTimer"), {
  ssr: false,
});

/**
 * Global floating study timer widget.
 * Renders a small trigger button when the timer isn't active,
 * and the full/minimized StudyTimer once opened.
 * Hidden on the dedicated /study page (which renders its own timer).
 */
export default function StudyTimerGlobal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Persist open state in sessionStorage so it survives navigation
  useEffect(() => {
    const saved = sessionStorage.getItem("tmi10_timer_open");
    if (saved === "true") {
      setOpen(true);
      setHasInteracted(true);
    }
  }, []);

  useEffect(() => {
    if (hasInteracted) {
      sessionStorage.setItem("tmi10_timer_open", String(open));
    }
  }, [open, hasInteracted]);

  // Don't show the global widget on the /study page
  if (pathname === "/study") return null;

  // Don't show on learn pages (distraction-free)
  if (pathname.startsWith("/learn/")) return null;

  return (
    <>
      {/* Floating trigger button (when timer is closed) */}
      <AnimatePresence>
        {!open && (
          <button
            onClick={() => {
              setOpen(true);
              setHasInteracted(true);
            }}
            className="fixed bottom-20 sm:bottom-6 left-4 z-[60] w-10 h-10 rounded-full bg-[#0a1020]/70 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20 flex items-center justify-center text-white/40 hover:text-emerald-400 hover:border-emerald-500/20 transition-all duration-300 group"
            aria-label="Open study timer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="group-hover:scale-110 transition-transform"
            >
              <circle cx="8" cy="9" r="6" />
              <path d="M8 6v3l2 1.5" />
              <path d="M6 2h4" />
            </svg>
          </button>
        )}
      </AnimatePresence>

      {/* Timer modal/pill */}
      <AnimatePresence>
        {open && (
          <StudyTimer
            defaultView="full"
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
