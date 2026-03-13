"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { getTeachBackXP } from "@/lib/data";

interface TeachBackProps {
  topic: string;
  levels: { level: number; content: string }[];
  lang?: string;
  onClose: () => void;
}

interface EvalResult {
  score: number;
  coveredConcepts: string[];
  missedConcepts: string[];
  feedback: string;
}

type TeachBackState = "intro" | "writing" | "evaluating" | "result";

export default function TeachBack({ topic, levels, lang, onClose }: TeachBackProps) {
  const { data: dataLayer } = useAuth();
  const [state, setState] = useState<TeachBackState>("intro");
  const [text, setText] = useState("");
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState(0);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = wordCount >= 30;

  // Keyboard: Escape to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSubmit() {
    setState("evaluating");
    setError(null);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, explanation: text, levels, lang }),
      });
      if (!res.ok) throw new Error("Evaluation failed");
      const data = await res.json();
      setResult(data);

      const xpAmount = getTeachBackXP(data.score || 0);
      const xpResult = await dataLayer.addXP(xpAmount);
      setXpEarned(xpResult.xpGained);

      setState("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setState("writing");
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-[#050a18]/95 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Scan lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(168,85,247,0.15) 2px, rgba(168,85,247,0.15) 4px)",
        }}
      />

      {/* Corner brackets */}
      <div className="absolute top-6 left-6 w-8 h-8 border-l-2 border-t-2 border-purple-500/30" />
      <div className="absolute top-6 right-6 w-8 h-8 border-r-2 border-t-2 border-purple-500/30" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-l-2 border-b-2 border-purple-500/30" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 border-purple-500/30" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto px-2 py-8 scrollbar-hide">
        <AnimatePresence mode="wait">
          {/* INTRO */}
          {state === "intro" && (
            <motion.div
              key="intro"
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="text-4xl mb-4">📝</div>
              <h2 className="text-[10px] font-mono tracking-[0.4em] text-purple-400/60 mb-2">
                KNOWLEDGE TRANSFER
              </h2>
              <h3 className="text-xl font-display text-white mb-4">
                Teach It Back
              </h3>
              <p className="text-white/40 font-serif text-sm max-w-md mx-auto mb-2">
                Explain <span className="text-white/70">{topic}</span> in your
                own words, as if teaching a friend who knows nothing about it.
              </p>
              <p className="text-white/25 font-mono text-xs mb-8">
                minimum 30 words
              </p>
              <button
                onClick={() => setState("writing")}
                className="px-8 py-3 font-mono text-sm tracking-wider rounded-lg border border-purple-500/40 text-purple-300 hover:bg-purple-500/10 transition-all"
              >
                BEGIN
              </button>
            </motion.div>
          )}

          {/* WRITING */}
          {state === "writing" && (
            <motion.div
              key="writing"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <h2 className="text-[10px] font-mono tracking-[0.4em] text-purple-400/60 mb-4 text-center">
                EXPLAIN: {topic.toUpperCase()}
              </h2>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your explanation here..."
                className="w-full h-56 sm:h-64 p-5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-purple-500/30 focus:bg-white/[0.05] text-white/80 font-serif text-[15px] leading-relaxed resize-none outline-none placeholder:text-white/20 transition-all"
                autoFocus
              />

              <div className="flex items-center justify-between mt-3">
                <span
                  className={`font-mono text-xs ${
                    canSubmit ? "text-emerald-400/60" : "text-white/25"
                  }`}
                >
                  {wordCount} words
                </span>

                {error && (
                  <span className="text-red-400 text-xs font-sans">{error}</span>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="px-6 py-2.5 font-mono text-sm tracking-wider rounded-lg border border-purple-500/40 text-purple-300 hover:bg-purple-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  SUBMIT
                </button>
              </div>
            </motion.div>
          )}

          {/* EVALUATING */}
          {state === "evaluating" && (
            <motion.div
              key="evaluating"
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EvalLoadingSequence />
            </motion.div>
          )}

          {/* RESULT */}
          {state === "result" && result && (
            <motion.div
              key="result"
              className="text-center max-w-lg mx-auto"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-[10px] font-mono text-purple-500/60 tracking-[0.4em] mb-4">
                EVALUATION COMPLETE
              </div>

              {/* Score circle */}
              <motion.div
                className="relative w-32 h-32 mx-auto mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, type: "spring" }}
              >
                <svg
                  className="w-full h-full -rotate-90"
                  viewBox="0 0 120 120"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="url(#teachGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                    animate={{
                      strokeDashoffset:
                        2 * Math.PI * 52 * (1 - result.score / 100),
                    }}
                    transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient
                      id="teachGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    className="font-mono text-3xl text-white font-bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {result.score}
                  </motion.span>
                  <span className="text-white/30 text-[10px] font-mono">
                    / 100
                  </span>
                </div>
              </motion.div>

              {/* Concepts */}
              <motion.div
                className="mt-6 space-y-2 text-left"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                {result.coveredConcepts?.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5"
                  >
                    <span className="text-emerald-400 text-xs">✓</span>
                    <span className="text-white/60 text-sm font-serif">
                      {c}
                    </span>
                  </div>
                ))}
                {result.missedConcepts?.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/5"
                  >
                    <span className="text-red-400 text-xs">✗</span>
                    <span className="text-white/50 text-sm font-serif">
                      {c}
                    </span>
                  </div>
                ))}
              </motion.div>

              {/* Feedback */}
              <motion.p
                className="mt-6 text-white/50 text-sm font-serif leading-relaxed text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
              >
                {result.feedback}
              </motion.p>

              {/* XP earned */}
              {xpEarned > 0 && (
                <motion.div
                  className="mt-4 text-emerald-400 font-mono text-sm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.6 }}
                >
                  +{xpEarned} XP earned
                </motion.div>
              )}

              {/* Close button */}
              <div className="mt-8">
                <button
                  onClick={onClose}
                  className="px-8 py-3 font-mono text-sm tracking-wider rounded-lg border border-white/10 text-white/40 hover:text-white/60 hover:bg-white/5 transition-all"
                >
                  RETURN
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function EvalLoadingSequence() {
  const [line, setLine] = useState(0);
  const lines = [
    "ANALYZING EXPLANATION...",
    "CHECKING CONCEPT COVERAGE...",
    "EVALUATING ACCURACY...",
    "GENERATING FEEDBACK...",
  ];

  useEffect(() => {
    if (line < lines.length - 1) {
      const timer = setTimeout(() => setLine((l) => l + 1), 800);
      return () => clearTimeout(timer);
    }
  }, [line, lines.length]);

  return (
    <div className="font-mono text-sm space-y-2">
      {lines.slice(0, line + 1).map((text, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: i === line ? 1 : 0.3, x: 0 }}
          className="flex items-center gap-3 justify-center"
        >
          <span className={i === line ? "text-purple-400" : "text-purple-700"}>
            {i < line ? "✓" : "▸"}
          </span>
          <span className={i === line ? "text-purple-300" : "text-purple-700"}>
            {text}
          </span>
          {i === line && (
            <motion.span
              className="inline-block w-2 h-4 bg-purple-400"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}
