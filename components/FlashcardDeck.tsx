"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateNextReview, qualityFromRating } from "@/lib/flashcards";

interface Flashcard {
  id?: string;
  front: string;
  back: string;
  difficulty: string;
  interval_days?: number;
  ease_factor?: number;
}

interface FlashcardDeckProps {
  cards: Flashcard[];
  onRate?: (cardIndex: number, rating: "again" | "good" | "easy", result: { interval: number; easeFactor: number }) => void;
  onComplete?: () => void;
}

export default function FlashcardDeck({ cards, onRate, onComplete }: FlashcardDeckProps) {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const card = cards[current];
  const remaining = cards.length - completed.size;

  const handleFlip = useCallback(() => {
    setFlipped((f) => !f);
  }, []);

  const handleRate = useCallback(
    (rating: "again" | "good" | "easy") => {
      const quality = qualityFromRating(rating);
      const result = calculateNextReview(
        quality,
        card.interval_days || 1,
        card.ease_factor || 2.5
      );

      onRate?.(current, rating, result);

      if (rating !== "again") {
        setCompleted((prev) => new Set(prev).add(current));
      }

      // Move to next unreviewed card
      setFlipped(false);
      setTimeout(() => {
        const newCompleted = new Set(completed);
        if (rating !== "again") newCompleted.add(current);

        if (newCompleted.size >= cards.length) {
          onComplete?.();
          return;
        }

        let next = (current + 1) % cards.length;
        while (newCompleted.has(next)) {
          next = (next + 1) % cards.length;
        }
        setCurrent(next);
      }, 200);
    },
    [card, current, completed, cards.length, onRate, onComplete]
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!flipped) {
          handleFlip();
        }
      }
      if (flipped) {
        if (e.key === "1") handleRate("again");
        if (e.key === "2") handleRate("good");
        if (e.key === "3") handleRate("easy");
      }
      if (e.key === "Escape") {
        onComplete?.();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [flipped, handleFlip, handleRate, onComplete]);

  if (!card) return null;

  const diffColor = {
    easy: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    medium: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    hard: "text-red-400 border-red-500/20 bg-red-500/5",
  }[card.difficulty] || "text-white/30 border-white/10 bg-white/5";

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-white/30 font-mono text-xs">
          {completed.size}/{cards.length} reviewed
        </span>
        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
            animate={{ width: `${(completed.size / cards.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className={`px-2 py-0.5 rounded border font-mono text-[9px] tracking-wider ${diffColor}`}>
          {card.difficulty?.toUpperCase()}
        </span>
      </div>

      {/* Card */}
      <div className="perspective-1000" style={{ perspective: "1000px" }}>
        <motion.div
          className="relative w-full min-h-[240px] cursor-pointer"
          onClick={handleFlip}
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl border border-white/10 bg-white/[0.03] p-8 flex flex-col items-center justify-center backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="text-[10px] font-mono text-amber-400/60 tracking-[0.3em] mb-4">
              QUESTION
            </div>
            <p className="text-white/80 text-lg font-serif text-center leading-relaxed">
              {card.front}
            </p>
            <div className="mt-6 text-white/20 font-mono text-xs">
              tap to reveal
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-8 flex flex-col items-center justify-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="text-[10px] font-mono text-emerald-400/60 tracking-[0.3em] mb-4">
              ANSWER
            </div>
            <p className="text-white/80 text-base font-serif text-center leading-relaxed">
              {card.back}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Rating buttons */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            className="flex justify-center gap-3 mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <button
              onClick={() => handleRate("again")}
              className="px-5 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 font-mono text-xs tracking-wider transition-all"
            >
              <span className="text-white/20 mr-1">1</span> AGAIN
            </button>
            <button
              onClick={() => handleRate("good")}
              className="px-5 py-2.5 rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-mono text-xs tracking-wider transition-all"
            >
              <span className="text-white/20 mr-1">2</span> GOOD
            </button>
            <button
              onClick={() => handleRate("easy")}
              className="px-5 py-2.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-mono text-xs tracking-wider transition-all"
            >
              <span className="text-white/20 mr-1">3</span> EASY
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard hint */}
      <p className="text-white/10 font-mono text-[10px] text-center mt-4">
        SPACE flip · 1-3 rate · ESC exit
      </p>
    </div>
  );
}
