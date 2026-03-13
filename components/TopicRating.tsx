"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface TopicRatingProps {
  slug: string;
  userRating: number | null;
  avgRating: number | null;
  totalRatings: number;
  onRate: (rating: number) => void;
}

export default function TopicRating({
  slug,
  userRating,
  avgRating,
  totalRatings,
  onRate,
}: TopicRatingProps) {
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(!!userRating);
  const displayRating = hovered || userRating || 0;

  return (
    <motion.div
      className="flex flex-col items-center gap-3 py-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <p className="text-white/30 text-xs font-sans tracking-wide uppercase">
        {submitted ? "Your rating" : "Rate this topic"}
      </p>

      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => {
              onRate(star);
              setSubmitted(true);
            }}
            onMouseEnter={() => setHovered(star)}
            className="p-1 transition-transform hover:scale-110"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={star <= displayRating ? "#fbbf24" : "none"}
              stroke={star <= displayRating ? "#fbbf24" : "#ffffff30"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
      </div>

      {avgRating !== null && totalRatings > 0 && (
        <p className="text-white/20 text-[11px] font-sans">
          {avgRating.toFixed(1)} avg · {totalRatings} rating{totalRatings !== 1 ? "s" : ""}
        </p>
      )}
    </motion.div>
  );
}
