"use client";
import PageTransition from "@/components/PageTransition";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import WrongOnPurpose, { getStats, type WOPStats } from "@/components/WrongOnPurpose";

export default function WrongOnPurposePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState(2);
  const [activeTopic, setActiveTopic] = useState("");
  const [activeLevel, setActiveLevel] = useState(2);
  const [gameKey, setGameKey] = useState(0);
  const [started, setStarted] = useState(false);
  const [stats, setStats] = useState<WOPStats>({ played: 0, errorsFound: 0, totalErrors: 0 });

  useEffect(() => {
    setStats(getStats());
  }, []);

  const refreshStats = useCallback(() => {
    setStats(getStats());
  }, []);

  const handleStart = () => {
    if (!topic.trim()) return;
    setActiveTopic(topic.trim());
    setActiveLevel(level);
    setGameKey((k) => k + 1);
    setStarted(true);
  };

  const handleNewGame = () => {
    setStarted(false);
    setActiveTopic("");
    refreshStats();
  };

  const accuracy =
    stats.totalErrors > 0
      ? Math.round((stats.errorsFound / stats.totalErrors) * 100)
      : 0;

  const exampleTopics = [
    "Photosynthesis",
    "The Solar System",
    "How Volcanoes Work",
    "The Water Cycle",
    "Gravity",
    "Dinosaurs",
  ];

  return (
    <PageTransition>
    <main className="min-h-screen flex flex-col items-center px-4 pt-12 sm:pt-16 pb-24 relative">
      {/* Header */}
      <motion.div
        className="text-center mb-8 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-4xl">🔍</span>
          <h1 className="font-display text-4xl sm:text-5xl text-white">
            Wrong on <span className="text-amber-400">Purpose</span>
          </h1>
        </div>
        <p className="text-white/35 text-base sm:text-lg max-w-md mx-auto font-serif">
          Can you spot the hidden mistakes? Read carefully and find the errors.
        </p>
      </motion.div>

      {/* Stats bar */}
      {stats.played > 0 && (
        <motion.div
          className="flex items-center gap-6 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center">
            <div className="text-white/80 font-sans text-lg font-medium">{stats.played}</div>
            <div className="text-white/25 text-xs font-sans">Games</div>
          </div>
          <div className="w-px h-8 bg-white/[0.08]" />
          <div className="text-center">
            <div className="text-emerald-400/80 font-sans text-lg font-medium">{stats.errorsFound}</div>
            <div className="text-white/25 text-xs font-sans">Found</div>
          </div>
          <div className="w-px h-8 bg-white/[0.08]" />
          <div className="text-center">
            <div className="text-amber-400/80 font-sans text-lg font-medium">{accuracy}%</div>
            <div className="text-white/25 text-xs font-sans">Accuracy</div>
          </div>
        </motion.div>
      )}

      {/* Input form — show when not in a game */}
      {!started && (
        <motion.div
          className="w-full max-w-xl mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-5">
            {/* Topic input */}
            <div>
              <label className="block text-white/30 text-xs font-sans uppercase tracking-wider mb-2">
                Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleStart();
                }}
                placeholder="e.g., How rainbows form"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-serif text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-500/30 transition-colors"
              />
            </div>

            {/* Quick topic picks */}
            <div className="flex flex-wrap gap-2">
              {exampleTopics.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40 text-xs font-sans hover:text-white/70 hover:border-white/15 hover:bg-white/[0.06] transition-all duration-200"
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Difficulty selector */}
            <div>
              <label className="block text-white/30 text-xs font-sans uppercase tracking-wider mb-2">
                Difficulty
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`flex-1 py-2.5 rounded-lg border font-sans text-sm transition-all duration-200 ${
                      level === l
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                        : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/60 hover:border-white/15"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] font-sans text-white/20">
                <span>Easy</span>
                <span>Hard</span>
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={handleStart}
              disabled={!topic.trim()}
              className="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-sans text-sm font-medium hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              🔍 Start Investigating
            </button>
          </div>
        </motion.div>
      )}

      {/* Game component */}
      {started && activeTopic && (
        <WrongOnPurpose
          key={gameKey}
          topic={activeTopic}
          level={activeLevel}
          onNewGame={handleNewGame}
        />
      )}

      {/* How it works */}
      {!started && (
        <motion.div
          className="w-full max-w-xl mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
            <h3 className="text-white/50 text-xs font-sans uppercase tracking-wider mb-4">
              How It Works
            </h3>
            <div className="space-y-3">
              {[
                { step: "1", text: "AI generates an explanation with 2-3 hidden errors" },
                { step: "2", text: "Read carefully and tap the sentences you think are wrong" },
                { step: "3", text: "Submit your guesses to see how sharp your detective skills are" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400/70 text-xs font-sans font-medium flex-shrink-0">
                    {item.step}
                  </div>
                  <p className="text-white/40 text-sm font-serif leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </main>
      </PageTransition>
  );
}
