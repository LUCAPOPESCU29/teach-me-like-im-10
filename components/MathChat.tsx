"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StreamingText from "./StreamingText";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "What is algebra?",
  "How do fractions work?",
  "Why is pi special?",
  "What does x mean in math?",
  "How do I find percentages?",
  "What are prime numbers?",
];

export default function MathChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height =
        Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  async function sendMessage(text?: string) {
    const msg = (text || input).trim();
    if (!msg || isStreaming) return;

    const userMessage: ChatMessage = { role: "user", content: msg };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Add empty assistant message
    const assistantMessage: ChatMessage = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMessage]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: accumulated,
                };
                return updated;
              });
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Oops, something went wrong. Try asking again!",
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleStop() {
    abortRef.current?.abort();
    setIsStreaming(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center h-full min-h-[50vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-4xl mb-4">🧮</div>
            <h2 className="font-display text-2xl text-white/80 mb-2">
              Ask me anything about math!
            </h2>
            <p className="text-white/30 text-sm font-sans mb-8 text-center max-w-sm">
              I&apos;m your friendly math tutor. No question is too simple — I
              explain everything like you&apos;re 10.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="px-3 py-2 text-sm bg-indigo-500/[0.06] hover:bg-indigo-500/[0.12] border border-indigo-500/[0.1] hover:border-indigo-500/25 rounded-xl text-indigo-300/50 hover:text-indigo-300/80 transition-all duration-300 font-sans"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "user" ? (
                <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md bg-indigo-500/20 border border-indigo-500/15 text-white/90 font-sans text-[15px]">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-[85%] relative">
                  <div className="absolute -left-7 top-1 text-lg">🧮</div>
                  <div className="ml-1 px-4 py-3 rounded-2xl rounded-bl-md bg-white/[0.04] border border-white/[0.06] math-solution">
                    <StreamingText
                      content={msg.content}
                      isStreaming={
                        isStreaming && i === messages.length - 1
                      }
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#070b14]/80 backdrop-blur-xl px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a math question..."
              rows={1}
              disabled={isStreaming}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/90 placeholder:text-white/20 resize-none outline-none focus:border-indigo-500/25 focus:bg-white/[0.06] transition-all duration-200 text-[15px] font-sans disabled:opacity-50"
            />
          </div>
          <motion.button
            onClick={isStreaming ? handleStop : () => sendMessage()}
            disabled={!input.trim() && !isStreaming}
            whileTap={{ scale: 0.95 }}
            className={`shrink-0 p-3 rounded-xl transition-all duration-200 ${
              isStreaming
                ? "bg-red-500/15 text-red-400 border border-red-500/20"
                : "bg-indigo-500/90 text-white disabled:opacity-20 disabled:cursor-not-allowed"
            }`}
          >
            {isStreaming ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="currentColor"
              >
                <rect x="4" y="4" width="10" height="10" rx="2" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l6-6 6 6" />
                <path d="M9 3v12" />
              </svg>
            )}
          </motion.button>
        </div>
        <p className="text-center text-[10px] text-white/15 mt-2 font-sans">
          Shift+Enter for new line · Enter to send
        </p>
      </div>
    </div>
  );
}
