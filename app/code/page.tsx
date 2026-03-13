"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import { CODE_CATEGORIES, getDailyCodeTopic } from "@/lib/code-topics";
import { useAuth } from "@/components/AuthProvider";
import XPBadge from "@/components/XPBadge";
import UserMenu from "@/components/UserMenu";
import PullToRefresh from "@/components/PullToRefresh";
import StarBorder from "@/components/StarBorder";

export default function CodePage() {
  const router = useRouter();
  const { data: dataLayer } = useAuth();
  const dailyTopic = getDailyCodeTopic();
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(new Set());
  const [codeInput, setCodeInput] = useState("");
  const [codeInputFocused, setCodeInputFocused] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    const history = await dataLayer.getTopicHistory();
    setCompletedSlugs(new Set(history.map((t) => t.slug)));
    setLoading(false);
  }, [dataLayer]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  function goToTopic(topicName: string) {
    router.push(`/learn/${slugify(topicName)}?mode=code`);
  }

  return (
    <PullToRefresh onRefresh={refreshData}>
    <main className="min-h-screen flex flex-col items-center px-4 py-16 pb-24 relative overflow-hidden">
      {/* Ambient glow — green/cyan */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.05] blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-500/[0.04] blur-[100px] pointer-events-none" />

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
          {["#4ade80", "#38bdf8", "#a78bfa", "#fbbf24", "#f472b6"].map((color, i) => (
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
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            Code
          </span>
        </h1>
        <p className="text-white/30 text-sm font-mono tracking-wider uppercase mt-3">
          Like I&apos;m 10
        </p>
        <p className="text-white/35 text-lg max-w-md mx-auto font-serif leading-relaxed mt-4">
          From variables to APIs — programming explained at every level.
        </p>
      </motion.div>

      {/* Code topic input */}
      <motion.form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = codeInput.trim();
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
            className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-teal-500/20 blur-xl transition-opacity duration-500 ${
              codeInputFocused ? "opacity-100" : "opacity-0 group-hover:opacity-50"
            }`}
          />
          <div className="relative">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onFocus={() => setCodeInputFocused(true)}
              onBlur={() => setCodeInputFocused(false)}
              placeholder="Type any coding topic..."
              className={`w-full px-4 sm:px-6 pr-24 sm:pr-28 py-4 sm:py-5 text-base sm:text-lg rounded-2xl text-white placeholder:text-white/25 focus:outline-none transition-all duration-300 ${
                codeInputFocused
                  ? "bg-white/[0.07] border border-emerald-500/25 shadow-lg shadow-emerald-500/5"
                  : "bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10"
              }`}
            />
            <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2">
              <StarBorder
                type="submit"
                color="#34d399"
                speed="6s"
                disabled={!codeInput.trim()}
              >
                Explore
              </StarBorder>
            </div>
          </div>
        </div>
        <motion.div
          className="mt-6 flex flex-wrap justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <span className="text-white/25 text-sm mr-1 self-center font-sans">Try:</span>
          {["Recursion", "React", "APIs", "Git", "Python", "Algorithms"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => goToTopic(t)}
              className="px-3 py-1.5 text-sm bg-emerald-500/[0.05] hover:bg-emerald-500/[0.12] border border-emerald-500/[0.1] hover:border-emerald-500/25 rounded-lg text-emerald-300/40 hover:text-emerald-300/70 transition-all duration-300"
            >
              {t}
            </button>
          ))}
        </motion.div>
      </motion.form>

      {/* Daily Code Topic */}
      <motion.div
        className="w-full max-w-md mb-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={() => goToTopic(dailyTopic)}
          className="group w-full p-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08] hover:border-emerald-500/25 transition-all duration-300 text-left"
        >
          <span className="text-emerald-400/50 font-mono text-[10px] tracking-[0.2em] uppercase block mb-1.5">
            Today&apos;s Code Topic
          </span>
          <span className="text-white/90 font-display text-xl group-hover:text-white transition-colors">
            {dailyTopic}
          </span>
          <span className="text-emerald-400/40 text-xs font-sans block mt-1">
            Tap to explore all 5 levels
          </span>
        </button>
      </motion.div>

      {/* Category Grid */}
      {loading ? (
        <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-emerald-500/10 bg-white/[0.02]"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded animate-shimmer"
                  style={{
                    backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)",
                    backgroundSize: "200% auto",
                  }}
                />
                <div
                  className="h-5 w-28 rounded animate-shimmer"
                  style={{
                    backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)",
                    backgroundSize: "200% auto",
                    animationDelay: "0.1s",
                  }}
                />
              </div>
              <div
                className="h-3 w-3/4 rounded animate-shimmer mb-3"
                style={{
                  backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)",
                  backgroundSize: "200% auto",
                  animationDelay: "0.2s",
                }}
              />
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-6 rounded-lg animate-shimmer"
                    style={{
                      width: `${[60, 72, 56, 68][j]}px`,
                      backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)",
                      backgroundSize: "200% auto",
                      animationDelay: `${j * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CODE_CATEGORIES.map((cat, catIdx) => (
            <motion.div
              key={cat.id}
              className="p-5 rounded-2xl border bg-white/[0.02] backdrop-blur-sm"
              style={{ borderColor: `${cat.color}15` }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + catIdx * 0.06 }}
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
      )}

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
    </PullToRefresh>
  );
}
