"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { unslugify, LEVEL_META } from "@/lib/utils";
import type { LangCode } from "@/lib/utils";
import DepthMeter from "@/components/DepthMeter";
import LevelCard from "@/components/LevelCard";
import GoDeeper from "@/components/GoDeeper";
import TopicSuggestions from "@/components/TopicSuggestions";
import QuizMode from "@/components/QuizMode";
import TeachBack from "@/components/TeachBack";
import LanguagePicker from "@/components/LanguagePicker";
import XPBadge from "@/components/XPBadge";
import FlashcardButton from "@/components/FlashcardButton";
import ShareButton from "@/components/ShareButton";
import BookmarkButton from "@/components/BookmarkButton";
import TopicRating from "@/components/TopicRating";
import { LEVEL_XP } from "@/lib/xp";
import { useAuth } from "@/components/AuthProvider";
import { useCelebration } from "@/components/CelebrationProvider";
import type { LevelData } from "@/lib/data";

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const topic = unslugify(slug);

  const { data: dataLayer } = useAuth();
  const { celebrate } = useCelebration();

  const mode = searchParams.get("mode");
  const isMathMode = mode === "math";
  const isCodeMode = mode === "code";

  // Language: URL param > data layer > "en"
  const urlLang = searchParams.get("lang") as LangCode | null;
  const [lang, setLang] = useState<LangCode>(() => {
    if (urlLang) return urlLang;
    return dataLayer.getLang() as LangCode;
  });

  function handleLangChange(code: LangCode) {
    setLang(code);
    dataLayer.setLang(code);
    // Reset levels when language changes
    setLevels([]);
    initialized.current = false;
    // Re-fetch level 1 in the new language
    setTimeout(async () => {
      initialized.current = true;
      const cached = await dataLayer.getTopicLevels(slug, code);
      if (cached.length > 0) {
        setLevels(cached);
      } else {
        fetchLevel(1, [], code);
      }
    }, 0);
  }

  const [levels, setLevels] = useState<LevelData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingLevel, setStreamingLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showTeachBack, setShowTeachBack] = useState(false);
  const [lastXPGain, setLastXPGain] = useState<number | null>(null);
  const [topicRating, setTopicRating] = useState<{ userRating: number | null; avgRating: number | null; totalRatings: number }>({ userRating: null, avgRating: null, totalRatings: 0 });
  const abortRef = useRef<AbortController | null>(null);
  const initialized = useRef(false);

  // Load from cache or start level 1
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    dataLayer.getTopicLevels(slug, lang).then((cached) => {
      if (cached.length > 0) {
        setLevels(cached);
      } else {
        fetchLevel(1, [], lang);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchLevel = useCallback(
    async (level: number, previousLevels: LevelData[], fetchLang?: string) => {
      const activeLang = fetchLang || lang;
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
            lang: activeLang,
            mode: isMathMode ? "math" : isCodeMode ? "code" : undefined,
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

        // Mark as complete and award XP
        let finalLevels: LevelData[] = [];
        setLevels((prev) => {
          finalLevels = prev.map((l) =>
            l.level === level
              ? { ...l, content: accumulated, complete: true }
              : l
          );
          return finalLevels;
        });

        dataLayer.saveTopicLevels(slug, activeLang, finalLevels, topic);

        const xpAmount = LEVEL_XP[level] || 10;
        const result = await dataLayer.addXP(xpAmount);
        setLastXPGain(result.xpGained);
        celebrate({
          xp: result.xpGained,
          confetti: level >= 3,
          sound: level >= 3 ? "levelUp" : "chime",
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
    [topic, slug, lang]
  );

  const handleGoDeeper = useCallback(() => {
    const nextLevel = levels.length + 1;
    if (nextLevel > 5 || isStreaming) return;
    fetchLevel(nextLevel, levels, lang);
  }, [levels, isStreaming, fetchLevel, lang]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (showQuiz || showTeachBack) return;
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
      if (e.key === "t" || e.key === "T") {
        const completedLevels = levels.filter((l) => l.complete);
        if (completedLevels.length >= 2) {
          setShowTeachBack(true);
        }
      }
      if (e.key === "Escape") {
        router.push("/");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleGoDeeper, router, levels, showQuiz, showTeachBack]);

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

  // Fetch topic ratings when all 5 levels are complete
  useEffect(() => {
    if (currentLevel < 5 || !lastLevel?.complete) return;
    fetch(`/api/topics/rating?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setTopicRating({
            userRating: data.userRating,
            avgRating: data.avgRating,
            totalRatings: data.totalRatings,
          });
        }
      })
      .catch(() => {});
  }, [currentLevel, lastLevel?.complete, slug]);

  async function handleRate(rating: number) {
    setTopicRating((prev) => ({ ...prev, userRating: rating }));
    try {
      const res = await fetch("/api/topics/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, rating }),
      });
      const data = await res.json();
      if (!data.error) {
        setTopicRating({
          userRating: data.userRating,
          avgRating: data.avgRating,
          totalRatings: data.totalRatings,
        });
      }
    } catch {}
  }

  // Dynamic background gradient based on depth
  const bgGradient = currentLevel > 0 ? LEVEL_META[Math.min(currentLevel - 1, 4)].color : LEVEL_META[0].color;

  return (
    <>
      <DepthMeter currentLevel={currentLevel} unlockedLevels={currentLevel} />

      {/* Dynamic background glow */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        animate={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${bgGradient}06 0%, transparent 50%), radial-gradient(ellipse 50% 80% at 80% 100%, ${bgGradient}03 0%, transparent 60%)`,
        }}
        transition={{ duration: 2 }}
      />

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 lg:ml-52">
        {/* Header */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(isMathMode ? "/math" : isCodeMode ? "/code" : "/")}
                className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans inline-block"
              >
                {isMathMode ? "\u2190 Math Edition" : isCodeMode ? "\u2190 Code Edition" : "\u2190 New topic"}
              </button>
              {isMathMode && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-[10px] font-mono tracking-wider uppercase">
                  Math Mode
                </span>
              )}
              {isCodeMode && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono tracking-wider uppercase">
                  Code Mode
                </span>
              )}
              <XPBadge xpGain={lastXPGain} />
            </div>
            <LanguagePicker value={lang} onChange={handleLangChange} />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl sm:text-4xl text-white leading-snug flex-1">
              {topic}
            </h1>
            <BookmarkButton slug={slug} topicName={topic} lang={lang} />
          </div>
          <p className="text-white/30 text-sm font-sans mt-2 hidden sm:block">
            Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[11px]">D</kbd> to go deeper
            {" · "}
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[11px]">Q</kbd> to quiz
            {" · "}
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[11px]">T</kbd> to teach
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
              topic={topic}
              lang={lang}
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
              <div className="flex gap-3 flex-wrap justify-center">
                <motion.button
                  onClick={() => setShowQuiz(true)}
                  className="group relative px-4 sm:px-6 py-3 rounded-xl font-mono text-sm tracking-wider overflow-hidden"
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
                <motion.button
                  onClick={() => setShowTeachBack(true)}
                  className="group relative px-4 sm:px-6 py-3 rounded-xl font-mono text-sm tracking-wider overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 border border-purple-500/30 rounded-xl" />
                  <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                  <motion.div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{
                      boxShadow: [
                        "0 0 15px rgba(168,85,247,0.1)",
                        "0 0 25px rgba(168,85,247,0.2)",
                        "0 0 15px rgba(168,85,247,0.1)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="relative z-10 text-purple-400 flex items-center gap-2">
                    <span className="text-lg">📝</span>
                    TEACH IT BACK
                  </span>
                </motion.button>
                <FlashcardButton
                  topic={topic}
                  topicSlug={slug}
                  levels={completedLevels.map((l) => ({ level: l.level, content: l.content }))}
                  lang={lang}
                />
                <ShareButton topic={topic} slug={slug} level={currentLevel} />
              </div>
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
              <motion.button
                onClick={() => setShowTeachBack(true)}
                className="group relative px-8 py-3 rounded-xl font-mono text-sm tracking-wider overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 border border-purple-500/40 rounded-xl" />
                <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                <span className="relative z-10 text-purple-300 flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  TEACH IT BACK
                </span>
              </motion.button>
              <FlashcardButton
                topic={topic}
                topicSlug={slug}
                levels={completedLevels.map((l) => ({ level: l.level, content: l.content }))}
                lang={lang}
              />
              <ShareButton topic={topic} slug={slug} level={currentLevel} />
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white/60 hover:text-white/90 transition-all duration-200 font-sans text-sm"
              >
                Try another topic
              </button>
            </div>

            {/* Topic Rating */}
            <TopicRating
              slug={slug}
              userRating={topicRating.userRating}
              avgRating={topicRating.avgRating}
              totalRatings={topicRating.totalRatings}
              onRate={handleRate}
            />
          </motion.div>
        )}

        {/* Suggested topics — show after level 1 is complete */}
        {currentLevel >= 1 && levels[0]?.complete && (
          <TopicSuggestions topic={topic} lang={lang} />
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
            lang={lang}
            onClose={() => setShowQuiz(false)}
          />
        )}
      </AnimatePresence>

      {/* Teach It Back modal */}
      <AnimatePresence>
        {showTeachBack && (
          <TeachBack
            topic={topic}
            levels={completedLevels.map((l) => ({
              level: l.level,
              content: l.content,
            }))}
            lang={lang}
            onClose={() => setShowTeachBack(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
