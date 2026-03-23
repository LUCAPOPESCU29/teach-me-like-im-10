"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

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

const FUN_FACTS = [
  "Octopuses have three hearts and blue blood.",
  "Honey never spoils. Archaeologists found 3,000-year-old honey in Egyptian tombs that was still edible.",
  "A group of flamingos is called a 'flamboyance'.",
  "Bananas are berries, but strawberries aren't.",
  "The shortest war in history lasted 38 minutes.",
  "A cloud can weigh more than a million pounds.",
  "There are more stars in the universe than grains of sand on Earth.",
  "Wombat poop is cube-shaped.",
];

export default function NotFound() {
  const router = useRouter();
  const isDark = useTheme();
  const [fact] = useState(
    () => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      <motion.div
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Big 404 */}
        <motion.div
          className="font-display text-[120px] sm:text-[160px] leading-none font-bold select-none"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <span className="text-emerald-400/20">4</span>
          <span className="text-purple-400/20">0</span>
          <span className="text-emerald-400/20">4</span>
        </motion.div>

        <h1
          className={`font-display text-2xl sm:text-3xl mt-2 mb-3 ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          Page not found
        </h1>

        <p
          className={`font-sans text-sm mb-8 ${
            isDark ? "text-white/40" : "text-slate-500"
          }`}
        >
          This page doesn&apos;t exist, but here&apos;s a fun fact while
          you&apos;re here:
        </p>

        {/* Fun fact card */}
        <motion.div
          className={`rounded-xl border p-5 mb-8 text-left ${
            isDark
              ? "bg-white/[0.02] border-white/[0.06]"
              : "bg-white border-black/[0.06] shadow-sm"
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <p
            className={`text-xs font-sans font-semibold uppercase tracking-wider mb-2 ${
              isDark ? "text-emerald-400/50" : "text-emerald-600/60"
            }`}
          >
            Did you know?
          </p>
          <p
            className={`font-serif text-sm leading-relaxed ${
              isDark ? "text-white/60" : "text-slate-700"
            }`}
          >
            {fact}
          </p>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 text-white font-sans text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            Go Home
          </button>
          <button
            onClick={() => router.back()}
            className={`px-5 py-2.5 rounded-lg border font-sans text-sm transition-colors ${
              isDark
                ? "border-white/[0.08] text-white/50 hover:text-white/70 hover:bg-white/[0.04]"
                : "border-black/[0.08] text-slate-500 hover:text-slate-700 hover:bg-black/[0.02]"
            }`}
          >
            Go Back
          </button>
        </div>
      </motion.div>
    </main>
  );
}
