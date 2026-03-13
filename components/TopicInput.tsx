"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { slugify } from "@/lib/utils";
import type { LangCode } from "@/lib/utils";

export default function TopicInput({ lang }: { lang?: LangCode }) {
  const [topic, setTopic] = useState("");
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

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto relative z-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="relative group">
        {/* Glow effect behind input */}
        <div
          className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-purple-500/20 blur-xl transition-opacity duration-500 ${
            isFocused ? "opacity-100" : "opacity-0 group-hover:opacity-50"
          }`}
        />

        {/* Input container */}
        <div className="relative">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="What do you want to understand?"
            className={`w-full px-4 sm:px-6 pr-24 sm:pr-28 py-4 sm:py-5 text-base sm:text-lg rounded-2xl text-white placeholder:text-white/25 focus:outline-none transition-all duration-300 ${
              isFocused
                ? "bg-white/[0.07] border border-white/15 shadow-lg shadow-emerald-500/5"
                : "bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10"
            }`}
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 px-3 sm:px-5 py-2 sm:py-2.5 bg-emerald-500/90 hover:bg-emerald-500 text-white text-sm sm:text-base rounded-xl font-medium transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/20"
            disabled={!topic.trim()}
          >
            Explore
          </button>
        </div>
      </div>

      <PopularTopics onSelect={handleTopicClick} />
    </motion.form>
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
      className="mt-6 flex flex-wrap justify-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      <span className="text-white/25 text-sm mr-1 self-center font-sans">Try:</span>
      {topics.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onSelect(t)}
          className="px-3 py-1.5 text-sm bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/15 rounded-lg text-white/40 hover:text-white/70 transition-all duration-300"
        >
          {t}
        </button>
      ))}
    </motion.div>
  );
}
