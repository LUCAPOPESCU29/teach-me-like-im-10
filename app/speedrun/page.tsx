"use client";
import PageTransition from "@/components/PageTransition";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { slugify, unslugify, LEVEL_META } from "@/lib/utils";
import SpeedRunTimer, { formatTime } from "@/components/SpeedRunTimer";
import StreamingText from "@/components/StreamingText";
import { useAuth } from "@/components/AuthProvider";
import { useCelebration } from "@/components/CelebrationProvider";

const LEVEL_COLORS = ["#4ade80", "#facc15", "#fb923c", "#f472b6", "#a78bfa"];
const SPEEDRUN_STORAGE_KEY = "tmi10_speedruns";

interface SpeedRunRecord {
  bestTime: number;
  completedAt: string;
  levelTimes: number[];
}

interface LevelState {
  level: number;
  content: string;
  complete: boolean;
  startTime: number;
  endTime?: number;
}

function getPersonalBests(): Record<string, SpeedRunRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SPEEDRUN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePersonalBest(slug: string, record: SpeedRunRecord) {
  const bests = getPersonalBests();
  const existing = bests[slug];
  if (!existing || record.bestTime < existing.bestTime) {
    bests[slug] = record;
    localStorage.setItem(SPEEDRUN_STORAGE_KEY, JSON.stringify(bests));
    return true; // new PB
  }
  return false;
}

