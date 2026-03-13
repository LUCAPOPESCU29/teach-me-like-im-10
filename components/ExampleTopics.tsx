"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const examples = [
  "quantum physics",
  "how vaccines work",
  "blockchain",
  "black holes",
  "the stock market",
  "neural networks",
  "how mortgages work",
  "CRISPR gene editing",
  "the 2008 financial crisis",
  "general relativity",
];

export default function ExampleTopics() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % examples.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-8 flex items-center justify-center text-white/15 text-sm font-sans">
      <span className="mr-2">e.g.</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.4 }}
          className="text-white/30 italic font-serif"
        >
          &ldquo;{examples[index]}&rdquo;
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
