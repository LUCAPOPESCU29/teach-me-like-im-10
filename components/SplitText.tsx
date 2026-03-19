"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  /** "chars" splits every character; "words" splits by word */
  splitBy?: "chars" | "words";
}

export default function SplitText({
  text,
  className = "",
  delay = 0,
  stagger = 0.03,
  splitBy = "chars",
}: SplitTextProps) {
  const pieces = useMemo(() => {
    if (splitBy === "words") return text.split(" ");
    return text.split("");
  }, [text, splitBy]);

  return (
    <span className={className} aria-label={text}>
      {pieces.map((piece, i) => (
        <motion.span
          key={`${piece}-${i}`}
          className="inline-block"
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