export default function SpeedRunPage() {
  const router = useRouter();
  const { data: dataLayer } = useAuth();
  const { celebrate } = useCelebration();

  // Topic input state
  const [topicInput, setTopicInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Speed run state
  const [slug, setSlug] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [levels, setLevels] = useState<LevelState[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [levelTimes, setLevelTimes] = useState<number[]>([]);
  const [isNewPB, setIsNewPB] = useState(false);
  const [previousBest, setPreviousBest] = useState<SpeedRunRecord | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelStartRef = useRef<number>(0);

  // Timer tick
  useEffect(() => {
    if (isRunning && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 10);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [isRunning, startTime]);

  // Cleanup
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchLevel = useCallback(
    async (level: number, previousLevels: LevelState[], topicOverride?: string) => {
      const t = topicOverride || topic;
      if (!t) return;

      setIsStreaming(true);
      setError(null);

      const now = Date.now();
      const newLevel: LevelState = {
        level,
        content: "",
        complete: false,
        startTime: now,
      };
      levelStartRef.current = now;

      // Start timer on first level
      if (level === 1) {
        setStartTime(now);
        setIsRunning(true);
      }

      const updated = [...previousLevels, newLevel];
      setLevels(updated);

      // Scroll to new level
      setTimeout(() => {
        document
          .getElementById(`speedrun-level-${level}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      try {
        abortRef.current = new AbortController();

        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: t,
            level,
            previousLevels: previousLevels
              .filter((l) => l.complete)
              .map((l) => ({ level: l.level, content: l.content })),
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

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
              if (parsed.error) throw new Error(parsed.error);
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

        // Mark level complete
        setLevels((prev) =>
          prev.map((l) =>
            l.level === level
              ? { ...l, content: accumulated, complete: true, endTime: Date.now() }
              : l
          )
        );
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(
          e instanceof Error ? e.message : "Something went wrong. Try again."
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [topic]
  );

  const handleStart = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = topicInput.trim();
      if (!trimmed) return;

      const s = slugify(trimmed);
      setSlug(s);
      setTopic(trimmed);

      // Check for previous best
      const bests = getPersonalBests();
      if (bests[s]) {
        setPreviousBest(bests[s]);
      }

      // Reset state
      setLevels([]);
      setElapsedMs(0);
      setIsComplete(false);
      setIsNewPB(false);
      setLevelTimes([]);
      setError(null);

      // Fetch level 1 (timer starts when streaming begins)
      setTimeout(() => {
        fetchLevel(1, [], trimmed);
      }, 0);
    },
    [topicInput, fetchLevel]
  );

  const handleNextLevel = useCallback(() => {
    if (isStreaming) return;
    const currentLevel = levels.length;
    const nextLevel = currentLevel + 1;

    // Record level time
    const lastLevel = levels[levels.length - 1];
    if (lastLevel?.endTime && lastLevel?.startTime) {
      setLevelTimes((prev) => [...prev, lastLevel.endTime! - lastLevel.startTime]);
    }

    if (nextLevel > 5) return;
    fetchLevel(nextLevel, levels);
  }, [levels, isStreaming, fetchLevel]);

  const handleComplete = useCallback(async () => {
    if (!slug || !startTime) return;

    // Stop timer
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const finalTime = Date.now() - startTime;
    setElapsedMs(finalTime);
    setIsComplete(true);

    // Record last level time
    const lastLevel = levels[levels.length - 1];
    const finalLevelTimes = [...levelTimes];
    if (lastLevel?.endTime && lastLevel?.startTime) {
      finalLevelTimes.push(lastLevel.endTime - lastLevel.startTime);
    }
    setLevelTimes(finalLevelTimes);

    // Save personal best
    const record: SpeedRunRecord = {
      bestTime: finalTime,
      completedAt: new Date().toISOString(),
      levelTimes: finalLevelTimes,
    };
    const isPB = savePersonalBest(slug, record);
    setIsNewPB(isPB);

    // Award XP
    const result = await dataLayer.addXP(50, "speedrun", slug);
    celebrate({
      xp: result.xpGained,
      confetti: true,
      sound: "levelUp",
    });
  }, [slug, startTime, levels, levelTimes, dataLayer, celebrate]);

  const handleShare = useCallback(() => {
    if (!topic || !slug) return;
    const time = formatTime(elapsedMs);
    const shareText = `I speed-ran "${topic}" in ${time} on Teach Me Like I'm 10! Can you beat my time?`;
    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/speedrun`;

    if (navigator.share) {
      navigator
        .share({ title: `Speed Run Challenge: ${topic}`, text: shareText, url: shareUrl })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).catch(() => {});
    }
  }, [topic, slug, elapsedMs]);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    setSlug(null);
    setTopic(null);
    setTopicInput("");
    setLevels([]);
    setElapsedMs(0);
    setStartTime(null);
    setIsRunning(false);
    setIsComplete(false);
    setIsNewPB(false);
    setLevelTimes([]);
    setPreviousBest(null);
    setError(null);
    setIsStreaming(false);
  }, []);

  const completedLevels = levels.filter((l) => l.complete).length;
  const lastLevel = levels[levels.length - 1];
  const showNextButton = lastLevel?.complete && !isStreaming && levels.length < 5;
  const showCompleteButton = lastLevel?.complete && !isStreaming && levels.length === 5 && !isComplete;

  // Personal bests section
  const [personalBests, setPersonalBests] = useState<
    { slug: string; record: SpeedRunRecord }[]
  >([]);
  useEffect(() => {
    const bests = getPersonalBests();
    const entries = Object.entries(bests)
      .map(([s, r]) => ({ slug: s, record: r }))
      .sort((a, b) => new Date(b.record.completedAt).getTime() - new Date(a.record.completedAt).getTime());
    setPersonalBests(entries);
  }, [isComplete]);

  return (
    <PageTransition>
    <main className="min-h-screen max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button
          onClick={() => router.push("/")}
          className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans mb-2 inline-block"
        >
          &larr; Home
        </button>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl sm:text-4xl text-white">
            Speed Run
          </h1>
          <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono tracking-widest uppercase">
            Race Mode
          </span>
        </div>
        <p className="text-white/30 text-sm font-sans mt-2">
          Race through all 5 levels as fast as you can. No pauses. +50 XP bonus.
        </p>
      </motion.div>

      {/* Topic Input (pre-run) */}
      {!slug && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <form onSubmit={handleStart} className="mb-10">
            <div className="relative group">
              <div
                className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-red-500/20 via-amber-500/10 to-purple-500/20 blur-xl transition-opacity duration-500 ${
                  isFocused ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                }`}
              />
              <div className="relative">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Pick a topic to speed run..."
                  className={`w-full px-6 pr-28 py-5 text-lg rounded-2xl text-white placeholder:text-white/25 focus:outline-none transition-all duration-300 ${
                    isFocused
                      ? "bg-white/[0.07] border border-white/15 shadow-lg shadow-red-500/5"
                      : "bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10"
                  }`}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!topicInput.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl font-mono text-sm tracking-wider transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 hover:border-red-500/50"
                >
                  START
                </button>
              </div>
            </div>
          </form>

          {/* Quick pick topics */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <span className="text-white/25 text-sm mr-1 self-center font-sans">
              Quick:
            </span>
            {["Black Holes", "DNA", "Quantum Computing", "The Internet", "Gravity", "Photosynthesis"].map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setTopicInput(t)}
                  className="px-3 py-1.5 text-sm bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/15 rounded-lg text-white/40 hover:text-white/70 transition-all duration-300"
                >
                  {t}
                </button>
              )
            )}
          </div>

          {/* Personal Bests */}
          {personalBests.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-lg font-display text-white/80 mb-4">
                Your Personal Bests
              </h2>
              <div className="space-y-2">
                {personalBests.slice(0, 10).map(({ slug: s, record }) => (
                  <div
                    key={s}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-colors"
                  >
                    <div>
                      <span className="text-white/70 font-sans text-sm">
                        {unslugify(s)}
                      </span>
                      <span className="text-white/20 text-xs ml-2 font-sans">
                        {new Date(record.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="font-mono text-amber-400 text-sm">
                      {formatTime(record.bestTime)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Active Speed Run */}
      {slug && (
        <>
          {/* Timer */}
          <SpeedRunTimer
            isRunning={isRunning}
            currentLevel={levels.length}
            completedLevels={completedLevels}
            elapsedMs={elapsedMs}
            isComplete={isComplete}
          />

          {/* Topic title */}
          <motion.div
            className="mt-6 mb-6 flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="font-display text-xl sm:text-2xl text-white">
              {topic}
            </h2>
            {!isComplete && (
              <button
                onClick={handleReset}
                className="text-xs text-white/20 hover:text-white/50 font-mono tracking-wider transition-colors"
              >
                ABORT
              </button>
            )}
          </motion.div>

          {/* Level cards */}
          <div className="space-y-4">
            {levels.map((level) => {
              const meta = LEVEL_META[level.level - 1];
              const levelIsStreaming = isStreaming && level.level === levels.length;
              return (
                <motion.div
                  key={level.level}
                  id={`speedrun-level-${level.level}`}
                  className="relative rounded-2xl border bg-white/[0.02] backdrop-blur-sm overflow-hidden"
                  style={{ borderColor: `${meta.color}12` }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Left accent */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
                    style={{
                      background: `linear-gradient(to bottom, ${meta.color}, ${meta.color}40)`,
                    }}
                  />

                  <div className="p-5 sm:p-6 pl-6 sm:pl-8">
                    {/* Level header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{meta.emoji}</span>
                      <h3
                        className="text-sm font-display font-semibold flex-1"
                        style={{ color: meta.color }}
                      >
                        Level {level.level}: {meta.label}
                      </h3>
                      {level.complete && level.endTime && (
                        <span
                          className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            color: `${meta.color}cc`,
                            backgroundColor: `${meta.color}15`,
                            border: `1px solid ${meta.color}25`,
                          }}
                        >
                          {formatTime(level.endTime - level.startTime)}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    {levelIsStreaming && !level.content ? (
                      <div className="flex items-center gap-2 py-4">
                        <motion.div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: meta.color }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <span
                          className="text-sm font-sans"
                          style={{ color: `${meta.color}99` }}
                        >
                          Loading...
                        </span>
                      </div>
                    ) : (
                      <StreamingText
                        content={level.content}
                        isStreaming={levelIsStreaming}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Next Level button */}
          <AnimatePresence>
            {showNextButton && (
              <motion.div
                className="mt-6 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button
                  onClick={handleNextLevel}
                  className="group relative px-8 py-4 rounded-xl font-mono text-sm tracking-widest overflow-hidden"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      border: `1px solid ${LEVEL_COLORS[levels.length]}50`,
                      background: `${LEVEL_COLORS[levels.length]}08`,
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    animate={{
                      boxShadow: [
                        `0 0 15px ${LEVEL_COLORS[levels.length]}15`,
                        `0 0 30px ${LEVEL_COLORS[levels.length]}25`,
                        `0 0 15px ${LEVEL_COLORS[levels.length]}15`,
                      ],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span
                    className="relative z-10 flex items-center gap-2"
                    style={{ color: LEVEL_COLORS[levels.length] }}
                  >
                    GOT IT &rarr; NEXT LEVEL
                  </span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Complete button */}
          <AnimatePresence>
            {showCompleteButton && (
              <motion.div
                className="mt-6 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button
                  onClick={handleComplete}
                  className="group relative px-10 py-4 rounded-xl font-mono text-sm tracking-widest overflow-hidden"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="absolute inset-0 rounded-xl border border-amber-500/40 bg-amber-500/10" />
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    animate={{
                      boxShadow: [
                        "0 0 20px rgba(251,191,36,0.1)",
                        "0 0 40px rgba(251,191,36,0.25)",
                        "0 0 20px rgba(251,191,36,0.1)",
                      ],
                    }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                  <span className="relative z-10 text-amber-400 flex items-center gap-2">
                    COMPLETE SPEED RUN
                  </span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completion results */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-6 sm:p-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* New PB badge */}
                {isNewPB && (
                  <motion.div
                    className="flex justify-center mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.4 }}
                  >
                    <span className="px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono tracking-widest">
                      NEW PERSONAL BEST!
                    </span>
                  </motion.div>
                )}

                <div className="text-center mb-6">
                  <div className="font-mono text-4xl text-amber-400 mb-1">
                    {formatTime(elapsedMs)}
                  </div>
                  <p className="text-white/40 text-sm font-sans">Total time</p>
                </div>

                {/* Level time breakdown */}
                <div className="space-y-2 mb-6">
                  <p className="text-white/40 text-xs font-mono tracking-wider uppercase mb-3">
                    Time per Level
                  </p>
                  {levelTimes.map((time, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: LEVEL_COLORS[i] }}
                        />
                        <span className="text-white/60 text-sm font-sans">
                          Level {i + 1}: {LEVEL_META[i].label}
                        </span>
                      </div>
                      <span className="font-mono text-sm" style={{ color: LEVEL_COLORS[i] }}>
                        {formatTime(time)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* XP bonus */}
                <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
                  <span className="text-emerald-400 font-mono text-sm">
                    +50 XP Speed Run Bonus
                  </span>
                </div>

                {/* Previous best comparison */}
                {previousBest && !isNewPB && (
                  <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-6">
                    <span className="text-white/40 text-sm font-sans">
                      Personal best:{" "}
                    </span>
                    <span className="text-amber-400 font-mono text-sm">
                      {formatTime(previousBest.bestTime)}
                    </span>
                    <span className="text-white/30 text-sm font-sans">
                      {" "}
                      ({elapsedMs > previousBest.bestTime ? "+" : ""}
                      {formatTime(Math.abs(elapsedMs - previousBest.bestTime))}
                      {elapsedMs > previousBest.bestTime ? " slower" : " faster"})
                    </span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap justify-center gap-3">
                  <motion.button
                    onClick={handleShare}
                    className="px-5 py-2.5 rounded-xl font-mono text-xs tracking-wider bg-white/[0.05] border border-white/10 hover:border-white/20 text-white/60 hover:text-white/90 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    SHARE CHALLENGE
                  </motion.button>
                  <motion.button
                    onClick={handleReset}
                    className="px-5 py-2.5 rounded-xl font-mono text-xs tracking-wider bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    TRY AGAIN
                  </motion.button>
                  <motion.button
                    onClick={() => router.push("/")}
                    className="px-5 py-2.5 rounded-xl font-mono text-xs tracking-wider bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/70 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    HOME
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
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
                  const validLevels = levels.filter((l) => l.complete);
                  setLevels(validLevels);
                  fetchLevel(retryLevel, validLevels);
                }}
                className="mt-2 text-red-300 hover:text-red-200 underline"
              >
                Try again
              </button>
            </motion.div>
          )}
        </>
      )}
    </main>
      </PageTransition>
  );
}
