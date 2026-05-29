"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { markEggDiscovered } from "@/lib/easter-eggs";

const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  size: number;
}

function generateConfetti(count: number): ConfettiPiece[] {
  const colors = [
    "#4ade80",
    "#fbbf24",
    "#f97316",
    "#f43f5e",
    "#a855f7",
    "#06b6d4",
    "#ec4899",
    "#34d399",
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 0.8,
    rotation: Math.random() * 720 - 360,
    size: Math.random() * 8 + 4,
  }));
}

export default function EasterEggs() {
  const [triggered, setTriggered] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const inputBuffer = useRef<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerKonami = useCallback(() => {
    if (triggered) return;
    setTriggered(true);
    markEggDiscovered("konami_code");
    setConfetti(generateConfetti(80));

    // Also do a barrel roll on the main content
    const body = document.querySelector("body");
    if (body) {
      body.style.transition = "transform 1s ease-in-out";
      body.style.transform = "rotate(360deg)";
      setTimeout(() => {
        body.style.transform = "none";
        setTimeout(() => {
          body.style.transition = "";
          body.style.transform = "";
          body.style.removeProperty("transform");
        }, 100);
      }, 1000);
    }

    // Auto-dismiss after 5s
    setTimeout(() => {
      setTriggered(false);
      setConfetti([]);
    }, 5000);
  }, [triggered]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      inputBuffer.current.push(e.key);

      // Keep only the last N keys
      if (inputBuffer.current.length > KONAMI_SEQUENCE.length) {
        inputBuffer.current = inputBuffer.current.slice(
          -KONAMI_SEQUENCE.length
        );
      }

      // Reset buffer after 3 seconds of no input
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        inputBuffer.current = [];
      }, 3000);

      // Check if the buffer matches the konami code
      if (inputBuffer.current.length === KONAMI_SEQUENCE.length) {
        const matches = inputBuffer.current.every(
          (key, i) => key.toLowerCase() === KONAMI_SEQUENCE[i].toLowerCase()
        );
        if (matches) {
          inputBuffer.current = [];
          triggerKonami();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [triggerKonami]);

  return (
    <AnimatePresence>
      {triggered && (
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Confetti pieces */}
          {confetti.map((piece) => (
            <motion.div
              key={piece.id}
              className="absolute top-0 rounded-sm"
              style={{
                left: `${piece.x}%`,
                width: piece.size,
                height: piece.size * 1.5,
                backgroundColor: piece.color,
              }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{
                y: typeof window !== "undefined" ? window.innerHeight + 50 : 900,
                opacity: [1, 1, 0.8, 0],
                rotate: piece.rotation,
              }}
              transition={{
                duration: 2.5 + Math.random() * 1.5,
                delay: piece.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            />
          ))}

          {/* Secret message */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
          >
            <div className="relative pointer-events-auto">
              <motion.div
                className="px-8 py-6 rounded-2xl bg-black/90 border border-emerald-500/40 backdrop-blur-xl shadow-2xl text-center"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(52,211,153,0.2)",
                    "0 0 60px rgba(52,211,153,0.4)",
                    "0 0 20px rgba(52,211,153,0.2)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.p
                  className="text-4xl mb-2"
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  🎉
                </motion.p>
                <p className="text-emerald-400 font-mono text-lg font-bold mb-1">
                  You found the secret!
                </p>
                <p className="text-emerald-300/60 font-mono text-sm">
                  +50 XP bonus
                </p>
                <motion.div
                  className="mt-3 h-1 rounded-full bg-emerald-500/30 overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  <motion.div
                    className="h-full rounded-full bg-emerald-400"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.8, duration: 3.5 }}
                  />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
