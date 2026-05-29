"use client";
import PageTransition from "@/components/PageTransition";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const ERAS = [
  { label: "Ancient Egypt", period: "3000 BC", color: "#fbbf24" },
  { label: "Medieval Europe", period: "1200 AD", color: "#a78bfa" },
  { label: "Renaissance", period: "1500 AD", color: "#f472b6" },
  { label: "Victorian Era", period: "1800 AD", color: "#67e8f9" },
  { label: "The 1950s", period: "1950s", color: "#fb923c" },
  { label: "The 1980s", period: "1980s", color: "#34d399" },
];

export default function TimeMachinePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [selectedEra, setSelectedEra] = useState<number | null>(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const responseRef = useRef<HTMLDivElement>(null);

  const handleTravel = async () => {
    if (!topic.trim() || selectedEra === null) return;

    const era = ERAS[selectedEra];
    setLoading(true);
    setResponse("");
    setError("");

    try {
      const res = await fetch("/api/time-machine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          era: `${era.label} (${era.period})`,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch response");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              setResponse((prev) => prev + parsed.text);
            }
            if (parsed.error) {
              setError(parsed.error);
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const canTravel = topic.trim().length > 0 && selectedEra !== null;

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
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {"\u{1F552}\u{1F30A}"}
        </motion.span>
        <h1 className="font-display text-4xl sm:text-5xl text-white mb-3">
          Time Machine
        </h1>
        <p className="text-white/35 text-base sm:text-lg font-sans max-w-md mx-auto">
          Explain modern concepts to people from the past
        </p>
      </motion.div>

      {/* Input area */}
      <motion.div
        className="w-full max-w-xl relative z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Topic input */}
        <div className="mb-6">
          <label className="text-white/30 text-xs font-sans font-medium tracking-widest uppercase mb-2 block px-1">
            What do you want to explain?
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canTravel) handleTravel();
            }}
            placeholder="e.g. WiFi, Smartphones, Social Media..."
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 font-sans text-base focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.06] transition-all"
          />
        </div>

        {/* Era selector */}
        <div className="mb-6">
          <label className="text-white/30 text-xs font-sans font-medium tracking-widest uppercase mb-3 block px-1">
            Pick an era
          </label>
          <div className="flex flex-wrap gap-2">
            {ERAS.map((era, i) => (
              <motion.button
                key={era.label}
                onClick={() => setSelectedEra(i)}
                className={`px-4 py-2 rounded-xl font-sans text-sm border transition-all ${
                  selectedEra === i
                    ? "bg-white/[0.1] border-white/20 text-white"
                    : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:bg-white/[0.05] hover:border-white/[0.1] hover:text-white/60"
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={
                  selectedEra === i
                    ? {
                        borderColor: era.color + "60",
                        boxShadow: `0 0 20px ${era.color}15`,
                      }
                    : {}
                }
              >
                <span className="mr-1.5">
                  {i === 0 && "\u{1F3FA}"}
                  {i === 1 && "\u{1F3F0}"}
                  {i === 2 && "\u{1F3A8}"}
                  {i === 3 && "\u{1F3A9}"}
                  {i === 4 && "\u{1F4FA}"}
                  {i === 5 && "\u{1F4FC}"}
                </span>
                {era.label}{" "}
                <span className="text-white/20 text-xs">({era.period})</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Travel button */}
        <motion.button
          onClick={handleTravel}
          disabled={!canTravel || loading}
          className={`w-full py-3.5 rounded-xl font-sans font-medium text-base transition-all ${
            canTravel && !loading
              ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 hover:border-emerald-500/40"
              : "bg-white/[0.03] border border-white/[0.06] text-white/20 cursor-not-allowed"
          }`}
          whileHover={canTravel && !loading ? { scale: 1.01 } : {}}
          whileTap={canTravel && !loading ? { scale: 0.99 } : {}}
        >
          {loading ? "Traveling through time..." : "\u{1F680} Travel!"}
        </motion.button>
      </motion.div>

      {/* Portal animation + Response area */}
      <AnimatePresence>
        {(loading || response || error) && (
          <motion.div
            className="w-full max-w-xl mt-8 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            {/* Portal animation */}
            <AnimatePresence>
              {loading && !response && (
                <motion.div
                  className="flex justify-center mb-6"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.3 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div
                    className="w-24 h-24 rounded-full"
                    style={{
                      background:
                        "conic-gradient(from 0deg, #34d399, #3b82f6, #a855f7, #ec4899, #f59e0b, #34d399)",
                      filter: "blur(1px)",
                    }}
                    animate={{
                      rotate: 360,
                      scale: [1, 1.15, 1],
                      boxShadow: [
                        "0 0 30px rgba(52, 211, 153, 0.3)",
                        "0 0 60px rgba(168, 85, 247, 0.4)",
                        "0 0 30px rgba(52, 211, 153, 0.3)",
                      ],
                    }}
                    transition={{
                      rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                      scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                      boxShadow: {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }}
                  >
                    <div className="w-full h-full rounded-full bg-[#0a0a0a] m-auto scale-[0.7]" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Response text */}
            {(response || error) && (
              <motion.div
                ref={responseRef}
                className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {selectedEra !== null && (
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/[0.06]">
                    <span className="text-sm">
                      {selectedEra === 0 && "\u{1F3FA}"}
                      {selectedEra === 1 && "\u{1F3F0}"}
                      {selectedEra === 2 && "\u{1F3A8}"}
                      {selectedEra === 3 && "\u{1F3A9}"}
                      {selectedEra === 4 && "\u{1F4FA}"}
                      {selectedEra === 5 && "\u{1F4FC}"}
                    </span>
                    <span className="text-white/30 text-xs font-sans">
                      Explaining{" "}
                      <span className="text-white/50">{topic}</span> to someone
                      from{" "}
                      <span className="text-white/50">
                        {ERAS[selectedEra].label} ({ERAS[selectedEra].period})
                      </span>
                    </span>
                  </div>
                )}

                {error ? (
                  <p className="text-red-400/70 font-sans text-sm">{error}</p>
                ) : (
                  <p className="text-white/70 font-sans text-sm leading-relaxed whitespace-pre-wrap">
                    {response}
                    {loading && (
                      <motion.span
                        className="inline-block w-1.5 h-4 bg-emerald-400/60 ml-0.5 align-middle rounded-sm"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    )}
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
      </PageTransition>
  );
}
