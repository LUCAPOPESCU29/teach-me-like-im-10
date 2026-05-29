"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const RANDOM_TOPICS = [
  { name: "Black Holes", slug: "black-holes" },
  { name: "How Dreams Work", slug: "how-dreams-work" },
  { name: "The Roman Empire", slug: "the-roman-empire" },
  { name: "Quantum Physics", slug: "quantum-physics" },
  { name: "How Bees Communicate", slug: "how-bees-communicate" },
  { name: "The Fibonacci Sequence", slug: "the-fibonacci-sequence" },
  { name: "Volcanoes", slug: "volcanoes" },
  { name: "Artificial Intelligence", slug: "artificial-intelligence" },
  { name: "Photosynthesis", slug: "photosynthesis" },
  { name: "The Speed of Light", slug: "the-speed-of-light" },
  { name: "How Memory Works", slug: "how-memory-works" },
  { name: "The Pyramids of Egypt", slug: "the-pyramids-of-egypt" },
  { name: "DNA and Genetics", slug: "dna-and-genetics" },
  { name: "The Water Cycle", slug: "the-water-cycle" },
  { name: "How Planes Fly", slug: "how-planes-fly" },
  { name: "The Renaissance", slug: "the-renaissance" },
  { name: "Ocean Currents", slug: "ocean-currents" },
  { name: "How Computers Think", slug: "how-computers-think" },
  { name: "The Solar System", slug: "the-solar-system" },
  { name: "Dinosaurs", slug: "dinosaurs" },
  { name: "How Music Affects the Brain", slug: "how-music-affects-the-brain" },
  { name: "Plate Tectonics", slug: "plate-tectonics" },
  { name: "The History of Money", slug: "the-history-of-money" },
  { name: "How Your Heart Works", slug: "how-your-heart-works" },
  { name: "The Northern Lights", slug: "the-northern-lights" },
  { name: "Stoic Philosophy", slug: "stoic-philosophy" },
  { name: "How WiFi Works", slug: "how-wifi-works" },
  { name: "The Amazon Rainforest", slug: "the-amazon-rainforest" },
  { name: "Optical Illusions", slug: "optical-illusions" },
  { name: "How Vaccines Work", slug: "how-vaccines-work" },
  { name: "The French Revolution", slug: "the-french-revolution" },
  { name: "Coral Reefs", slug: "coral-reefs" },
  { name: "How Gravity Works", slug: "how-gravity-works" },
  { name: "The Human Microbiome", slug: "the-human-microbiome" },
  { name: "Cryptocurrency", slug: "cryptocurrency" },
  { name: "How Earthquakes Happen", slug: "how-earthquakes-happen" },
];

// Lowered thresholds for reliable detection
const ACCEL_THRESHOLD = 8;           // for pure acceleration (no gravity)
const ACCEL_GRAVITY_THRESHOLD = 12;  // for accelerationIncludingGravity
const SHAKE_COUNT_THRESHOLD = 2;     // shakes needed
const SHAKE_WINDOW_MS = 800;
const COOLDOWN_MS = 2000;
const ANIMATION_CYCLES = 8;
const ANIMATION_INTERVAL_MS = 80;
const AUTO_DISMISS_MS = 5000;

