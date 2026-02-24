"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { unslugify, LEVEL_META } from "@/lib/utils";
import DepthMeter from "@/components/DepthMeter";
import LevelCard from "@/components/LevelCard";
import GoDeeper from "@/components/GoDeeper";
import TopicSuggestions from "@/components/TopicSuggestions";
import QuizMode from "@/components/QuizMode";

interface LevelData {
  level: number;
  content: string;
  complete: boolean;
}

const STORAGE_PREFIX = "tmi10_";

function getCachedLevels(slug: string): LevelData[] {
  if (typeof window === "undefined") return [];
  try {
    const cached = localStorage.getItem(`${STORAGE_PREFIX}${slug}`);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function setCachedLevels(slug: string, levels: LevelData[]) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${slug}`, JSON.stringify(levels));
  } catch {
    // Storage full or unavailable
  }
}

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const topic = unslugify(slug);

  const [levels, setLevels] = useState<LevelData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingLevel, setStreamingLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const initialized = useRef(false);

  // Load from cache or start level 1
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const cached = getCachedLevels(slug);
    if (cached.length > 0) {
      setLevels(cached);
    } else {
      fetchLevel(1, []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchLevel = useCallback(
    async (level: number, previousLevels: LevelData[]) => {
      setIsStreaming(true);
      setStreamingLevel(level);
      setError(null);

      // Add the new level placeholder
      const newLevel: LevelData = { level, content: "", complete: false };
      const updated = [...previousLevels, newLevel];
      setLevels(updated);

      // Scroll to the new level after a short delay
      setTimeout(() => {
        document
          .getElementById(`level-${level}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      try {
        abortRef.current = new AbortController();

        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            level,
            previousLevels: previousLevels
              .filter((l) => l.complete)
              .map((l) => ({ level: l.level, content: l.content })),
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);

            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                accumulated += parsed.text;
                setLevels((prev) =>
                  prev.map((l) =>
                    l.level === level ? { ...l, content: accumulated } : l
                  )
                );
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }

        // Mark as complete
        setLevels((prev) => {
          const final = prev.map((l) =>
            l.level === level
              ? { ...l, content: accumulated, complete: true }
              : l
          );
          setCachedLevels(slug, final);
          return final;
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(
          e instanceof Error ? e.message : "Something went wrong. Try again."
        );
      } finally {
        setIsStreaming(false);
        setStreamingLevel(null);
      }
    },
    [topic, slug]
  );

  const handleGoDeeper = useCallback(() => {
    const nextLevel = levels.length + 1;
    if (nextLevel > 5 || isStreaming) return;
    fetchLevel(nextLevel, levels);
  }, [levels, isStreaming, fetchLevel]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (showQuiz) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "d" || e.key === "D") {
        handleGoDeeper();
      }
      if (e.key === "q" || e.key === "Q") {
        const completedLevels = levels.filter((l) => l.complete);
        if (completedLevels.length >= 2) {
          setShowQuiz(true);
        }
      }
      if (e.key === "Escape") {
        router.push("/");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleGoDeeper, router, levels, showQuiz]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const currentLevel = levels.length;
  const lastLevel = levels[levels.length - 1];
  const showGoDeeper =
    lastLevel?.complete && currentLevel < 5 && !isStreaming;
  const completedLevels = levels.filter((l) => l.complete);
  const canQuiz = completedLevels.length >= 2 && !isStreaming;

  // Dynamic background gradient based on depth
  const bgGradient = currentLevel > 0 ? LEVEL_META[Math.min(currentLevel - 1, 4)].color : LEVEL_META[0].color;

  return (
    <>
      <DepthMeter currentLevel={currentLevel} unlockedLevels={currentLevel} />

      {/* Dynamic background glow */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        animate={{
          background: `radial-gradient(ellipse at 50% 0%, ${bgGradient}08 0%, transparent 60%)`,
        }}
        transition={{ duration: 1.5 }}
      />

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 lg:ml-52">
        {/* Header */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={() => router.push("/")}
            className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans mb-4 inline-block"
          >
            ← New topic
          </button>
          <h1 className="font-display text-3xl sm:text-4xl text-white leading-snug">
            {topic}
          </h1>
          <p className="text-white/30 text-sm font-sans mt-2">
            Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[11px]">D</kbd> to go deeper
            {" · "}
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[11px]">Q</kbd> to quiz
            {" · "}
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[11px]">Esc</kbd> to go home
          </p>
        </motion.div>

        {/* Level cards */}
        <div className="space-y-6">
          {levels.map((level) => (
            <LevelCard
              key={level.level}
              level={level.level}
              content={level.content}
              isStreaming={streamingLevel === level.level}
              isLoading={
                streamingLevel === level.level && level.content.length === 0
              }
            />
          ))}
        </div>

        {/* Error state */}
        {error && (
          <motion.div
            className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>{error}</p>
            <button
              onClick={() => {
                setError(null);
                const retryLevel = levels.length;
                setLevels((prev) => prev.filter((l) => l.complete));
                fetchLevel(
                  retryLevel,
                  levels.filter((l) => l.complete)
                );
              }}
              className="mt-2 text-red-300 hover:text-red-200 underline"
            >
              Try again
            </button>
          </motion.div>
        )}

        {/* Go Deeper + Quiz Me buttons */}
        {showGoDeeper && (
          <div className="flex flex-col items-center gap-3">
            <GoDeeper
              nextLevel={currentLevel + 1}
              onClick={handleGoDeeper}
              isLoading={isStreaming}
            />
            {canQuiz && (
              <motion.button
                onClick={() => setShowQuiz(true)}
                className="group relative px-6 py-3 rounded-xl font-mono text-sm tracking-wider overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 border border-cyan-500/30 rounded-xl" />
                <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors" />
                <motion.div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  animate={{
                    boxShadow: [
                      "0 0 15px rgba(6,182,212,0.1)",
                      "0 0 25px rgba(6,182,212,0.2)",
                      "0 0 15px rgba(6,182,212,0.1)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="relative z-10 text-cyan-400 flex items-center gap-2">
                  <span className="text-lg">🧠</span>
                  QUIZ ME
                </span>
              </motion.button>
            )}
          </div>
        )}

        {/* Quiz button also at the end when all 5 levels done */}
        {currentLevel >= 5 && lastLevel?.complete && (
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-white/30 font-sans text-sm">
              You&apos;ve reached the deepest level. You now know more about
              this than most people on Earth.
            </p>
            <div className="mt-4 flex justify-center gap-3 flex-wrap">
              <motion.button
                onClick={() => setShowQuiz(true)}
                className="group relative px-8 py-3 rounded-xl font-mono text-sm tracking-wider overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 border border-cyan-500/40 rounded-xl" />
                <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors" />
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(6,182,212,0.1)",
                      "0 0 35px rgba(6,182,212,0.25)",
                      "0 0 20px rgba(6,182,212,0.1)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="relative z-10 text-cyan-300 flex items-center gap-2">
                  <span className="text-lg">🧠</span>
                  TEST YOUR KNOWLEDGE
                </span>
              </motion.button>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white/60 hover:text-white/90 transition-all duration-200 font-sans text-sm"
              >
                Try another topic
              </button>
            </div>
          </motion.div>
        )}

        {/* Suggested topics — show after level 1 is complete */}
        {currentLevel >= 1 && levels[0]?.complete && (
          <TopicSuggestions topic={topic} />
        )}
      </main>

      {/* Quiz modal */}
      <AnimatePresence>
        {showQuiz && (
          <QuizMode
            topic={topic}
            levels={completedLevels.map((l) => ({
              level: l.level,
              content: l.content,
            }))}
            onClose={() => setShowQuiz(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
