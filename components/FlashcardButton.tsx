"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FlashcardDeck from "./FlashcardDeck";
import { useAuth } from "./AuthProvider";
import { createClient } from "@/lib/supabase/client";

interface FlashcardButtonProps {
  topic: string;
  topicSlug: string;
  levels: { level: number; content: string }[];
  lang?: string;
}

interface GeneratedCard {
  front: string;
  back: string;
  difficulty: string;
}

export default function FlashcardButton({ topic, topicSlug, levels, lang }: FlashcardButtonProps) {
  const { user, isGuest } = useAuth();
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [showDeck, setShowDeck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, levels, lang }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();
      if (!data.flashcards || data.flashcards.length === 0) {
        throw new Error("No flashcards generated");
      }

      setCards(data.flashcards);

      // Save to Supabase if authenticated
      if (user) {
        const supabase = createClient();
        const rows = data.flashcards.map((c: GeneratedCard) => ({
          user_id: user.id,
          topic_slug: topicSlug,
          lang: lang || "en",
          front: c.front,
          back: c.back,
          difficulty: c.difficulty,
        }));
        await supabase.from("flashcards").insert(rows);
      }

      setShowDeck(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate flashcards");
    } finally {
      setLoading(false);
    }
  }

  async function handleRate(
    cardIndex: number,
    _rating: "again" | "good" | "easy",
    result: { interval: number; easeFactor: number }
  ) {
    // Update in Supabase if authenticated
    if (!user || !cards[cardIndex]) return;

    const supabase = createClient();
    const card = cards[cardIndex];
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + result.interval);

    await supabase
      .from("flashcards")
      .update({
        interval_days: result.interval,
        ease_factor: result.easeFactor,
        next_review: nextReview.toISOString(),
      })
      .eq("user_id", user.id)
      .eq("topic_slug", topicSlug)
      .eq("front", card.front);
  }

  return (
    <>
      <motion.button
        onClick={handleGenerate}
        disabled={loading}
        className="group relative px-6 py-3 rounded-xl font-mono text-sm tracking-wider overflow-hidden disabled:opacity-50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="absolute inset-0 border border-amber-500/30 rounded-xl" />
        <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
        <span className="relative z-10 text-amber-400 flex items-center gap-2">
          <span className="text-lg">{loading ? "⏳" : "🃏"}</span>
          {loading ? "GENERATING..." : "FLASHCARDS"}
        </span>
      </motion.button>

      {error && (
        <p className="text-red-400/60 text-xs font-mono mt-1">{error}</p>
      )}

      {/* Guest prompt */}
      {isGuest && cards.length > 0 && !showDeck && (
        <p className="text-white/20 text-xs font-sans mt-1">
          Sign in to save flashcards for later review
        </p>
      )}

      {/* Flashcard deck modal */}
      <AnimatePresence>
        {showDeck && cards.length > 0 && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-[#050a18]/95 backdrop-blur-xl"
              onClick={() => setShowDeck(false)}
            />

            {/* Corner brackets */}
            <div className="absolute top-6 left-6 w-8 h-8 border-l-2 border-t-2 border-amber-500/30" />
            <div className="absolute top-6 right-6 w-8 h-8 border-r-2 border-t-2 border-amber-500/30" />
            <div className="absolute bottom-6 left-6 w-8 h-8 border-l-2 border-b-2 border-amber-500/30" />
            <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 border-amber-500/30" />

            <div className="relative z-10 w-full max-w-xl mx-4 py-8">
              <div className="text-center mb-6">
                <h2 className="text-[10px] font-mono tracking-[0.4em] text-amber-400/60 mb-1">
                  FLASHCARD REVIEW
                </h2>
                <p className="text-white/30 font-mono text-xs">
                  {topic.toUpperCase()}
                </p>
              </div>

              <FlashcardDeck
                cards={cards}
                onRate={handleRate}
                onComplete={() => setShowDeck(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
