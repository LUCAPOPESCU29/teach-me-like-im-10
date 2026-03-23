"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import useIsMobile from "@/hooks/useIsMobile";

const DARK_BLOBS = [
  { color: "rgba(52, 211, 153, 0.08)", size: 500, x: "20%", y: "25%", duration: 18, delay: 0 },
  { color: "rgba(139, 92, 246, 0.06)", size: 450, x: "70%", y: "35%", duration: 22, delay: 2 },
  { color: "rgba(59, 130, 246, 0.05)", size: 400, x: "45%", y: "60%", duration: 20, delay: 4 },
  { color: "rgba(244, 63, 94, 0.04)", size: 350, x: "80%", y: "70%", duration: 25, delay: 1 },
  { color: "rgba(251, 191, 36, 0.03)", size: 300, x: "15%", y: "75%", duration: 19, delay: 3 },
];

const LIGHT_BLOBS = [
  { color: "rgba(52, 211, 153, 0.12)", size: 500, x: "20%", y: "25%", duration: 18, delay: 0 },
  { color: "rgba(139, 92, 246, 0.10)", size: 450, x: "70%", y: "35%", duration: 22, delay: 2 },
  { color: "rgba(59, 130, 246, 0.08)", size: 400, x: "45%", y: "60%", duration: 20, delay: 4 },
  { color: "rgba(244, 63, 94, 0.06)", size: 350, x: "80%", y: "70%", duration: 25, delay: 1 },
  { color: "rgba(251, 191, 36, 0.06)", size: 300, x: "15%", y: "75%", duration: 19, delay: 3 },
];

export default function Aurora() {
  const [isDark, setIsDark] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const blobs = isDark ? DARK_BLOBS : LIGHT_BLOBS;
  // On mobile: only 2 blobs, no animation, smaller sizes
  const visibleBlobs = isMobile ? blobs.slice(0, 2) : blobs;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          background: isDark
            ? "linear-gradient(to bottom, #050810, #070b14, #0a0f1a)"
            : "linear-gradient(to bottom, #f0f4f8, #f8fafb, #eef2f7)",
        }}
      />

      {/* Animated blobs — static on mobile */}
      {visibleBlobs.map((blob, i) =>
        isMobile ? (
          <div
            key={i}
            className="absolute rounded-full will-change-auto"
            style={{
              width: blob.size * 0.7,
              height: blob.size * 0.7,
              left: blob.x,
              top: blob.y,
              background: `radial-gradient(circle, ${blob.color} 0%, transparent 70%)`,
              filter: "blur(60px)",
              transform: "translate(-50%, -50%)",
            }}
          />
        ) : (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: blob.size,
              height: blob.size,
              left: blob.x,
              top: blob.y,
              background: `radial-gradient(circle, ${blob.color} 0%, transparent 70%)`,
              filter: isDark ? "blur(80px)" : "blur(100px)",
              transform: "translate(-50%, -50%)",
            }}
            animate={{
              x: [0, 60, -40, 30, 0],
              y: [0, -50, 30, -60, 0],
              scale: [1, 1.2, 0.9, 1.15, 1],
            }}
            transition={{
              duration: blob.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: blob.delay,
            }}
          />
        )
      )}

      {/* Grain overlay — skip on mobile */}
      {!isMobile && (
        <div
          className="absolute inset-0"
          style={{
            opacity: isDark ? 0.015 : 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px 128px",
          }}
        />
      )}
    </div>
  );
}
