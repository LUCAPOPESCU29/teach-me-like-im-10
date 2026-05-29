"use client";

import { useRef, useState, useCallback, useEffect, type ReactNode } from "react";

const THRESHOLD = 80;
const MAX_PULL = 140;

export default function PullToRefresh({ children }: { children: ReactNode }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const isTouchDevice = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isTouchDevice.current =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }, []);

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!isTouchDevice.current || isRefreshing) return;
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
        setReleasing(false);
      }
    },
    [isRefreshing]
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;
      if (window.scrollY > 0) {
        isPulling.current = false;
        setPullDistance(0);
        return;
      }
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) {
        // Dampen the pull for a natural rubber-band feel
        const dampened = Math.min(delta * 0.5, MAX_PULL);
        setPullDistance(dampened);
        if (delta > 10) {
          e.preventDefault();
        }
      }
    },
    [isRefreshing]
  );

  const onTouchEnd = useCallback(() => {
    if (!isPulling.current || isRefreshing) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setReleasing(true);
      setPullDistance(50);
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } else {
      setReleasing(true);
      setPullDistance(0);
      setTimeout(() => setReleasing(false), 300);
    }
  }, [pullDistance, isRefreshing]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  const pastThreshold = pullDistance >= THRESHOLD;
  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const transitionStyle =
    releasing || isRefreshing ? "transform 0.3s ease, opacity 0.3s ease" : "none";

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Refresh indicator */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          transform: `translateY(${pullDistance - 44}px)`,
          transition: transitionStyle,
          pointerEvents: "none",
          zIndex: 50,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${pastThreshold ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.1)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: progress > 0.1 ? Math.min(progress * 1.5, 1) : 0,
            transition: transitionStyle,
          }}
        >
          {isRefreshing ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ animation: "ptr-spin 0.7s linear infinite" }}
            >
              <path d="M21 12a9 9 0 1 1-6.22-8.56" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={pastThreshold ? "rgba(74,222,128,0.7)" : "rgba(255,255,255,0.4)"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: `rotate(${pastThreshold ? 180 : 0}deg)`,
                transition: "transform 0.2s ease, stroke 0.2s ease",
              }}
            >
              <path d="M12 5v14" />
              <path d="M19 12l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Content wrapper */}
      <div
        style={{
          transform: `translateY(${pullDistance > 0 ? pullDistance : 0}px)`,
          transition: transitionStyle,
        }}
      >
        {children}
      </div>

      {/* Keyframe for spinner — injected once via a style tag */}
      <style>{`
        @keyframes ptr-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
