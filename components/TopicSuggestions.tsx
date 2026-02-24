"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { slugify } from "@/lib/utils";

interface TopicSuggestionsProps {
  topic: string;
}

export default function TopicSuggestions({ topic }: TopicSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function fetchSuggestions() {
      try {
        const res = await fetch("/api/suggest-topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions.slice(0, 4));
          setLoaded(true);
        }
      } catch {
        // Silently fail
      }
    }

    fetchSuggestions();
    return () => {
      cancelled = true;
    };
  }, [topic]);

  if (!loaded || suggestions.length === 0) return null;

  return (
    <motion.div
      className="mt-12 pt-8 border-t border-white/5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-sm uppercase tracking-[0.15em] text-white/30 font-sans mb-4">
        People also explored
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((s, i) => (
          <motion.button
            key={s}
            onClick={() => router.push(`/learn/${slugify(s)}`)}
            className="text-left px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-200 text-white/60 hover:text-white/90 text-sm font-serif"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            {s}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
