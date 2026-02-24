"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
}

export default function StreamingText({
  content,
  isStreaming,
}: StreamingTextProps) {
  const rendered = useMemo(
    () => (
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-white mt-6 mb-3">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 space-y-2 list-disc list-inside">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 space-y-2 list-decimal list-inside">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-white/20 pl-4 my-4 italic text-white/60">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    ),
    [content]
  );

  return (
    <motion.div
      className="text-white/80 font-serif text-[17px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {rendered}
      {isStreaming && (
        <motion.span
          className="inline-block w-2 h-5 bg-white/50 ml-1 align-middle rounded-sm"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}
