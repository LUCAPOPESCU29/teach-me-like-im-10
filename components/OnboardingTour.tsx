"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ONBOARDING_KEY = "tmi10_onboarding_done";

const STEPS = [
  {
    title: "Welcome! 👋",
    description:
      "Teach Me Like I'm 10 breaks down any topic into simple explanations. Type anything you're curious about!",
    target: "topic-input",
  },
  {
    title: "5 Depth Levels",
    description:
      "Start simple (like you're 10), then go deeper at your own pace — all the way to expert level.",
    target: "example-topics",
  },
  {
    title: "Daily Challenges",
    description:
      "Complete a new challenge every day to earn bonus XP and build your learning streak.",
    target: "daily-challenge",
  },
  {
    title: "Track Your Progress",
    description:
      "Earn XP, build streaks, unlock badges, and climb the leaderboard. Learning has never been this fun!",
    target: "xp-badge",
  },
];

export default function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      // Small delay so page renders first
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  }, []);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }, [step, dismiss]);

  if (!show) return null;

  const current = STEPS[step];

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm bg-[#0d1424] border border-white/[0.08] rounded-2xl p-6 shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Step indicator */}
              <div className="flex items-center gap-1.5 mb-4">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === step
                        ? "w-6 bg-emerald-400"
                        : i < step
                        ? "w-3 bg-emerald-400/30"
                        : "w-3 bg-white/[0.08]"
                    }`}
                  />
                ))}
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="font-display text-xl text-white mb-2">
                    {current.title}
                  </h3>
                  <p className="text-white/50 font-sans text-sm leading-relaxed mb-6">
                    {current.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={dismiss}
                  className="text-white/25 hover:text-white/50 font-sans text-xs transition-colors"
                >
                  Skip tour
                </button>
                <button
                  onClick={next}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-sans text-sm font-medium transition-colors"
                >
                  {step < STEPS.length - 1 ? "Next" : "Get Started"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
