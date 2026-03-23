"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import useIsMobile from "@/hooks/useIsMobile";

interface SplitTextProps {
  text: string;
  className?: string;
  /** Applied to each individual character/word span */
  charClassName?: string;
  delay?: number;
  stagger?: number;
  /** "chars" splits every character; "words" splits by word */
  splitBy?: "chars" | "words";
}

export default function SplitText({
  text,
  className = "",
  charClassName = "",
  delay = 0,
  stagger = 0.03,
  splitBy = "chars",
}: SplitTextProps) {
  const isMobile = useIsMobile();
  const pieces = useMemo(() => {
    if (splitBy === "words") return text.split(" ");
    return text.split("");
  }, [text, splitBy]);

  // On mobile: simple fade-in for the whole text, no per-character animation
  if (isMobile) {
    return (
      <motion.span
        className={`${className} ${charClassName}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay, ease: "easeOut" }}
      >
        {text}
      </motion.span>
    );
  }

  return (
    <span className={className} aria-label={text}>
      {pieces.map((piece, i) => (
        <motion.span
          key={`${piece}-${i}`}
          className={`inline-block ${charClassName}`}
          style={{ transformStyle: "preserve-3d" }}
          initial={{
            opacity: 0,
            y: 30,
            rotateX: -90,
            filter: "blur(8px)",
          }}
          animate={{
            opacity: 1,
            y: 0,
            rotateX: 0,
            filter: "blur(0px)",
          }}
          transition={{
            duration: 0.5,
            delay: delay + i * stagger,
            ease: [0.22, 1, 0.36, 1],
          }}
          aria-hidden
        >
          {piece === " " ? "\u00A0" : piece}
          {splitBy === "words" && i < pieces.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </span>
  );
}
