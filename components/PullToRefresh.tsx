"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

const THRESHOLD = 80;
const MAX_PULL = 120;

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    setPulling(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling || refreshing) return;

      const diff = e.touches[0].clientY - startY.current;
      if (diff < 0) {
        setPullDistance(0);
        return;
      }

      const resistance = 0.4;
      const adjustedDiff = Math.min(diff * resistance, MAX_PULL);
      setPullDistance(adjustedDiff);

      if (diff > 10 && window.scrollY === 0) {
        e.preventDefault();
      }
    },
    [pulling, refreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    setPulling(false);

    if (pullDistance >= THRESHOLD * 0.4) {
      setRefreshing(true);
      setPullDistance(48);

      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pulling, pullDistance, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isTouchDevice = "ontouchstart" in window;
    if (!isTouchDevice) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / (THRESHOLD * 0.4), 1);

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <motion.div
        className="absolute left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
        style={{ top: -48 }}
        animate={{ y: pullDistance }}
        transition={pulling ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.div
          className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center"
          animate={{
            rotate: refreshing ? 360 : progress * 270,
            borderColor: progress >= 1 ? "rgba(74,222,128,0.6)" : "rgba(255,255,255,0.2)",
          }}
          transition={
            refreshing
              ? { duration: 0.8, repeat: Infinity, ease: "linear" }
              : { duration: 0 }
          }
        >
          <motion.svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-white/40"
            animate={{ opacity: refreshing ? 1 : progress }}
          >
            <path
              d="M1 7a6 6 0 0 1 11.2-3M13 7A6 6 0 0 1 1.8 10"
              strokeLinecap="round"
            />
            <path
              d="M12.2 1v3h-3M1.8 13v-3h3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </motion.div>
      </motion.div>

      {/* Content with pull displacement */}
      <motion.div
        animate={{ y: pullDistance }}
        transition={pulling ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
