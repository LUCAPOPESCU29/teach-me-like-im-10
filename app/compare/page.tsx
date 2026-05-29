"use client";

import PageTransition from "@/components/PageTransition";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/components/AuthProvider";

const SUGGESTIONS = [
  { a: "TCP", b: "UDP" },
  { a: "Mitosis", b: "Meiosis" },
  { a: "DNA", b: "RNA" },
  { a: "Capitalism", b: "Socialism" },
  { a: "Python", b: "JavaScript" },
  { a: "Atoms", b: "Molecules" },
  { a: "Bacteria", b: "Viruses" },
  { a: "AC", b: "DC Current" },
];

interface Section {
  title: string;
  content: string;
}

function parseSections(text: string): Section[] {
  const sections: Section[] = [];
  const parts = text.split(/^## /gm);
  for (const part of parts) {
    if (!part.trim()) continue;
    const newline = part.indexOf("\n");
    if (newline === -1) {
      sections.push({ title: part.trim(), content: "" });
    } else {
      sections.push({
        title: part.slice(0, newline).trim(),
        content: part.slice(newline + 1).trim(),
      });
    }
  }
  return sections;
}

function splitByTopics(content: string, topicA: string, topicB: string): { a: string; b: string; shared: string } {
  const boldA = `**${topicA}:**`;
  const boldB = `**${topicB}:**`;
  const idxA = content.indexOf(boldA);
  const idxB = content.indexOf(boldB);

  if (idxA !== -1 && idxB !== -1) {
    if (idxA < idxB) {
      return {
        a: content.slice(idxA + boldA.length, idxB).trim(),
        b: content.slice(idxB + boldB.length).trim(),
        shared: "",
      };
    } else {
      return {
        b: content.slice(idxB + boldB.length, idxA).trim(),
        a: content.slice(idxA + boldA.length).trim(),
        shared: "",
      };
    }
  }

  return { a: "", b: "", shared: content };
}

const SECTION_COLORS: Record<string, { icon: string; color: string }> = {
  "What is it?": { icon: "\uD83D\uDCA1", color: "#fbbf24" },
  "How it works": { icon: "\u2699\uFE0F", color: "#60a5fa" },
  "Used for": { icon: "\uD83C\uDFAF", color: "#34d399" },
  "Key difference": { icon: "\u26A1", color: "#f472b6" },
  "Fun fact": { icon: "\uD83C\uDF1F", color: "#c084fc" },
  "Verdict": { icon: "\uD83C\uDFC6", color: "#fb923c" },
};

export default function ComparePage() {
  const router = useRouter();
  const { data } = useAuth();
  const [topicA, setTopicA] = useState("");
  const [topicB, setTopicB] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [comparedA, setComparedA] = useState("");
  const [comparedB, setComparedB] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const handleCompare = async () => {
    if (!topicA.trim() || !topicB.trim()) return;

    setLoading(true);
    setResponse("");
    setError("");
    setComparedA(topicA.trim());
    setComparedB(topicB.trim());

    try {
      abortRef.current = new AbortController();

      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicA: topicA.trim(),
          topicB: topicB.trim(),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        throw new Error("Failed to fetch response");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

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
              accumulated += parsed.text;
              setResponse(accumulated);
            }
            if (parsed.error) {
              setError(parsed.error);
            }
          } catch {
            // skip
          }
        }
      }

      // Award XP after comparison loads
      await data.addXP(15);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (a: string, b: string) => {
    setTopicA(a);
    setTopicB(b);
  };

  const canCompare = topicA.trim().length > 0 && topicB.trim().length > 0;
  const sections = parseSections(response);
  const spanSections = ["Key difference", "Fun fact", "Verdict"];

  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col items-center px-4 pt-12 sm:pt-16 pb-24 relative overflow-hidden">
        {/* Back button */}
        <motion.button
          onClick={() => router.push("/")}
          className="absolute top-4 left-4 z-20 text-white/30 hover:text-white/60 transition-colors text-sm font-sans flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span>&larr;</span> Back
        </motion.button>

        {/* Header */}
        <motion.div
          className="text-center mb-10 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="text-5xl block mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {"\u2696\uFE0F"}
          </motion.span>
          <h1 className="font-display text-4xl sm:text-5xl text-white mb-3">
            Topic Comparison
          </h1>
          <p className="text-white/35 text-base sm:text-lg font-sans max-w-md mx-auto">
            Compare two topics side-by-side, explained like you&apos;re 10
          </p>
        </motion.div>

        {/* Input area */}
        <motion.div
          className="w-full max-w-2xl relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Topic inputs */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1">
              <label className="text-white/30 text-xs font-sans font-medium tracking-widest uppercase mb-2 block px-1">
                Topic A
              </label>
              <input
                type="text"
                value={topicA}
                onChange={(e) => setTopicA(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canCompare) handleCompare();
                }}
                placeholder="e.g. TCP"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-cyan-500/20 text-white placeholder:text-white/20 font-sans text-base focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all"
              />
            </div>

            <div className="flex-shrink-0 pt-6">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.1] text-white/50 font-mono text-sm font-bold">
                VS
              </span>
            </div>

            <div className="flex-1">
              <label className="text-white/30 text-xs font-sans font-medium tracking-widest uppercase mb-2 block px-1">
                Topic B
              </label>
              <input
                type="text"
                value={topicB}
                onChange={(e) => setTopicB(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canCompare) handleCompare();
                }}
                placeholder="e.g. UDP"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-orange-500/20 text-white placeholder:text-white/20 font-sans text-base focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.06] transition-all"
              />
            </div>
          </div>

          {/* Suggestion pills */}
          <div className="mb-6">
            <p className="text-white/20 text-xs font-sans mb-2 px-1">Try these:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={`${s.a}-${s.b}`}
                  onClick={() => handleSuggestion(s.a, s.b)}
                  className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/40 text-xs font-sans hover:bg-white/[0.08] hover:border-white/[0.15] hover:text-white/70 transition-all"
                >
                  {s.a} vs {s.b}
                </button>
              ))}
            </div>
          </div>

          {/* Compare button */}
          <motion.button
            onClick={handleCompare}
            disabled={!canCompare || loading}
            className={`w-full py-3.5 rounded-xl font-sans font-medium text-base transition-all ${
              canCompare && !loading
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 hover:border-emerald-500/40"
                : "bg-white/[0.03] border border-white/[0.06] text-white/20 cursor-not-allowed"
            }`}
            whileHover={canCompare && !loading ? { scale: 1.01 } : {}}
            whileTap={canCompare && !loading ? { scale: 0.99 } : {}}
          >
            {loading ? "Comparing..." : "\u2696\uFE0F Compare!"}
          </motion.button>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {(loading || response || error) && (
            <motion.div
              className="w-full max-w-2xl mt-8 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              {/* Loading skeleton */}
              <AnimatePresence>
                {loading && !response && (
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="h-24 rounded-xl bg-white/[0.03] border border-cyan-500/10 animate-pulse" />
                        <div className="h-24 rounded-xl bg-white/[0.03] border border-orange-500/10 animate-pulse" />
                      </div>
                    ))}
                    <div className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-sans">
                  {error}
                </div>
              )}

              {/* Comparison sections */}
              {response && !error && (
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {sections.map((section, i) => {
                    const meta = SECTION_COLORS[section.title] || { icon: "\uD83D\uDCDD", color: "#94a3b8" };
                    const isSpan = spanSections.includes(section.title);

                    if (isSpan) {
                      return (
                        <motion.div
                          key={section.title}
                          className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-5 card-hover"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">{meta.icon}</span>
                            <h3
                              className="font-sans font-semibold text-sm tracking-wide uppercase"
                              style={{ color: meta.color }}
                            >
                              {section.title}
                            </h3>
                          </div>
                          <div className="text-white/70 font-sans text-sm leading-relaxed prose-invert">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                              }}
                            >
                              {section.content}
                            </ReactMarkdown>
                          </div>
                          {loading && i === sections.length - 1 && (
                            <motion.span
                              className="inline-block w-1.5 h-4 bg-emerald-400/60 ml-0.5 align-middle rounded-sm"
                              animate={{ opacity: [1, 0, 1] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                            />
                          )}
                        </motion.div>
                      );
                    }

                    const split = splitByTopics(section.content, comparedA, comparedB);

                    return (
                      <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        {/* Section header */}
                        <div className="flex items-center gap-2 mb-3 px-1">
                          <span className="text-lg">{meta.icon}</span>
                          <h3
                            className="font-sans font-semibold text-sm tracking-wide uppercase"
                            style={{ color: meta.color }}
                          >
                            {section.title}
                          </h3>
                          <div className="flex-1 h-px bg-white/[0.06]" />
                        </div>

                        {split.a || split.b ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Topic A */}
                            <div className="bg-white/[0.03] backdrop-blur-sm border border-cyan-500/15 rounded-2xl p-4 card-hover">
                              <p className="text-cyan-400 font-sans font-medium text-xs tracking-wider uppercase mb-2">
                                {comparedA}
                              </p>
                              <div className="text-white/70 font-sans text-sm leading-relaxed">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                    strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                                  }}
                                >
                                  {split.a}
                                </ReactMarkdown>
                              </div>
                              {loading && i === sections.length - 1 && !split.b && (
                                <motion.span
                                  className="inline-block w-1.5 h-4 bg-cyan-400/60 ml-0.5 align-middle rounded-sm"
                                  animate={{ opacity: [1, 0, 1] }}
                                  transition={{ duration: 0.8, repeat: Infinity }}
                                />
                              )}
                            </div>

                            {/* Topic B */}
                            <div className="bg-white/[0.03] backdrop-blur-sm border border-orange-500/15 rounded-2xl p-4 card-hover">
                              <p className="text-orange-400 font-sans font-medium text-xs tracking-wider uppercase mb-2">
                                {comparedB}
                              </p>
                              <div className="text-white/70 font-sans text-sm leading-relaxed">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                    strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                                  }}
                                >
                                  {split.b}
                                </ReactMarkdown>
                              </div>
                              {loading && i === sections.length - 1 && (
                                <motion.span
                                  className="inline-block w-1.5 h-4 bg-orange-400/60 ml-0.5 align-middle rounded-sm"
                                  animate={{ opacity: [1, 0, 1] }}
                                  transition={{ duration: 0.8, repeat: Infinity }}
                                />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 card-hover">
                            <div className="text-white/70 font-sans text-sm leading-relaxed">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                                }}
                              >
                                {split.shared}
                              </ReactMarkdown>
                            </div>
                            {loading && i === sections.length - 1 && (
                              <motion.span
                                className="inline-block w-1.5 h-4 bg-emerald-400/60 ml-0.5 align-middle rounded-sm"
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                              />
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </PageTransition>
  );
}
