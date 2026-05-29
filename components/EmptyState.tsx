"use client";

import React from "react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  illustration:
    | "bookmarks"
    | "history"
    | "flashcards"
    | "streak"
    | "search"
    | "generic";
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

function BookmarksIllustration() {
  return (
    <svg
      width="120"
      height="100"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-float"
    >
      {/* Open book */}
      <path
        d="M20 70 C20 70 30 65 60 65 C90 65 100 70 100 70 L100 30 C100 30 90 25 60 25 C30 25 20 30 20 30 Z"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Book spine */}
      <path
        d="M60 25 L60 65"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Page lines left */}
      <path
        d="M30 38 L55 36"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M30 45 L55 43"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M30 52 L55 50"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Page lines right */}
      <path
        d="M65 36 L90 38"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M65 43 L90 45"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Heart above book */}
      <path
        d="M60 12 C60 12 54 4 48 8 C42 12 48 20 60 26 C72 20 78 12 72 8 C66 4 60 12 60 12 Z"
        stroke="rgba(52,211,153,0.3)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HistoryIllustration() {
  return (
    <svg
      width="110"
      height="110"
      viewBox="0 0 110 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-float"
    >
      {/* Clock circle */}
      <circle
        cx="55"
        cy="55"
        r="35"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
      />
      {/* Clock inner circle */}
      <circle
        cx="55"
        cy="55"
        r="2"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
      />
      {/* Hour hand */}
      <path
        d="M55 55 L55 35"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Minute hand */}
      <path
        d="M55 55 L70 48"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Circular arrow (top) */}
      <path
        d="M82 30 C90 40 92 55 85 68"
        stroke="rgba(52,211,153,0.3)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M82 30 L86 24 L78 26"
        stroke="rgba(52,211,153,0.3)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Circular arrow (bottom) */}
      <path
        d="M28 80 C20 70 18 55 25 42"
        stroke="rgba(52,211,153,0.3)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M28 80 L24 86 L32 84"
        stroke="rgba(52,211,153,0.3)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Hour markers */}
      <circle cx="55" cy="24" r="1.5" fill="rgba(255,255,255,0.12)" />
      <circle cx="86" cy="55" r="1.5" fill="rgba(255,255,255,0.12)" />
      <circle cx="55" cy="86" r="1.5" fill="rgba(255,255,255,0.12)" />
      <circle cx="24" cy="55" r="1.5" fill="rgba(255,255,255,0.12)" />
    </svg>
  );
}

function FlashcardsIllustration() {
  return (
    <svg
      width="120"
      height="100"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-float"
    >
      {/* Back card */}
      <rect
        x="38"
        y="10"
        width="52"
        height="68"
        rx="6"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1.5"
        transform="rotate(8 64 44)"
      />
      {/* Middle card */}
      <rect
        x="34"
        y="12"
        width="52"
        height="68"
        rx="6"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
        transform="rotate(-3 60 46)"
      />
      {/* Front card */}
      <rect
        x="30"
        y="16"
        width="52"
        height="68"
        rx="6"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
      />
      {/* Lines on front card */}
      <path
        d="M42 36 L70 36"
        stroke="rgba(52,211,153,0.3)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M42 44 L64 44"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M42 51 L58 51"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Sparkle */}
      <path
        d="M88 20 L88 28 M84 24 L92 24"
        stroke="rgba(52,211,153,0.25)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StreakIllustration() {
  return (
    <svg
      width="100"
      height="110"
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-float"
    >
      {/* Flame shape (unlit/gray) */}
      <path
        d="M50 15 C50 15 65 35 65 55 C65 65 62 72 58 77 C62 70 60 60 55 52 C55 52 52 65 42 75 C35 70 30 62 30 52 C30 35 50 15 50 15 Z"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner flame */}
      <path
        d="M50 40 C50 40 57 50 57 58 C57 64 54 68 50 70 C46 68 43 64 43 58 C43 50 50 40 50 40 Z"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Base line */}
      <path
        d="M35 85 L65 85"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Small dashes below */}
      <path
        d="M42 92 L50 92"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M52 92 L58 92"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg
      width="110"
      height="100"
      viewBox="0 0 110 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-float"
    >
      {/* Magnifying glass circle */}
      <circle
        cx="48"
        cy="42"
        r="22"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
      />
      {/* Handle */}
      <path
        d="M64 58 L80 74"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Text lines (being searched) */}
      <path
        d="M36 36 L60 36"
        stroke="rgba(52,211,153,0.25)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M36 43 L56 43"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M36 50 L52 50"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Dots around glass */}
      <circle cx="30" cy="22" r="1.5" fill="rgba(52,211,153,0.2)" />
      <circle cx="70" cy="28" r="1" fill="rgba(52,211,153,0.15)" />
      <circle cx="24" cy="55" r="1" fill="rgba(255,255,255,0.1)" />
    </svg>
  );
}

function GenericIllustration() {
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-float"
    >
      {/* Circle */}
      <circle
        cx="50"
        cy="50"
        r="30"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
      />
      {/* Question mark */}
      <path
        d="M42 38 C42 32 48 28 54 30 C60 32 62 38 56 42 C52 44 50 46 50 50"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="58" r="1.5" fill="rgba(255,255,255,0.2)" />
      {/* Sparkles */}
      <path
        d="M82 18 L82 26 M78 22 L86 22"
        stroke="rgba(52,211,153,0.3)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M20 72 L20 78 M17 75 L23 75"
        stroke="rgba(52,211,153,0.2)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="85" cy="70" r="1.5" fill="rgba(52,211,153,0.15)" />
      <circle cx="15" cy="30" r="1" fill="rgba(52,211,153,0.15)" />
    </svg>
  );
}

const illustrations: Record<EmptyStateProps["illustration"], () => React.ReactElement> = {
  bookmarks: BookmarksIllustration,
  history: HistoryIllustration,
  flashcards: FlashcardsIllustration,
  streak: StreakIllustration,
  search: SearchIllustration,
  generic: GenericIllustration,
};

export default function EmptyState({
  illustration,
  title,
  description,
  action,
}: EmptyStateProps) {
  const Illustration = illustrations[illustration];

  return (
    <motion.div
      className="text-center py-16 flex flex-col items-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-5">
        <Illustration />
      </div>
      <p className="text-white/50 font-sans text-sm font-medium mb-1">
        {title}
      </p>
      <p className="text-white/30 font-sans text-xs max-w-[260px]">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm font-sans hover:bg-white/10 hover:text-white/60 transition-colors"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
