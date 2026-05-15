"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { slugify } from "@/lib/utils";
import type { LangCode } from "@/lib/utils";

function TopicInputInner({ lang }: { lang?: LangCode }) {
  const searchParams = useSearchParams();
  const defaultTopic = searchParams.get("q") ?? "";

  const [topic, setTopic] = useState(defaultTopic);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const buildUrl = useCallback(
    (t: string) => {
      const base = `/learn/${slugify(t)}`;
      return lang && lang !== "en" ? `${base}?lang=${lang}` : base;
    },
    [lang]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = topic.trim();
      if (!trimmed) return;
      router.push(buildUrl(trimmed));
    },
    [topic, router, buildUrl]
  );

  const handleTopicClick = useCallback(
    (t: string) => {
      setTopic(t);
      router.push(buildUrl(t));
    },
    [router, buildUrl]
  );

  const hasInput = topic.trim().length > 0;

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto relative z-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Outer ambient glow — only shows on focus */}
      <div className="relative">
        <motion.div
          className="absolute -inset-4 rounded-[2.5rem] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 60%, rgba(52,211,153,0.15) 0%, transparent 70%)",
          }}
          animate={{ opacity: isFocused ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        />

        {/* Outer shell — gradient border via background */}
        <div
          className="relative p-[1.5px] rounded-[1.75rem]"
          style={{
            background: isFocused
              ? "linear-gradient(140deg, rgba(52,211,153,0.4) 0%, rgba(255,255,255,0.08) 45%, rgba(52,211,153,0.2) 100%)"
              : "linear-gradient(140deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)",
            transition: "background 0.6s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          {/* Inner container */}
          <div
            className="relative flex items-center rounded-[1.6rem] overflow-hidden"
            style={{
              backgroundColor: "#070b14",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.3)",
            }}
          >
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="What do you want to understand?"
              className="flex-1 bg-transparent px-6 py-5 text-base sm:text-lg text-white placeholder:text-white/20 focus:outline-none font-sans min-w-0"
              autoFocus
            />

            {/* Button-in-button */}
            <div className="pr-2.5 shrink-0">
              <motion.button
                type="submit"
                className="group relative flex items-center gap-2.5 pl-5 pr-2.5 py-2.5 rounded-full font-sans font-semibold text-sm overflow-hidden"
                style={{
                  background: hasInput
                    ? "linear-gradient(135deg, #34d399 0%, #10b981 100%)"
                    : "rgba(255,255,255,0.07)",
                  color: hasInput ? "#000" : "rgba(255,255,255,0.2)",
                  transition: "all 0.45s cubic-bezier(0.32,0.72,0,1)",
                }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15 }}
              >
                {/* Shimmer on hover */}
                {hasInput && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
                  />
                )}
                <span className="relative z-10">Explore</span>
                {/* Nested icon chip */}
                <div
                  className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: hasInput ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.05)",
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path
                      d="M2.5 8.5L8.5 2.5M8.5 2.5H3.5M8.5 2.5V7.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <PopularTopics onSelect={handleTopicClick} />
    </motion.form>
  );
}

export default function TopicInput({ lang }: { lang?: LangCode }) {
  return (
    <Suspense fallback={<div className="w-full max-w-2xl mx-auto h-[72px] rounded-[1.75rem] bg-white/[0.03] animate-pulse" />}>
      <TopicInputInner lang={lang} />
    </Suspense>
  );
}

function PopularTopics({ onSelect }: { onSelect: (topic: string) => void }) {
  const topics = [
    "Quantum Physics",
    "How Vaccines Work",
    "Black Holes",
    "The Stock Market",
    "CRISPR Gene Editing",
    "Neural Networks",
  ];

  return (
    <motion.div
      className="mt-5 flex flex-wrap justify-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
    >
      <span className="text-white/20 text-sm self-center font-sans">Try:</span>
      {topics.map((t, i) => (
        <motion.button
          key={t}
          type="button"
          onClick={() => onSelect(t)}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.78 + i * 0.055, ease: [0.32, 0.72, 0, 1] }}
          className="px-3.5 py-1.5 text-sm rounded-full border border-white/[0.07] bg-white/[0.025] text-white/35 hover:text-white/70 hover:bg-white/[0.07] hover:border-white/[0.14] font-sans"
          style={{ transition: "all 0.4s cubic-bezier(0.32,0.72,0,1)" }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {t}
        </motion.button>
      ))}
    </motion.div>
  );
}
