"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { slugify, unslugify } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { useCelebration } from "@/components/CelebrationProvider";
import StreamingText from "@/components/StreamingText";
import ExplorationWeb, { type ExploreNode } from "@/components/ExplorationWeb";

const EXPLORE_XP = 10;
const STORAGE_KEY = "tmi10_explorations";

interface RelatedTopic {
  name: string;
  slug: string;
  reason: string;
}

interface ExploredTopic {
  slug: string;
  name: string;
  content: string;
  depth: number;
  parentSlug: string | null;
  suggestions: RelatedTopic[];
}

interface ExplorationSession {
  id: string;
  startedAt: string;
  topics: ExploredTopic[];
}

const RANDOM_STARTERS = [
  "Black Holes",
  "Photosynthesis",
  "The Roman Empire",
  "Neural Networks",
  "Plate Tectonics",
  "DNA",
  "Cryptocurrency",
  "The French Revolution",
  "Quantum Computing",
  "Volcanoes",
  "Game Theory",
  "Evolution",
  "The Renaissance",
  "Artificial Intelligence",
  "Fibonacci Sequence",
];

function saveExploration(session: ExplorationSession) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const sessions: ExplorationSession[] = raw ? JSON.parse(raw) : [];
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = session;
    } else {
      sessions.unshift(session);
    }
    // Keep last 20 sessions
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(sessions.slice(0, 20))
    );
  } catch {}
}

import { Suspense } from "react";
import PageTransition from "@/components/PageTransition";

function ExplorePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startSlug = searchParams.get("start");

  const { data: dataLayer } = useAuth();
  const { celebrate } = useCelebration();

  const [inputValue, setInputValue] = useState("");
  const [session, setSession] = useState<ExplorationSession | null>(null);
  const [currentContent, setCurrentContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<
    RelatedTopic[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [showWeb, setShowWeb] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const initialized = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-start if ?start= is provided
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (startSlug) {
      const topic = unslugify(startSlug);
      startExploration(topic, startSlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startSlug]);

  const fetchTopicContent = useCallback(
    async (topic: string): Promise<string> => {
      setIsStreaming(true);
      setCurrentContent("");
      setError(null);

      try {
        abortRef.current = new AbortController();

        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            level: 1,
            previousLevels: [],
            lang: "en",
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
                setCurrentContent(accumulated);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }

        return accumulated;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return "";
        const msg =
          e instanceof Error ? e.message : "Something went wrong.";
        setError(msg);
        return "";
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  const fetchSuggestions = useCallback(
    async (topic: string): Promise<RelatedTopic[]> => {
      setIsLoadingSuggestions(true);
      try {
        const res = await fetch("/api/suggest-related", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        });

        if (!res.ok) throw new Error("Failed to get suggestions");

        const data = await res.json();
        return data.suggestions || [];
      } catch {
        return [];
      } finally {
        setIsLoadingSuggestions(false);
      }
    },
    []
  );

  const startExploration = useCallback(
    async (topicName: string, topicSlug: string) => {
      const newSession: ExplorationSession = {
        id: `explore_${Date.now()}`,
        startedAt: new Date().toISOString(),
        topics: [],
      };
      setSession(newSession);
      setCurrentSuggestions([]);

      // Fetch content
      const content = await fetchTopicContent(topicName);
      if (!content) return;

      // Award XP
      const result = await dataLayer.addXP(EXPLORE_XP, "explore", topicSlug);
      celebrate({ xp: result.xpGained, sound: "chime" });

      // Fetch suggestions
      const suggestions = await fetchSuggestions(topicName);
      setCurrentSuggestions(suggestions);

      const exploredTopic: ExploredTopic = {
        slug: topicSlug,
        name: topicName,
        content,
        depth: 0,
        parentSlug: null,
        suggestions,
      };

      const updated = {
        ...newSession,
        topics: [exploredTopic],
      };
      setSession(updated);
      saveExploration(updated);
    },
    [fetchTopicContent, fetchSuggestions, dataLayer, celebrate]
  );

  const exploreTopic = useCallback(
    async (topic: RelatedTopic) => {
      if (!session || isStreaming) return;

      const currentDepth = session.topics.length;
      const parentSlug =
        session.topics.length > 0
          ? session.topics[session.topics.length - 1].slug
          : null;

      setCurrentSuggestions([]);

      // Scroll to top of content area
      contentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // Fetch content
      const content = await fetchTopicContent(topic.name);
      if (!content) return;

      // Award XP
      const result = await dataLayer.addXP(EXPLORE_XP, "explore", topic.slug);
      celebrate({ xp: result.xpGained, sound: "chime" });

      // Fetch suggestions
      const suggestions = await fetchSuggestions(topic.name);
      setCurrentSuggestions(suggestions);

      const exploredTopic: ExploredTopic = {
        slug: topic.slug,
        name: topic.name,
        content,
        depth: currentDepth,
        parentSlug,
        suggestions,
      };

      const updated = {
        ...session,
        topics: [...session.topics, exploredTopic],
      };
      setSession(updated);
      saveExploration(updated);
    },
    [session, isStreaming, fetchTopicContent, fetchSuggestions, dataLayer, celebrate]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const topic = inputValue.trim();
    if (!topic) return;
    const slug = slugify(topic);
    startExploration(topic, slug);
  };

  const handleRandom = () => {
    const topic =
      RANDOM_STARTERS[Math.floor(Math.random() * RANDOM_STARTERS.length)];
    const slug = slugify(topic);
    startExploration(topic, slug);
  };

  // Build graph nodes
  const graphNodes: ExploreNode[] = session
    ? session.topics.map((t) => ({
        slug: t.slug,
        name: t.name,
        depth: t.depth,
        parentSlug: t.parentSlug,
      }))
    : [];

  const currentTopic = session?.topics[session.topics.length - 1] ?? null;
  const depth = session?.topics.length ?? 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 lg:ml-52">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button
          onClick={() => router.push("/")}
          className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans mb-4 inline-block"
        >
          &larr; Home
        </button>
        <h1 className="font-display text-3xl sm:text-4xl text-white leading-snug">
          Explore Mode
        </h1>
        <p className="text-white/40 font-sans text-sm mt-2">
          Follow the rabbit hole. Each topic branches into 3 more.
        </p>
      </motion.div>

      {/* Start screen */}
      {!session && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter a topic to start exploring..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 font-sans text-sm focus:outline-none focus:border-white/20 transition-colors"
                autoFocus
              />
              <motion.button
                type="submit"
                disabled={!inputValue.trim()}
                className="px-6 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono text-sm tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-500/30 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                EXPLORE
              </motion.button>
            </div>
          </form>

          <div className="text-center">
            <span className="text-white/20 font-sans text-sm">or</span>
          </div>

          <motion.button
            onClick={handleRandom}
            className="w-full mt-4 py-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.05] transition-all duration-300 group"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <span className="text-white/50 group-hover:text-white/70 font-sans text-sm transition-colors">
              Start from a random topic
            </span>
          </motion.button>
        </motion.div>
      )}

      {/* Active exploration */}
      {session && (
        <>
          {/* Breadcrumb trail */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-mono tracking-wider">
                Depth: {depth} {depth === 1 ? "topic" : "topics"}
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-400 text-xs font-mono tracking-wider">
                +{depth * EXPLORE_XP} XP
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1 text-sm font-sans">
              {session.topics.map((t, i) => (
                <span key={t.slug} className="flex items-center gap-1">
                  {i > 0 && (
                    <span className="text-white/15 mx-1">&rarr;</span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      i === session.topics.length - 1
                        ? "bg-white/10 text-white/80"
                        : "text-white/30 hover:text-white/50"
                    }`}
                  >
                    {t.name}
                  </span>
                </span>
              ))}
            </div>
          </motion.div>

          {/* Current topic content */}
          <div ref={contentRef}>
            <motion.div
              key={currentTopic?.slug ?? "loading"}
              className="mb-8 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {currentTopic && (
                <h2 className="font-display text-2xl text-white mb-4">
                  {currentTopic.name}
                </h2>
              )}

              {isStreaming && currentContent.length === 0 && (
                <div className="flex items-center gap-3 py-4">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-emerald-400/60"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-white/30 font-sans text-sm">
                    Loading...
                  </span>
                </div>
              )}

              {currentContent && (
                <div className="prose prose-invert prose-sm max-w-none font-serif">
                  <StreamingText
                    content={currentContent}
                    isStreaming={isStreaming}
                  />
                </div>
              )}
            </motion.div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-sans"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p>{error}</p>
            </motion.div>
          )}

          {/* Suggestion cards */}
          {isLoadingSuggestions && (
            <div className="text-center py-6">
              <span className="text-white/30 font-sans text-sm">
                Finding related topics...
              </span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {currentSuggestions.length > 0 && !isStreaming && (
              <motion.div
                key={`suggestions-${currentTopic?.slug}`}
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-white/30 font-sans text-xs tracking-wider uppercase mb-4">
                  Where to next?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {currentSuggestions.map((suggestion, i) => (
                    <motion.button
                      key={suggestion.slug}
                      onClick={() => exploreTopic(suggestion)}
                      disabled={isStreaming}
                      className="group relative p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.06] transition-all duration-300 text-left overflow-hidden"
                      initial={{ opacity: 0, y: 20, rotateX: -5 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: i * 0.12,
                        ease: "easeOut",
                      }}
                      whileHover={{
                        scale: 1.03,
                        rotateY: i === 0 ? 2 : i === 2 ? -2 : 0,
                        transition: { duration: 0.2 },
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-emerald-500/5 to-transparent" />

                      <div className="relative z-10">
                        <h3 className="font-display text-lg text-white/90 group-hover:text-white transition-colors mb-2">
                          {suggestion.name}
                        </h3>
                        <p className="text-white/30 group-hover:text-white/50 font-sans text-xs leading-relaxed transition-colors">
                          {suggestion.reason}
                        </p>
                      </div>

                      {/* Arrow indicator */}
                      <div className="absolute top-4 right-4 text-white/10 group-hover:text-white/30 transition-colors">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M6 3L11 8L6 13"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Web visualization toggle */}
          {session.topics.length >= 2 && (
            <motion.div
              className="mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={() => setShowWeb((v) => !v)}
                className="w-full py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-all duration-200 text-white/30 hover:text-white/50 font-sans text-sm flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle
                    cx="8"
                    cy="4"
                    r="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="4"
                    cy="12"
                    r="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="8"
                    y1="6"
                    x2="4"
                    y2="10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="8"
                    y1="6"
                    x2="12"
                    y2="10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                {showWeb ? "Hide" : "Show"} Knowledge Web
              </button>

              <AnimatePresence>
                {showWeb && (
                  <motion.div
                    className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ExplorationWeb
                      nodes={graphNodes}
                      currentSlug={currentTopic?.slug ?? null}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* New exploration button */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => {
                setSession(null);
                setCurrentContent("");
                setCurrentSuggestions([]);
                setInputValue("");
                initialized.current = false;
              }}
              className="text-white/20 hover:text-white/40 font-sans text-sm transition-colors"
            >
              Start a new exploration
            </button>
          </motion.div>
        </>
      )}
    </main>
  );
}

export default function ExplorePage() {
  return (
    <PageTransition>
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center"><div className="text-white/30 font-mono text-sm animate-pulse">Loading...</div></main>}>
      <ExplorePageInner />
    </Suspense>
      </PageTransition>
  );
}
