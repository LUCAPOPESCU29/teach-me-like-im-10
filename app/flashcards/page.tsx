"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import FlashcardDeck from "@/components/FlashcardDeck";
import { createClient } from "@/lib/supabase/client";

interface FlashcardRow {
  id: string;
  front: string;
  back: string;
  difficulty: string;
  topic_slug: string;
  interval_days: number;
  ease_factor: number;
}

export default function FlashcardsPage() {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const [dueCards, setDueCards] = useState<FlashcardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }

    async function fetchDue() {
      const supabase = createClient();
      const { data } = await supabase
        .from("flashcards")
        .select("id, front, back, difficulty, topic_slug, interval_days, ease_factor")
        .eq("user_id", user!.id)
        .lte("next_review", new Date().toISOString())
        .order("next_review", { ascending: true })
        .limit(20);

      setDueCards(data || []);
      setLoading(false);
    }

    fetchDue();
  }, [user, isGuest]);

  async function handleRate(
    cardIndex: number,
    _rating: "again" | "good" | "easy",
    result: { interval: number; easeFactor: number }
  ) {
    const card = dueCards[cardIndex];
    if (!card || !user) return;

    const supabase = createClient();
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + result.interval);

    await supabase
      .from("flashcards")
      .update({
        interval_days: result.interval,
        ease_factor: result.easeFactor,
        next_review: nextReview.toISOString(),
      })
      .eq("id", card.id);
  }

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans mb-2 inline-block"
            >
              ← Home
            </button>
            <h1 className="font-display text-3xl text-white">Flashcards</h1>
            <p className="text-white/30 text-sm font-sans mt-1">
              Review your saved cards
            </p>
          </div>
          <div className="text-4xl">🃏</div>
        </div>

        {isGuest ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔒</div>
            <p className="text-white/40 font-sans text-sm mb-4">
              Sign in to save and review flashcards
            </p>
            <button
              onClick={() => router.push("/auth/login")}
              className="px-6 py-2 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all font-sans text-sm"
            >
              Sign in
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : reviewing ? (
          <FlashcardDeck
            cards={dueCards}
            onRate={handleRate}
            onComplete={() => {
              setReviewing(false);
              setDueCards([]);
            }}
          />
        ) : dueCards.length > 0 ? (
          <div className="text-center py-12">
            <motion.div
              className="text-5xl mb-4"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🃏
            </motion.div>
            <p className="text-white/60 font-sans text-lg mb-2">
              {dueCards.length} card{dueCards.length === 1 ? "" : "s"} due for review
            </p>
            <p className="text-white/30 font-sans text-sm mb-6">
              From {new Set(dueCards.map((c) => c.topic_slug)).size} topic{new Set(dueCards.map((c) => c.topic_slug)).size === 1 ? "" : "s"}
            </p>
            <button
              onClick={() => setReviewing(true)}
              className="px-8 py-3 rounded-xl border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-mono text-sm tracking-wider transition-all"
            >
              START REVIEW
            </button>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">✨</div>
            <p className="text-white/40 font-sans text-sm mb-2">
              No cards due for review!
            </p>
            <p className="text-white/25 font-sans text-xs">
              Generate flashcards from any topic you&apos;re learning
            </p>
          </div>
        )}
      </motion.div>
    </main>
  );
}
