"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import { MATH_CATEGORIES, getDailyMathTopic } from "@/lib/math-topics";
import { useAuth } from "@/components/AuthProvider";
import XPBadge from "@/components/XPBadge";
import UserMenu from "@/components/UserMenu";
import MathSolver from "@/components/MathSolver";

export default function MathPage() {
  const router = useRouter();
  const { data: dataLayer } = useAuth();
  const dailyTopic = getDailyMathTopic();
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(new Set());
  const [mathInput, setMathInput] = useState("");
  const [mathInputFocused, setMathInputFocused] = useState(false);

  useEffect(() => {
    dataLayer.getTopicHistory().then((history) => {
      const slugs = new Set(history.map((t) => t.slug));
      setCompletedSlugs(slugs);
    });
  }, [dataLayer]);

  function goToTopic(topicName: string) {
    router.push(`/learn/${slugify(topicName)}?mode=math`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-16 relative overflow-hidden">
      {/* Ambient glow — indigo/violet */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/[0.05] blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-violet-500/[0.04] blur-[100px] pointer-events-none" />

      {/* Top bar */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <XPBadge />
        <UserMenu />
      </div>
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => router.push("/")}
          className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] hover:border-white/10 font-sans text-xs transition-all duration-300"
        >
          Home
        </button>
      </div>

      {/* Hero */}
      <motion.div
        className="text-center mb-12 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <motion.div
          className="flex items-center justify-center gap-2 mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {["#60a5fa", "#a78bfa", "#34d399", "#fbbf24", "#f472b6"].map((color, i) => (
            <motion.div
              key={color}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: color, opacity: 0.6 }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>

        <h1 className="font-display text-5xl sm:text-7xl text-white mb-2 leading-tight">
          Teach Me
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            Math
          </span>
        </h1>
        <p className="text-white/30 text-sm font-mono tracking-wider uppercase mt-3">
          Like I&apos;m 10
        </p>
        <p className="text-white/35 text-lg max-w-md mx-auto font-serif leading-relaxed mt-4">
          From counting to calculus — math explained at every level.
        </p>
      </motion.div>

      {/* Math topic input */}
      <motion.form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = mathInput.trim();
          if (!trimmed) return;
          goToTopic(trimmed);
        }}
        className="w-full max-w-xl mx-auto relative z-10 mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
      >
        <div className="relative group">
          <div
            className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-violet-500/10 to-purple-500/20 blur-xl transition-opacity duration-500 ${
              mathInputFocused ? "opacity-100" : "opacity-0 group-hover:opacity-50"
            }`}
          />
          <div className="relative">
            <input
              type="text"
              value={mathInput}
              onChange={(e) => setMathInput(e.target.value)}
              onFocus={() => setMathInputFocused(true)}
              onBlur={() => setMathInputFocused(false)}
              placeholder="Type any math topic..."
              className={`w-full px-4 sm:px-6 pr-24 sm:pr-28 py-4 sm:py-5 text-base sm:text-lg rounded-2xl text-white placeholder:text-white/25 focus:outline-none transition-all duration-300 ${
                mathInputFocused
                  ? "bg-white/[0.07] border border-indigo-500/25 shadow-lg shadow-indigo-500/5"
                  : "bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10"
              }`}
            />
            <button
              type="submit"
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 px-3 sm:px-5 py-2 sm:py-2.5 bg-indigo-500/90 hover:bg-indigo-500 text-white text-sm sm:text-base rounded-xl font-medium transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/20"
              disabled={!mathInput.trim()}
            >
              Explore
            </button>
          </div>
        </div>
        <motion.div
          className="mt-6 flex flex-wrap justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <span className="text-white/25 text-sm mr-1 self-center font-sans">Try:</span>
          {["Long Division", "Matrices", "Trigonometry", "Imaginary Numbers", "Topology", "Calculus"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => goToTopic(t)}
              className="px-3 py-1.5 text-sm bg-indigo-500/[0.05] hover:bg-indigo-500/[0.12] border border-indigo-500/[0.1] hover:border-indigo-500/25 rounded-lg text-indigo-300/40 hover:text-indigo-300/70 transition-all duration-300"
            >
              {t}
            </button>
          ))}
        </motion.div>
      </motion.form>

      {/* Math Solver */}
      <motion.div
        className="w-full max-w-2xl mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.6 }}
      >
        <MathSolver />
      </motion.div>

      {/* Daily Math Topic */}
      <motion.div
        className="w-full max-w-md mb-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={() => goToTopic(dailyTopic)}
          className="group w-full p-4 rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.04] hover:bg-indigo-500/[0.08] hover:border-indigo-500/25 transition-all duration-300 text-left"
        >
          <span className="text-indigo-400/50 font-mono text-[10px] tracking-[0.2em] uppercase block mb-1.5">
            Today&apos;s Math Topic
          </span>
          <span className="text-white/90 font-display text-xl group-hover:text-white transition-colors">
            {dailyTopic}
          </span>
          <span className="text-indigo-400/40 text-xs font-sans block mt-1">
            Tap to explore all 5 levels
          </span>
        </button>
      </motion.div>

      {/* AI Tutor Chat link */}
      <motion.div
        className="w-full max-w-md mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <button
          onClick={() => router.push("/math/chat")}
          className="group w-full p-4 rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.04] hover:bg-cyan-500/[0.08] hover:border-cyan-500/25 transition-all duration-300 text-left"
        >
          <span className="text-cyan-400/50 font-mono text-[10px] tracking-[0.2em] uppercase block mb-1.5">
            Ask Anything
          </span>
          <span className="text-white/90 font-display text-xl group-hover:text-white transition-colors">
            Chat With Your Math Tutor
          </span>
          <span className="text-cyan-400/40 text-xs font-sans block mt-1">
            Get step-by-step help with any math question
          </span>
        </button>
      </motion.div>

      {/* Ancestry Tree link */}
      <motion.div
        className="w-full max-w-md mb-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <button
          onClick={() => router.push("/math/tree")}
          className="group w-full p-4 rounded-2xl border border-violet-500/15 bg-violet-500/[0.04] hover:bg-violet-500/[0.08] hover:border-violet-500/25 transition-all duration-300 text-left"
        >
          <span className="text-violet-400/50 font-mono text-[10px] tracking-[0.2em] uppercase block mb-1.5">
            Explore Connections
          </span>
          <span className="text-white/90 font-display text-xl group-hover:text-white transition-colors">
            Math Ancestry Tree
          </span>
          <span className="text-violet-400/40 text-xs font-sans block mt-1">
            See how math concepts connect and build on each other
          </span>
        </button>
      </motion.div>

      {/* Category Grid */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MATH_CATEGORIES.map((cat, catIdx) => (
          <motion.div
            key={cat.id}
            className="p-5 rounded-2xl border bg-white/[0.02] backdrop-blur-sm"
            style={{ borderColor: `${cat.color}15` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + catIdx * 0.08 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{cat.icon}</span>
              <h2 className="font-display text-lg" style={{ color: cat.color }}>
                {cat.title}
              </h2>
            </div>
            <p className="text-white/30 text-sm font-sans mb-3">{cat.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {cat.topics.map((topicName) => {
                const topicSlug = slugify(topicName);
                const isCompleted = completedSlugs.has(topicSlug);
                return (
                  <button
                    key={topicName}
                    onClick={() => goToTopic(topicName)}
                    className="px-2.5 py-1 rounded-lg text-xs font-sans transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                    style={{
                      backgroundColor: `${cat.color}10`,
                      border: `1px solid ${cat.color}20`,
                      color: `${cat.color}cc`,
                    }}
                  >
                    {isCompleted && <span className="mr-1 opacity-60">{"\u2713"}</span>}
                    {topicName}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Back link */}
      <motion.button
        onClick={() => router.push("/")}
        className="mt-12 text-white/20 hover:text-white/50 transition-colors text-sm font-sans"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Back to all topics
      </motion.button>
    </main>
  );
}