function getRandomTopic(exclude?: string): (typeof RANDOM_TOPICS)[number] {
  const candidates = exclude
    ? RANDOM_TOPICS.filter((t) => t.name !== exclude)
    : RANDOM_TOPICS;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

type DMEWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

function needsIOSPermission(): boolean {
  return typeof (DeviceMotionEvent as DMEWithPermission).requestPermission === "function";
}

async function requestMotionPermission(): Promise<boolean> {
  try {
    const result = await (DeviceMotionEvent as DMEWithPermission).requestPermission!();
    return result === "granted";
  } catch {
    return false;
  }
}

export default function ShakeDetector() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [motionActive, setMotionActive] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [displayedTopic, setDisplayedTopic] = useState("");
  const [finalTopic, setFinalTopic] = useState<(typeof RANDOM_TOPICS)[number] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);

  const shakeTimestamps = useRef<number[]>([]);
  const lastShakeTime = useRef(0);
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
      autoDismissTimer.current = null;
    }
    if (animationTimer.current) {
      clearInterval(animationTimer.current);
      animationTimer.current = null;
    }
  }, []);

  const startSlotAnimation = useCallback(
    (excludeName?: string) => {
      clearTimers();
      setIsAnimating(true);
      setShowOverlay(true);

      const target = getRandomTopic(excludeName);
      let count = 0;

      animationTimer.current = setInterval(() => {
        count++;
        if (count < ANIMATION_CYCLES) {
          setDisplayedTopic(getRandomTopic().name);
        } else {
          if (animationTimer.current) clearInterval(animationTimer.current);
          animationTimer.current = null;
          setDisplayedTopic(target.name);
          setFinalTopic(target);
          setIsAnimating(false);

          autoDismissTimer.current = setTimeout(() => {
            setShowOverlay(false);
          }, AUTO_DISMISS_MS);
        }
      }, ANIMATION_INTERVAL_MS);
    },
    [clearTimers]
  );

  const handleShake = useCallback(() => {
    const now = Date.now();
    if (now - lastShakeTime.current < COOLDOWN_MS) return;
    lastShakeTime.current = now;
    startSlotAnimation(finalTopic?.name);
  }, [startSlotAnimation, finalTopic]);

  // Detect mobile
  useEffect(() => {
    const mobile =
      typeof window !== "undefined" &&
      "DeviceMotionEvent" in window &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    setIsMobile(mobile);

    if (mobile && !needsIOSPermission()) {
      // Android / older iOS — motion works immediately
      setMotionActive(true);
    } else if (mobile && needsIOSPermission()) {
      // iOS 13+ — need explicit permission, show banner
      setShowPermissionBanner(true);
    }
  }, []);

  // Handle iOS permission request (must be called from user gesture)
  const handleEnableShake = useCallback(async () => {
    const granted = await requestMotionPermission();
    if (granted) {
      setMotionActive(true);
      setShowPermissionBanner(false);
      // Save that permission was granted so we don't show banner again
      try { localStorage.setItem("tmi10_shake_enabled", "1"); } catch {}
    } else {
      setShowPermissionBanner(false);
    }
  }, []);

  // Check if iOS permission was previously granted
  useEffect(() => {
    if (showPermissionBanner) {
      try {
        if (localStorage.getItem("tmi10_shake_enabled") === "1") {
          // Re-request silently — if previously granted, iOS remembers
          requestMotionPermission().then((ok) => {
            if (ok) {
              setMotionActive(true);
              setShowPermissionBanner(false);
            }
          });
        }
      } catch {}
    }
  }, [showPermissionBanner]);

  // Listen for device motion
  useEffect(() => {
    if (!motionActive) return;

    const onMotion = (e: DeviceMotionEvent) => {
      // Prefer pure acceleration (gravity removed), fall back to with-gravity
      const acc = e.acceleration;
      const accG = e.accelerationIncludingGravity;

      let magnitude: number;
      let threshold: number;

      if (acc && (acc.x !== null || acc.y !== null || acc.z !== null)) {
        magnitude = Math.sqrt(
          (acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2
        );
        threshold = ACCEL_THRESHOLD;
      } else if (accG) {
        magnitude = Math.sqrt(
          (accG.x || 0) ** 2 + (accG.y || 0) ** 2 + (accG.z || 0) ** 2
        );
        // With gravity included, resting magnitude is ~9.8
        magnitude = Math.abs(magnitude - 9.8);
        threshold = ACCEL_GRAVITY_THRESHOLD;
      } else {
        return;
      }

      if (magnitude > threshold) {
        const now = Date.now();
        shakeTimestamps.current.push(now);
        shakeTimestamps.current = shakeTimestamps.current.filter(
          (t) => now - t < SHAKE_WINDOW_MS
        );

        if (shakeTimestamps.current.length >= SHAKE_COUNT_THRESHOLD) {
          shakeTimestamps.current = [];
          handleShake();
        }
      }
    };

    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [motionActive, handleShake]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const handleLearnThis = () => {
    if (!finalTopic) return;
    clearTimers();
    setShowOverlay(false);
    router.push(`/learn/${finalTopic.slug}`);
  };

  const handleDismiss = () => {
    clearTimers();
    setShowOverlay(false);
  };

  return (
    <>
      {/* iOS permission banner — shows once until user taps */}
      <AnimatePresence>
        {showPermissionBanner && (
          <motion.button
            key="shake-permission"
            onClick={handleEnableShake}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white/70 text-xs font-sans flex items-center gap-2 active:scale-95 transition-transform"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 2 }}
          >
            <span>📱</span>
            <span>Tap to enable shake-for-random-topic</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Shake result overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            key="shake-overlay"
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={handleDismiss}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Card */}
            <motion.div
              className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900/95 p-6 text-center shadow-2xl"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              {/* Dice icon */}
              <motion.div
                className="text-4xl mb-3"
                animate={isAnimating ? { rotate: [0, 15, -15, 10, -10, 0] } : {}}
                transition={
                  isAnimating
                    ? { duration: 0.4, repeat: Infinity, repeatType: "loop" }
                    : {}
                }
              >
                🎲
              </motion.div>

              <p className="text-white/40 text-xs font-sans uppercase tracking-widest mb-3">
                Random Topic
              </p>

              {/* Topic name */}
              <motion.h2
                key={displayedTopic}
                className="font-display text-2xl sm:text-3xl text-white mb-5 min-h-[2.5rem]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1 }}
              >
                {displayedTopic}
              </motion.h2>

              {/* Buttons */}
              {!isAnimating && finalTopic && (
                <motion.div
                  className="flex flex-col gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <button
                    onClick={handleLearnThis}
                    className="w-full py-3 rounded-xl bg-emerald-500/90 hover:bg-emerald-500 text-white font-sans font-medium text-sm transition-colors"
                  >
                    Learn this!
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 font-sans text-sm transition-colors"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Mobile-only hint text for the homepage */
export function ShakeHint() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobile =
      typeof window !== "undefined" &&
      "DeviceMotionEvent" in window &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    setIsMobile(mobile);
  }, []);

  if (!isMobile) return null;

  return (
    <p className="text-white/15 text-xs font-sans mt-3 text-center select-none">
      📱 Shake your phone for a random topic
    </p>
  );
}
