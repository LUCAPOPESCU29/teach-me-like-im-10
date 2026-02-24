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
    <div className="h-8 flex items-center justify-center text-white/20 text-sm">
      <span className="mr-2">e.g.</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-white/40 italic"
        >
          &ldquo;{examples[index]}&rdquo;
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
