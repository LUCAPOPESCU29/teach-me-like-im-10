"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StreamingText from "./StreamingText";

const EXAMPLES = [
  "2x + 5 = 15",
  "Factor x² - 9",
  "What is 3/4 + 2/5?",
  "Find 25% of 80",
  "Area of circle with radius 7",
  "Solve x² - 5x + 6 = 0",
];

export default function MathSolver() {
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const solutionRef = useRef<HTMLDivElement>(null);

  // Cycle placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  async function handleSolve(input?: string) {
    const text = (input || problem).trim();
    if (!text || isStreaming) return;

    if (input) setProblem(input);
    setError(null);
    setSolution("");
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: text }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              accumulated += parsed.text;
              setSolution(accumulated);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message || "Failed to solve. Try again!");
      }
    } finally {
      setIsStreaming(false);
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
    setIsStreaming(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSolve();
    }
  }

  function handleNewProblem() {
    setSolution("");
    setProblem("");
    setError(null);
  }

  return (
    <section className="w-full max-w-2xl mx-auto relative z-10">
      {/* Section label */}
      <motion.div
        className="flex items-center gap-2 mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        <span className="text-indigo-400/50 font-mono text-[10px] tracking-[0.25em] uppercase">
          Problem Solver
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
      </motion.div>

      {/* Input card */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {/* Glow behind card */}
        <div
          className={`absolute -inset-2 rounded-3xl bg-gradient-to-r from-indigo-500/15 via-violet-500/10 to-purple-500/15 blur-2xl transition-opacity duration-700 ${
            isStreaming ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
          {/* Textarea */}
          <div className="p-5 pb-3">
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={EXAMPLES[placeholderIdx]}
              rows={2}
              disabled={isStreaming}
              className="w-full bg-transparent text-white/90 placeholder:text-white/20 text-lg font-serif resize-none outline-none leading-relaxed disabled:opacity-60"
            />
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-5 pb-4">
            <span className="text-[11px] text-white/20 font-mono hidden sm:block">
              {isStreaming ? "Solving..." : "\u2318+Enter to solve"}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              {solution && !isStreaming && (
                <motion.button
                  onClick={handleNewProblem}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-4 py-2 rounded-xl text-sm font-sans text-white/40 hover:text-white/70 border border-white/[0.06] hover:border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-200"
                >
                  New Problem
                </motion.button>
              )}
              <motion.button
                onClick={isStreaming ? handleCancel : () => handleSolve()}
                disabled={!problem.trim() && !isStreaming}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isStreaming
                    ? "bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25"
                    : "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:opacity-20 disabled:shadow-none disabled:cursor-not-allowed"
                }`}
              >
                {isStreaming ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    Stop
                  </span>
                ) : (
                  "Solve It!"
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick examples */}
      <AnimatePresence>
        {!solution && !isStreaming && (
          <motion.div
            className="flex flex-wrap justify-center gap-2 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <span className="text-white/20 text-xs self-center font-sans mr-1">
              Try:
            </span>
            {EXAMPLES.slice(0, 4).map((ex) => (
              <button
                key={ex}
                onClick={() => handleSolve(ex)}
                className="px-3 py-1.5 text-xs bg-indigo-500/[0.05] hover:bg-indigo-500/[0.12] border border-indigo-500/[0.08] hover:border-indigo-500/20 rounded-lg text-indigo-300/40 hover:text-indigo-300/70 transition-all duration-300 font-mono"
              >
                {ex}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/15 rounded-xl text-red-300/80 text-sm font-sans"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Solution */}
      <AnimatePresence>
        {(solution || isStreaming) && (
          <motion.div
            ref={solutionRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mt-6"
          >
            {/* Solution card */}
            <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
              {/* Top accent line */}
              <div className="h-[2px] bg-gradient-to-r from-indigo-500/50 via-violet-500/50 to-purple-500/50" />

              <div className="p-6 math-solution">
                <StreamingText
                  content={solution}
                  isStreaming={isStreaming}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
