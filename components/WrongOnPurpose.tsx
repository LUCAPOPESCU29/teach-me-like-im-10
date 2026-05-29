"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { useCelebration } from "@/components/CelebrationProvider";

interface WOPStats {
  played: number;
  errorsFound: number;
  totalErrors: number;
}

function getStats(): WOPStats {
  if (typeof window === "undefined") return { played: 0, errorsFound: 0, totalErrors: 0 };
  try {
    const raw = localStorage.getItem("tmi10_wop_stats");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { played: 0, errorsFound: 0, totalErrors: 0 };
}

function saveStats(stats: WOPStats) {
  localStorage.setItem("tmi10_wop_stats", JSON.stringify(stats));
}

// Parse the hidden errors comment from the streamed content
function parseErrors(content: string): {
  cleanText: string;
  errors: { sentence: string; explanation: string }[];
} {
  const errorMatch = content.match(/<!--\s*ERRORS:\s*([\s\S]*?)-->/);
  const cleanText = content.replace(/<!--\s*ERRORS:[\s\S]*?-->/, "").trim();

  if (!errorMatch) return { cleanText, errors: [] };

  const errorBlock = errorMatch[1].trim();
  const errors: { sentence: string; explanation: string }[] = [];

  // Parse "1. [sentence] :: [explanation]" format
  const errorEntries = errorBlock.split(/\d+\.\s+/).filter(Boolean);
  for (const entry of errorEntries) {
    const parts = entry.split("::");
    if (parts.length >= 2) {
      errors.push({
        sentence: parts[0].trim(),
        explanation: parts.slice(1).join("::").trim(),
      });
    }
  }

  return { cleanText, errors };
}

// Split text into sentences, keeping each as a unit
function splitIntoSentences(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Check if a sentence matches an error sentence using fuzzy matching
function sentenceMatchesError(sentence: string, errorSentence: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
  const s = normalize(sentence);
  const e = normalize(errorSentence);
  // exact match
  if (s === e) return true;
  // one contains the other
  if (s.includes(e) || e.includes(s)) return true;
  // word overlap >= 70%
  const sWords = new Set(s.split(" "));
  const eWords = new Set(e.split(" "));
  let overlap = 0;
  for (const w of eWords) {
    if (sWords.has(w)) overlap++;
  }
  return overlap / Math.max(eWords.size, 1) >= 0.7;
}

type Phase = "idle" | "loading" | "playing" | "results";

interface Props {
  topic: string;
  level: number;
  onNewGame?: () => void;
}

export default function WrongOnPurpose({ topic, level, onNewGame }: Props) {
  const { data } = useAuth();
  const { playSound } = useCelebration();
  const [phase, setPhase] = useState<Phase>("idle");
  const [streamedText, setStreamedText] = useState("");
  const [sentences, setSentences] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ sentence: string; explanation: string }[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<{
    correctFinds: number[];
    missed: number[];
    falsePositives: number[];
    score: number;
    total: number;
  } | null>(null);
  const streamRef = useRef(false);

  const startGame = useCallback(async () => {
    setPhase("loading");
    setStreamedText("");
    setSentences([]);
    setErrors([]);
    setSelectedIndices(new Set());
    setResults(null);
    streamRef.current = true;

    try {
      const res = await fetch("/api/wrong-on-purpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, level }),
      });

      if (!res.ok) throw new Error("API error");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!streamRef.current) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const d = line.slice(6).trim();
          if (d === "[DONE]") continue;
          try {
            const parsed = JSON.parse(d);
            if (parsed.text) {
              full += parsed.text;
              setStreamedText(full);
            }
          } catch {}
        }
      }

      // Parse when done
      const { cleanText, errors: parsedErrors } = parseErrors(full);
      const sents = splitIntoSentences(cleanText);
      setSentences(sents);
      setErrors(parsedErrors);
      setStreamedText(cleanText);
      setPhase("playing");
    } catch (err) {
      console.error("WOP stream error:", err);
      setPhase("idle");
    }
  }, [topic, level]);

  // Auto-start when topic/level provided
  useEffect(() => {
    if (topic && level && phase === "idle") {
      startGame();
    }
    return () => {
      streamRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, level]);

  const toggleSentence = (index: number) => {
    if (phase !== "playing") return;
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        playSound("pop");
      }
      return next;
    });
  };

  const submitAnswers = async () => {
    // Determine which sentence indices actually contain errors
    const errorIndices: number[] = [];
    for (let i = 0; i < sentences.length; i++) {
      for (const err of errors) {
        if (sentenceMatchesError(sentences[i], err.sentence)) {
          errorIndices.push(i);
          break;
        }
      }
    }

    const selected = Array.from(selectedIndices);
    const correctFinds = selected.filter((i) => errorIndices.includes(i));
    const falsePositives = selected.filter((i) => !errorIndices.includes(i));
    const missed = errorIndices.filter((i) => !selectedIndices.has(i));

    const score = correctFinds.length;
    const total = errorIndices.length || errors.length;

    setResults({ correctFinds, missed, falsePositives, score, total });
    setPhase("results");

    // Calculate XP: +15 per error found, +25 bonus for finding all
    let xp = score * 15;
    if (score === total && total > 0) xp += 25;
    if (xp > 0) {
      const slug = topic.toLowerCase().replace(/\s+/g, "-");
      await data.addXP(xp, "wrong_on_purpose", slug);
      playSound("levelUp");
    }

    // Update stats
    const stats = getStats();
    stats.played += 1;
    stats.errorsFound += score;
    stats.totalErrors += total;
    saveStats(stats);
  };

  const getSentenceClass = (index: number) => {
    if (phase === "results" && results) {
      if (results.correctFinds.includes(index)) {
        return "bg-emerald-500/15 border-emerald-500/40 text-emerald-300";
      }
      if (results.missed.includes(index)) {
        return "bg-rose-500/15 border-rose-500/40 text-rose-300";
      }
      if (results.falsePositives.includes(index)) {
        return "bg-white/5 border-white/10 text-white/30 line-through";
      }
      return "border-white/[0.06] text-white/60";
    }
    if (selectedIndices.has(index)) {
      return "bg-amber-500/10 border-amber-500/30 text-amber-200";
    }
    return "border-white/[0.06] text-white/70 hover:border-amber-500/20 hover:bg-amber-500/[0.04] cursor-pointer";
  };

  // Loading state
  if (phase === "loading") {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🔍</span>
            <h3 className="font-display text-xl text-white/90">Generating explanation...</h3>
          </div>
          <div className="space-y-2">
            {streamedText ? (
              <p className="text-white/50 font-serif leading-relaxed whitespace-pre-line">
                {streamedText.replace(/<!--[\s\S]*?-->/, "")}
              </p>
            ) : (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-4 bg-white/[0.04] rounded animate-pulse"
                    style={{ width: `${70 + i * 10}%` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Playing / Results phase
  if (phase === "playing" || phase === "results") {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔍</span>
              <div>
                <h3 className="font-display text-xl text-white/90">Find the Errors</h3>
                <p className="text-white/30 text-sm font-sans">
                  {phase === "playing"
                    ? "Tap sentences you think contain mistakes"
                    : "Results"}
                </p>
              </div>
            </div>
            {phase === "playing" && (
              <span className="text-amber-400/60 text-sm font-sans">
                {selectedIndices.size} selected
              </span>
            )}
          </div>

          {/* Sentences */}
          <div className="space-y-2 mb-6">
            {sentences.map((sentence, i) => (
              <motion.button
                key={i}
                onClick={() => toggleSentence(i)}
                disabled={phase === "results"}
                className={`w-full text-left px-4 py-3 rounded-xl border font-serif text-sm leading-relaxed transition-all duration-200 ${getSentenceClass(i)}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                whileHover={phase === "playing" ? { scale: 1.005 } : undefined}
                whileTap={phase === "playing" ? { scale: 0.995 } : undefined}
              >
                {sentence}
              </motion.button>
            ))}
          </div>

          {/* Submit button or Results */}
          <AnimatePresence mode="wait">
            {phase === "playing" && (
              <motion.div
                key="submit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <button
                  onClick={submitAnswers}
                  disabled={selectedIndices.size === 0}
                  className="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-sans text-sm font-medium hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Submit Answers ({selectedIndices.size} selected)
                </button>
              </motion.div>
            )}

            {phase === "results" && results && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Score card */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 text-center">
                  <motion.div
                    className="text-4xl font-display text-white mb-2"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {results.score}/{results.total}
                  </motion.div>
                  <p className="text-white/40 text-sm font-sans mb-3">
                    {results.score === results.total && results.total > 0
                      ? "Perfect detective work!"
                      : results.score > 0
                      ? "Good eye! Keep practicing."
                      : "The errors slipped by this time."}
                  </p>

                  {/* XP earned */}
                  <motion.div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className="text-emerald-400 font-sans text-sm font-medium">
                      +{results.score * 15 + (results.score === results.total && results.total > 0 ? 25 : 0)} XP
                    </span>
                    {results.score === results.total && results.total > 0 && (
                      <span className="text-emerald-400/60 text-xs font-sans">(+25 bonus!)</span>
                    )}
                  </motion.div>
                </div>

                {/* Error explanations */}
                <div className="space-y-2">
                  <h4 className="text-white/40 text-xs font-sans uppercase tracking-wider">
                    Error Details
                  </h4>
                  {errors.map((err, i) => (
                    <motion.div
                      key={i}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                    >
                      <p className="text-rose-400/80 text-sm font-serif mb-1">
                        &ldquo;{err.sentence}&rdquo;
                      </p>
                      <p className="text-white/40 text-xs font-sans">
                        {err.explanation}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-xs font-sans text-white/30 pt-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500/50" />
                    Found correctly
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/30 border border-rose-500/50" />
                    Missed error
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-white/10 border border-white/20" />
                    False positive
                  </span>
                </div>

                {/* Play again */}
                <button
                  onClick={() => {
                    setPhase("idle");
                    onNewGame?.();
                  }}
                  className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 font-sans text-sm hover:bg-white/[0.08] hover:text-white/80 transition-all duration-200"
                >
                  Play Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Idle — nothing to show, parent page handles the start
  return null;
}

export { getStats };
export type { WOPStats };
