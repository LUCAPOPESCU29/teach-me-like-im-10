"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { slugify } from "@/lib/utils";

export default function TopicInput() {
  const [topic, setTopic] = useState("");
  const router = useRouter();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = topic.trim();
      if (!trimmed) return;
      router.push(`/learn/${slugify(trimmed)}`);
    },
    [topic, router]
  );

  const handleTopicClick = useCallback(
    (t: string) => {
      setTopic(t);
      router.push(`/learn/${slugify(t)}`);
    },
    [router]
  );

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="relative group">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What do you want to understand?"
          className="w-full px-6 py-5 text-lg bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all duration-300"
          autoFocus
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-emerald-500/90 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={!topic.trim()}
        >
          Explore
        </button>
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
      <span className="text-white/30 text-sm mr-1 self-center">Try:</span>
      {topics.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onSelect(t)}
          className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white/50 hover:text-white/80 transition-all duration-200"
        >
          {t}
        </button>
      ))}
    </motion.div>
  );
}
