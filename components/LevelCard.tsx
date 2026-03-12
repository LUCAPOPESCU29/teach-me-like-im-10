"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LEVEL_META } from "@/lib/utils";
import StreamingText from "./StreamingText";
import TopicIllustration from "./TopicIllustration";

const ANALOGY_CATEGORIES = [
  { key: "sports", emoji: "\u{1F3C0}", label: "Sports" },
  { key: "cooking", emoji: "\u{1F373}", label: "Cooking" },
  { key: "gaming", emoji: "\u{1F3AE}", label: "Video Games" },
  { key: "movies", emoji: "\u{1F3AC}", label: "Movies & TV" },
] as const;

type AnalogyCategory = (typeof ANALOGY_CATEGORIES)[number]["key"];

interface LevelCardProps {
  level: number;
  content: string;
  isStreaming: boolean;
  isLoading: boolean;
  topic?: string;
  lang?: string;
}

export default function LevelCard({
  level,
  content,
  isStreaming,
  isLoading,
  topic,
  lang,
}: LevelCardProps) {
  const meta = LEVEL_META[level - 1];
  const [selectedParagraph, setSelectedParagraph] = useState<number | null>(null);
  const [clarification, setClarification] = useState<string | null>(null);
  const [clarifyLoading, setClarifyLoading] = useState(false);

  // Analogy state
  const [showAnalogyPicker, setShowAnalogyPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState<AnalogyCategory | null>(null);
  const [analogyCache, setAnalogyCache] = useState<Partial<Record<AnalogyCategory, string>>>({});
  const [analogyStreaming, setAnalogyStreaming] = useState(false);
  const [analogyContent, setAnalogyContent] = useState("");
  const analogyAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      analogyAbortRef.current?.abort();
    };
  }, []);

  const handleParagraphClick = useCallback(
    async (text: string, index: number) => {
      if (selectedParagraph === index) {
        // Deselect
        setSelectedParagraph(null);
        setClarification(null);
        return;
      }

      setSelectedParagraph(index);
      setClarification(null);
      setClarifyLoading(true);

      try {
        const res = await fetch("/api/clarify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paragraph: text, topic, level, lang }),
        });
        if (!res.ok) throw new Error("Clarify failed");
        const data = await res.json();
        setClarification(data.clarification || "Could not simplify this.");
      } catch {
        setClarification("Something went wrong. Try again.");
      } finally {
        setClarifyLoading(false);
      }
    },
    [selectedParagraph, topic, level, lang]
  );

  const handleAnalogySelect = useCallback(
    async (category: AnalogyCategory) => {
      // Toggle off if same category clicked
      if (activeCategory === category && !analogyStreaming) {
        setActiveCategory(null);
        setAnalogyContent("");
        return;
      }

      setActiveCategory(category);

      // Check cache first
      if (analogyCache[category]) {
        setAnalogyContent(analogyCache[category]!);
        return;
      }

      // Stream new analogy
      setAnalogyStreaming(true);
      setAnalogyContent("");

      try {
        analogyAbortRef.current?.abort();
        analogyAbortRef.current = new AbortController();

        const res = await fetch("/api/analogy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, level, content, category, lang }),
          signal: analogyAbortRef.current.signal,
        });

        if (!res.ok) throw new Error("Analogy fetch failed");

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader");

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
              if (parsed.text) {
                accumulated += parsed.text;
                setAnalogyContent(accumulated);
              }
            } catch {
              // skip
            }
          }
        }

        // Cache completed result
        setAnalogyCache((prev) => ({ ...prev, [category]: accumulated }));
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setAnalogyContent("Something went wrong. Try another category.");
      } finally {
        setAnalogyStreaming(false);
      }
    },
    [activeCategory, analogyCache, analogyStreaming, topic, level, content, lang]
  );

  return (
    <motion.div
      id={`level-${level}`}
      className="relative rounded-2xl border bg-white/[0.02] backdrop-blur-sm overflow-hidden"
      style={{
        borderColor: `${meta.color}12`,
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Left accent border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{ background: `linear-gradient(to bottom, ${meta.color}, ${meta.color}40)` }}
      />

      <div className="p-6 sm:p-8 pl-7 sm:pl-10">
        {/* Level header */}
        <div className="flex items-center gap-3 mb-5">
          {topic && level === 1 ? (
            <TopicIllustration topic={topic} color={meta.color} className="w-10 h-10 opacity-60" />
          ) : (
            <span className="text-2xl">{meta.emoji}</span>
          )}
          <h2
            className="text-lg font-display font-semibold"
            style={{ color: meta.color }}
          >
            Level {level}: {meta.label}
          </h2>
        </div>

        {/* Content */}
        {isLoading && !content ? (
          <LoadingSkeleton color={meta.color} />
        ) : (
          <>
            <StreamingText
              content={content}
              isStreaming={isStreaming}
              onParagraphClick={topic ? handleParagraphClick : undefined}
              selectedParagraph={selectedParagraph}
              levelColor={meta.color}
            />

            {/* Clarification panel */}
            <AnimatePresence>
              {selectedParagraph !== null && (
                <motion.div
                  className="relative mt-2 mb-4 p-4 rounded-xl border bg-white/[0.03]"
                  style={{ borderColor: `${meta.color}30` }}
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[10px] font-mono tracking-wider uppercase"
                      style={{ color: `${meta.color}99` }}
                    >
                      Simpler explanation
                    </span>
                    <button
                      onClick={() => {
                        setSelectedParagraph(null);
                        setClarification(null);
                      }}
                      className="text-white/30 hover:text-white/60 text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {clarifyLoading ? (
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: meta.color }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className="text-white/40 text-sm font-sans">
                        Simplifying...
                      </span>
                    </div>
                  ) : (
                    <p className="text-white/70 text-sm font-serif leading-relaxed">
                      {clarification}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analogy trigger button */}
            {!isStreaming && content && (
              <motion.button
                onClick={() => setShowAnalogyPicker((prev) => !prev)}
                className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: showAnalogyPicker ? `${meta.color}20` : `${meta.color}08`,
                  border: `1px solid ${showAnalogyPicker ? `${meta.color}40` : `${meta.color}15`}`,
                  color: `${meta.color}cc`,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span>{"\u{1F504}"}</span>
                EXPLAIN WITH ANALOGIES
              </motion.button>
            )}

            {/* Analogy category picker */}
            <AnimatePresence>
              {showAnalogyPicker && (
                <motion.div
                  className="flex flex-wrap gap-2 mt-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {ANALOGY_CATEGORIES.map((cat) => {
                    const isActive = activeCategory === cat.key;
                    const isCached = !!analogyCache[cat.key];
                    return (
                      <motion.button
                        key={cat.key}
                        onClick={() => handleAnalogySelect(cat.key)}
                        disabled={analogyStreaming && activeCategory !== cat.key}
                        className="px-3 py-1.5 rounded-lg text-sm font-sans transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: isActive ? `${meta.color}25` : "rgba(255,255,255,0.04)",
                          border: `1px solid ${isActive ? `${meta.color}50` : "rgba(255,255,255,0.08)"}`,
                          color: isActive ? meta.color : "rgba(255,255,255,0.6)",
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {cat.emoji} {cat.label}
                        {isCached && !isActive && (
                          <span className="ml-1 text-[10px] opacity-50">{"\u2713"}</span>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analogy content panel */}
            <AnimatePresence>
              {activeCategory && analogyContent && (
                <motion.div
                  className="relative mt-3 p-4 rounded-xl border bg-white/[0.03]"
                  style={{ borderColor: `${meta.color}20` }}
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[10px] font-mono tracking-wider uppercase flex items-center gap-1.5"
                      style={{ color: `${meta.color}99` }}
                    >
                      {ANALOGY_CATEGORIES.find((c) => c.key === activeCategory)?.emoji}{" "}
                      {ANALOGY_CATEGORIES.find((c) => c.key === activeCategory)?.label} analogy
                    </span>
                    <button
                      onClick={() => {
                        analogyAbortRef.current?.abort();
                        setActiveCategory(null);
                        setAnalogyContent("");
                        setAnalogyStreaming(false);
                      }}
                      className="text-white/30 hover:text-white/60 text-xs transition-colors"
                    >
                      {"\u2715"}
                    </button>
                  </div>

                  <StreamingText
                    content={analogyContent}
                    isStreaming={analogyStreaming}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Subtle glow effect */}
      <div
        className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[60px] opacity-[0.04] pointer-events-none"
        style={{ backgroundColor: meta.color }}
      />
      <div
        className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-[40px] opacity-[0.02] pointer-events-none"
        style={{ backgroundColor: meta.color }}
      />
    </motion.div>
  );
}

function LoadingSkeleton({ color }: { color: string }) {
  const widths = ["w-full", "w-5/6", "w-4/6", "w-full", "w-3/4"];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-sm font-sans" style={{ color: `${color}99` }}>
          Thinking...
        </span>
      </div>
      {widths.map((w, i) => (
        <div
          key={i}
          className={`h-4 rounded ${w} animate-shimmer`}
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)",
            backgroundSize: "200% auto",
            animationDelay: `${i * 0.15}s`,
            marginTop: i === 3 ? "1.5rem" : undefined,
          }}
        />
      ))}
    </div>
  );
}
