"use client";

import { useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { motion } from "framer-motion";

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  onParagraphClick?: (text: string, index: number) => void;
  selectedParagraph?: number | null;
  levelColor?: string;
}

export default function StreamingText({
  content,
  isStreaming,
  onParagraphClick,
  selectedParagraph,
  levelColor,
}: StreamingTextProps) {
  const pIdx = useRef(0);

  const rendered = useMemo(() => {
    pIdx.current = 0;
    return (
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => {
            const idx = pIdx.current++;
            const isSelected = selectedParagraph === idx;
            const isClickable = !!onParagraphClick && !isStreaming;

            // Extract plain text for API call
            const extractText = (node: React.ReactNode): string => {
              if (typeof node === "string") return node;
              if (Array.isArray(node)) return node.map(extractText).join("");
              if (node && typeof node === "object" && "props" in node) {
                const el = node as { props: { children?: React.ReactNode } };
                return extractText(el.props.children);
              }
              return "";
            };

            return (
              <div
                className={`group relative mb-4 leading-relaxed rounded-lg transition-all duration-200 ${
                  isClickable
                    ? "cursor-pointer hover:bg-white/[0.04] -mx-3 px-3 py-1"
                    : ""
                } ${
                  isSelected
                    ? "bg-white/[0.06] -mx-3 px-3 py-1 border-l-2"
                    : ""
                }`}
                style={
                  isSelected && levelColor
                    ? { borderColor: levelColor }
                    : undefined
                }
                onClick={() => {
                  if (isClickable) {
                    onParagraphClick(extractText(children), idx);
                  }
                }}
              >
                <p className="inline">{children}</p>
                {isClickable && !isSelected && (
                  <span className="absolute right-1 top-1 opacity-0 group-hover:opacity-60 transition-opacity text-[10px] text-white/40 font-mono">
                    ?
                  </span>
                )}
              </div>
            );
          },
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
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-white/20 pl-4 my-4 italic text-white/60">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, onParagraphClick, selectedParagraph, isStreaming, levelColor]);

  return (
    <motion.div
      className="text-white/80 font-serif text-base sm:text-[17px]"
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
