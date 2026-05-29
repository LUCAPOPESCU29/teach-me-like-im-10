"use client";
import PageTransition from "@/components/PageTransition";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const DEBATE_TOPICS = [
  "Is social media good for society?",
  "Should homework be abolished?",
  "Are video games art?",
  "Is AI smarter than humans?",
  "Should we colonize Mars?",
  "Is math discovered or invented?",
  "Are cats better than dogs?",
  "Should school start later?",
];

const TOTAL_ROUNDS = 3;

interface Message {
  role: "user" | "ai";
  text: string;
  round: number;
}

interface JudgeResult {
  winner: "user" | "ai";
  userScore: number;
  aiScore: number;
  feedback: string;
}

type Phase = "pick-topic" | "pick-side" | "debating" | "judging" | "result";

export default function DebatePage() {
  const router = useRouter();
  const { data } = useAuth();

  const [phase, setPhase] = useState<Phase>("pick-topic");
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [userSide, setUserSide] = useState<"for" | "against" | null>(null);
  const [round, setRound] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleTopicSelect = (t: string) => {
    setTopic(t);
    setPhase("pick-side");
  };

  const handleCustomTopicSubmit = () => {
    if (customTopic.trim().length < 5) return;
    setTopic(customTopic.trim());
    setPhase("pick-side");
  };

  const handleSideSelect = (side: "for" | "against") => {
    setUserSide(side);
    setPhase("debating");
    setRound(1);
    setMessages([]);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const streamAiResponse = useCallback(
    async (userArg: string, currentRound: number) => {
      setAiStreaming(true);
      setStreamingText("");
      setError(null);

      try {
        const res = await fetch("/api/debate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            side: userSide,
            userArgument: userArg,
            round: currentRound,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to get AI response");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") continue;

            try {
              const parsed = JSON.parse(payload);
              if (parsed.text) {
                fullText += parsed.text;
                setStreamingText(fullText);
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch {
              // Ignore JSON parse errors from partial chunks
            }
          }
        }

        // Add completed AI message
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: fullText.trim(), round: currentRound },
        ]);
        setStreamingText("");
        setAiStreaming(false);

        // Move to next round or enable judging
        if (currentRound < TOTAL_ROUNDS) {
          setRound(currentRound + 1);
          setTimeout(() => textareaRef.current?.focus(), 100);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setAiStreaming(false);
        setStreamingText("");
      }
    },
    [topic, userSide]
  );

  const handleSubmitArgument = () => {
    if (currentInput.trim().length < 10 || aiStreaming) return;

    const userMsg: Message = {
      role: "user",
      text: currentInput.trim(),
      round,
    };
    setMessages((prev) => [...prev, userMsg]);

    const thisRound = round;
    const thisArg = currentInput.trim();
    setCurrentInput("");

    streamAiResponse(thisArg, thisRound);
  };

  const handleJudge = async () => {
    setPhase("judging");
    setError(null);

    try {
      const aiSide = userSide === "for" ? "against" : "for";
      const debateArgs = messages.map((m) => ({
        side: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/debate/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          side1: userSide,
          side2: aiSide,
          arguments: debateArgs,
        }),
      });

      if (!res.ok) throw new Error("Failed to judge debate");

      const result: JudgeResult = await res.json();
      setJudgeResult(result);
      setPhase("result");

      // Award XP
      if (!xpAwarded) {
        setXpAwarded(true);
        try {
          const bonus = result.winner === "user" ? 75 : 50;
          await data.addXP(bonus, "debate", topic);
        } catch {
          // XP system may not be available
        }
      }

      // Confetti if user wins
      if (result.winner === "user") {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("debating");
    }
  };

  const handlePlayAgain = () => {
    setPhase("pick-topic");
    setTopic("");
    setCustomTopic("");
    setUserSide(null);
    setRound(1);
    setMessages([]);
    setCurrentInput("");
    setStreamingText("");
    setJudgeResult(null);
    setError(null);
    setXpAwarded(false);
    setShowConfetti(false);
  };

  const debateFinished = round > TOTAL_ROUNDS || (round === TOTAL_ROUNDS && messages.filter((m) => m.role === "ai").length >= TOTAL_ROUNDS);

  return (
    <PageTransition>
    <main className="min-h-screen flex flex-col items-center px-4 pt-12 sm:pt-16 pb-24 relative">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ["#4ade80", "#fbbf24", "#f43f5e", "#a855f7", "#38bdf8"][
                  i % 5
                ],
              }}
              initial={{ top: "-5%", opacity: 1, scale: 1 }}
              animate={{
                top: `${100 + Math.random() * 20}%`,
                opacity: 0,
                scale: Math.random() * 0.5 + 0.5,
                x: (Math.random() - 0.5) * 200,
                rotate: Math.random() * 720,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.5,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <motion.div
        className="text-center mb-8 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-display text-4xl sm:text-5xl text-white mb-3">
          <span className="mr-3">&#x2694;&#xFE0F;</span>
          Topic Debates
        </h1>
        <p className="text-white/40 font-sans text-base sm:text-lg">
          3 rounds. Pick a side. Argue your case. Let AI judge.
        </p>
      </motion.div>

      {/* Back button */}
      <motion.button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 text-white/30 hover:text-white/60 text-sm font-sans transition-colors z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        &larr; Home
      </motion.button>

      <div className="w-full max-w-2xl relative z-10">
        <AnimatePresence mode="wait">
          {/* PHASE: Pick Topic */}
          {phase === "pick-topic" && (
            <motion.div
              key="pick-topic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-white/50 text-xs font-sans font-medium tracking-widest uppercase mb-4 px-1">
                Choose a debate topic
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {DEBATE_TOPICS.map((t, i) => (
                  <motion.button
                    key={t}
                    onClick={() => handleTopicSelect(t)}
                    className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.15] transition-all text-left group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-white/70 text-sm font-sans font-medium group-hover:text-white transition-colors">
                      {t}
                    </span>
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustomTopicSubmit()}
                  placeholder="Or type your own debate topic..."
                  maxLength={120}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/80 placeholder:text-white/20 font-sans text-sm focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
                />
                <motion.button
                  onClick={handleCustomTopicSubmit}
                  disabled={customTopic.trim().length < 5}
                  className="px-5 py-3 rounded-xl bg-white/[0.08] border border-white/[0.1] text-white/60 font-sans text-sm font-medium hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Go
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* PHASE: Pick Side */}
          {phase === "pick-side" && (
            <motion.div
              key="pick-side"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <p className="text-white/30 text-xs font-sans uppercase tracking-widest mb-2">
                The topic
              </p>
              <h2 className="text-white text-xl sm:text-2xl font-sans font-semibold mb-8">
                &ldquo;{topic}&rdquo;
              </h2>

              <p className="text-white/40 font-sans text-sm mb-6">
                Which side will you argue?
              </p>

              <div className="flex gap-4 justify-center">
                <motion.button
                  onClick={() => handleSideSelect("for")}
                  className="flex-1 max-w-[220px] p-6 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12] hover:border-emerald-500/50 transition-all"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="text-3xl block mb-2">&#x1F44D;</span>
                  <span className="text-emerald-400 text-lg font-sans font-bold block">FOR</span>
                  <span className="text-emerald-400/50 text-xs font-sans block mt-1">
                    I agree with this
                  </span>
                </motion.button>

                <motion.button
                  onClick={() => handleSideSelect("against")}
                  className="flex-1 max-w-[220px] p-6 rounded-xl border-2 border-rose-500/30 bg-rose-500/[0.06] hover:bg-rose-500/[0.12] hover:border-rose-500/50 transition-all"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="text-3xl block mb-2">&#x1F44E;</span>
                  <span className="text-rose-400 text-lg font-sans font-bold block">AGAINST</span>
                  <span className="text-rose-400/50 text-xs font-sans block mt-1">
                    I disagree with this
                  </span>
                </motion.button>
              </div>

              <button
                onClick={() => {
                  setPhase("pick-topic");
                  setTopic("");
                }}
                className="mt-6 text-white/20 hover:text-white/40 text-xs font-sans transition-colors"
              >
                &larr; Pick a different topic
              </button>
            </motion.div>
          )}

          {/* PHASE: Debating (3 rounds) */}
          {phase === "debating" && (
            <motion.div
              key="debating"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Topic & round header */}
              <div className="text-center mb-4">
                <p className="text-white/30 text-xs font-sans uppercase tracking-widest mb-1">
                  Debating
                </p>
                <h2 className="text-white text-lg font-sans font-semibold mb-2">
                  &ldquo;{topic}&rdquo;
                </h2>
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-sans font-bold ${
                      userSide === "for"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    You: {userSide === "for" ? "FOR" : "AGAINST"}
                  </span>
                  <span className="text-white/10">vs</span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-sans font-bold ${
                      userSide === "against"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                    }`}
                  >
                    AI: {userSide === "for" ? "AGAINST" : "FOR"}
                  </span>
                </div>
              </div>

              {/* Round progress */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <motion.div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans font-bold border-2 transition-all ${
                        i + 1 < round
                          ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                          : i + 1 === round && !debateFinished
                            ? "border-white/30 bg-white/10 text-white"
                            : i + 1 === round && debateFinished
                              ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                              : "border-white/10 bg-white/[0.03] text-white/20"
                      }`}
                      animate={
                        i + 1 === round && !debateFinished
                          ? { scale: [1, 1.1, 1] }
                          : {}
                      }
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {i + 1}
                    </motion.div>
                    {i < TOTAL_ROUNDS - 1 && (
                      <div
                        className={`w-6 h-0.5 ${
                          i + 1 < round ? "bg-emerald-500/30" : "bg-white/[0.06]"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Chat messages */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 mb-4 max-h-[400px] overflow-y-auto space-y-3">
                {messages.length === 0 && !aiStreaming && (
                  <p className="text-white/15 text-sm font-sans text-center py-8">
                    Round 1 &mdash; make your opening argument!
                  </p>
                )}

                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-emerald-500/15 border border-emerald-500/20 rounded-br-md"
                          : "bg-violet-500/15 border border-violet-500/20 rounded-bl-md"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`text-[10px] font-sans font-bold uppercase tracking-wider ${
                            msg.role === "user" ? "text-emerald-400/60" : "text-violet-400/60"
                          }`}
                        >
                          {msg.role === "user" ? "You" : "AI"} &middot; Round{" "}
                          {msg.round}
                        </span>
                      </div>
                      <p
                        className={`text-sm font-sans leading-relaxed ${
                          msg.role === "user" ? "text-emerald-100/80" : "text-violet-100/80"
                        }`}
                      >
                        {msg.text}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Streaming AI response */}
                {aiStreaming && streamingText && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-violet-500/15 border border-violet-500/20 rounded-bl-md">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-violet-400/60">
                          AI &middot; Round {round}
                        </span>
                        <motion.span
                          className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        />
                      </div>
                      <p className="text-sm font-sans leading-relaxed text-violet-100/80">
                        {streamingText}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Typing indicator */}
                {aiStreaming && !streamingText && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="rounded-2xl px-4 py-3 bg-violet-500/10 border border-violet-500/15 rounded-bl-md">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-violet-400/50"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input area or Judge button */}
              {!debateFinished ? (
                <div className="space-y-3">
                  <div
                    className={`rounded-xl border-2 p-3 ${
                      userSide === "for"
                        ? "border-emerald-500/15 bg-emerald-500/[0.03]"
                        : "border-rose-500/15 bg-rose-500/[0.03]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/40 text-xs font-sans font-medium">
                        Round {round} of {TOTAL_ROUNDS}
                      </span>
                      <span
                        className={`text-xs font-sans ${
                          currentInput.length > 280 ? "text-rose-400" : "text-white/20"
                        }`}
                      >
                        {currentInput.length}/300
                      </span>
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={currentInput}
                      onChange={(e) =>
                        e.target.value.length <= 300 && setCurrentInput(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitArgument();
                        }
                      }}
                      placeholder={
                        round === 1
                          ? "Make your opening argument..."
                          : round === 2
                            ? "Counter the AI and strengthen your case..."
                            : "Final round! Make your closing argument..."
                      }
                      rows={3}
                      disabled={aiStreaming}
                      className="w-full bg-transparent text-white/80 placeholder:text-white/15 font-sans text-sm resize-none focus:outline-none leading-relaxed disabled:opacity-40"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={handlePlayAgain}
                      className="text-white/20 hover:text-white/40 text-xs font-sans transition-colors"
                    >
                      &larr; Start over
                    </button>
                    <motion.button
                      onClick={handleSubmitArgument}
                      disabled={currentInput.trim().length < 10 || aiStreaming}
                      className="px-6 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-sans text-sm font-bold hover:bg-emerald-500/30 hover:border-emerald-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Send Round {round} &rarr;
                    </motion.button>
                  </div>
                </div>
              ) : (
                <motion.div
                  className="text-center space-y-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-white/40 text-sm font-sans">
                    All 3 rounds complete! Ready for the verdict?
                  </p>
                  <motion.button
                    onClick={handleJudge}
                    className="px-8 py-3 rounded-xl bg-amber-500/20 border-2 border-amber-500/30 text-amber-300 font-sans text-base font-bold hover:bg-amber-500/30 hover:border-amber-500/40 transition-all"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    &#x2696;&#xFE0F; Judge the Debate
                  </motion.button>
                </motion.div>
              )}

              {error && (
                <motion.p
                  className="text-rose-400 text-xs font-sans mt-3 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* PHASE: Judging */}
          {phase === "judging" && (
            <motion.div
              key="judging"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="text-center py-16"
            >
              <motion.div
                className="text-5xl mb-6"
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                &#x2696;&#xFE0F;
              </motion.div>
              <p className="text-amber-300/80 font-sans text-lg font-medium mb-2">
                The judge is deliberating...
              </p>
              <p className="text-white/20 font-sans text-xs">
                Reviewing all 3 rounds of arguments
              </p>
              <motion.div
                className="mt-6 flex justify-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-amber-400/50"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* PHASE: Result */}
          {phase === "result" && judgeResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Winner announcement */}
              <motion.div
                className={`rounded-xl border-2 p-8 text-center mb-6 ${
                  judgeResult.winner === "user"
                    ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                    : "border-violet-500/30 bg-violet-500/[0.06]"
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <motion.span
                  className="text-5xl block mb-3"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                >
                  {judgeResult.winner === "user" ? "\uD83C\uDFC6" : "\uD83E\uDD16"}
                </motion.span>
                <motion.p
                  className={`text-2xl font-sans font-bold mb-2 ${
                    judgeResult.winner === "user" ? "text-emerald-400" : "text-violet-400"
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {judgeResult.winner === "user" ? "You Win!" : "AI Wins This Round"}
                </motion.p>
                <motion.p
                  className="text-white/30 text-sm font-sans"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {judgeResult.winner === "user"
                    ? "+75 XP earned! (50 + 25 bonus)"
                    : "+50 XP for completing the debate"}
                </motion.p>
              </motion.div>

              {/* Scores */}
              <motion.div
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h3 className="text-amber-300/60 text-xs font-sans font-bold uppercase tracking-widest mb-5 text-center">
                  Scores
                </h3>

                <div className="flex items-center justify-center gap-8 mb-6">
                  <div className="text-center">
                    <span className="text-white/30 text-[10px] font-sans uppercase block mb-1">
                      You
                    </span>
                    <motion.span
                      className={`text-4xl font-sans font-bold block ${
                        judgeResult.userScore >= judgeResult.aiScore
                          ? "text-emerald-400"
                          : "text-white/50"
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" }}
                    >
                      {judgeResult.userScore}
                    </motion.span>
                    <span className="text-white/15 text-xs font-sans">/10</span>
                  </div>

                  <span className="text-white/10 text-lg font-sans">vs</span>

                  <div className="text-center">
                    <span className="text-white/30 text-[10px] font-sans uppercase block mb-1">
                      AI
                    </span>
                    <motion.span
                      className={`text-4xl font-sans font-bold block ${
                        judgeResult.aiScore > judgeResult.userScore
                          ? "text-violet-400"
                          : "text-white/50"
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.9, type: "spring" }}
                    >
                      {judgeResult.aiScore}
                    </motion.span>
                    <span className="text-white/15 text-xs font-sans">/10</span>
                  </div>
                </div>

                {/* Score bars */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-white/30 text-xs font-sans w-8 text-right">You</span>
                    <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-emerald-500/60"
                        initial={{ width: 0 }}
                        animate={{ width: `${judgeResult.userScore * 10}%` }}
                        transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/30 text-xs font-sans w-8 text-right">AI</span>
                    <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-violet-500/60"
                        initial={{ width: 0 }}
                        animate={{ width: `${judgeResult.aiScore * 10}%` }}
                        transition={{ delay: 1.1, duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Feedback */}
              <motion.div
                className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-5 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">&#x2696;&#xFE0F;</span>
                  <span className="text-amber-300/70 text-xs font-sans font-bold uppercase tracking-wider">
                    Judge&apos;s Feedback
                  </span>
                </div>
                <p className="text-amber-200/60 text-sm font-sans leading-relaxed italic">
                  &ldquo;{judgeResult.feedback}&rdquo;
                </p>
              </motion.div>

              {/* Actions */}
              <motion.div
                className="flex justify-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                <motion.button
                  onClick={handlePlayAgain}
                  className="px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/60 font-sans text-sm font-medium hover:bg-white/[0.1] hover:text-white transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Debate Again
                </motion.button>
                <motion.button
                  onClick={() => router.push("/")}
                  className="px-6 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/30 font-sans text-sm hover:text-white/50 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Home
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
      </PageTransition>
  );
}
