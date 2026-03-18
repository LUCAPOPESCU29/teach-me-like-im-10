"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useCelebration } from "@/components/CelebrationProvider";
import type { LangCode } from "@/lib/utils";

interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  difficulty: string;
}

export default function BattlePage() {
  const router = useRouter();
  const { user, data: dataLayer } = useAuth();
  const { playSound } = useCelebration();

  const [step, setStep] = useState<"setup" | "generating" | "share">("setup");
  const [topic, setTopic] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const lang = (dataLayer.getLang() || "en") as LangCode;

  useEffect(() => {
    if (user) {
      import("@/lib/supabase/client").then(({ createClient }) => {
        const supabase = createClient();
        supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data?.display_name) setPlayerName(data.display_name);
          });
      });
    }
  }, [user]);

  const handleCreate = useCallback(async () => {
    if (!topic.trim() || !playerName.trim()) return;
    setStep("generating");
    setError("");

    try {
      // Generate quiz questions
      const quizRes = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          levels: [{ level: 1, content: `A quiz battle about ${topic.trim()}` }],
          lang,
        }),
      });

      const quizData = await quizRes.json();
      if (quizData.error) throw new Error(quizData.error);

      const questions: Question[] = quizData.questions;
      if (!questions?.length) throw new Error("No questions generated");

      // Create challenge
      const createRes = await fetch("/api/challenge/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          slug: topic.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          questions,
          lang,
          creatorName: playerName.trim(),
        }),
      });

      const createData = await createRes.json();
      if (createData.error) throw new Error(createData.error);

      setCode(createData.code);
      setStep("share");
      playSound("chime");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create battle");
      setStep("setup");
    }
  }, [topic, playerName, lang, playSound]);

  const shareUrl = code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/challenge/${code}`
    : "";

  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 pb-24 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-rose-500/[0.04] blur-[120px] pointer-events-none" />

      <button
        onClick={() => router.push("/")}
        className="fixed top-4 left-4 z-50 text-sm text-white/30 hover:text-white/60 transition-colors font-sans"
      >
        &larr; Home
      </button>

      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-4xl mb-3">&#9876;&#65039;</div>
        <h1 className="font-display text-3xl sm:text-4xl text-white mb-2">
          Quiz Battle
        </h1>
        <p className="text-white/30 font-sans text-sm">
          Challenge your friends to a real-time quiz
        </p>
      </motion.div>

      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {step === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Create a battle */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="font-mono text-xs tracking-wider text-rose-400 mb-4">
                  CREATE A BATTLE
                </h2>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Your name"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-sans text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 mb-3"
                />
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Pick a topic (e.g. Black Holes)"
                  maxLength={60}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-sans text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 mb-3"
                />
                {error && (
                  <p className="text-red-400/60 font-mono text-xs mb-3">
                    {error}
                  </p>
                )}
                <button
                  onClick={handleCreate}
                  disabled={!topic.trim() || !playerName.trim()}
                  className="w-full py-3 rounded-xl border border-rose-500/40 text-rose-300 font-mono text-sm tracking-wider bg-rose-500/5 hover:bg-rose-500/10 disabled:opacity-20 transition-all"
                >
                  CREATE BATTLE
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/20 font-mono text-xs">OR</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Join a battle */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="font-mono text-xs tracking-wider text-amber-400 mb-4">
                  JOIN A BATTLE
                </h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) =>
                      setJoinCode(
                        e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, 6)
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && joinCode.trim()) {
                        router.push(`/challenge/${joinCode.trim()}`);
                      }
                    }}
                    placeholder="Enter code"
                    maxLength={6}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm tracking-[0.15em] text-center placeholder:text-white/20 focus:outline-none focus:border-amber-500/30 transition-colors"
                  />
                  <button
                    onClick={() => {
                      if (joinCode.trim())
                        router.push(`/challenge/${joinCode.trim()}`);
                    }}
                    disabled={!joinCode.trim()}
                    className="px-6 py-3 rounded-xl border border-amber-500/40 text-amber-300 font-mono text-sm tracking-wider bg-amber-500/5 hover:bg-amber-500/10 disabled:opacity-20 transition-all"
                  >
                    JOIN
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <motion.div
                className="w-3 h-3 rounded-full bg-rose-400 mx-auto mb-4"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <p className="text-white/40 font-mono text-sm">
                Generating quiz questions...
              </p>
            </motion.div>
          )}

          {step === "share" && (
            <motion.div
              key="share"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center"
            >
              <h2 className="font-mono text-sm tracking-wider text-rose-400 mb-2">
                BATTLE CREATED!
              </h2>
              <p className="text-white/30 text-xs font-sans mb-6">
                Share this code with your friends
              </p>

              {/* Big code display */}
              <div className="py-4 px-6 rounded-xl bg-white/5 border border-white/10 mb-4">
                <p className="text-white font-mono text-3xl tracking-[0.3em]">
                  {code}
                </p>
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 font-mono text-xs hover:bg-white/5 transition-all"
                >
                  {copied ? "COPIED!" : "COPY LINK"}
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `Quiz Battle: ${topic}`,
                        text: `Join my quiz battle on "${topic}"! Code: ${code}`,
                        url: shareUrl,
                      }).catch(() => {});
                    } else {
                      handleCopy();
                    }
                  }}
                  className="flex-1 py-3 rounded-xl border border-rose-500/40 text-rose-300 font-mono text-xs bg-rose-500/5 hover:bg-rose-500/10 transition-all"
                >
                  SHARE
                </button>
              </div>

              <button
                onClick={() => router.push(`/challenge/${code}`)}
                className="w-full py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-sm tracking-wider hover:bg-rose-500/20 transition-all"
              >
                GO TO BATTLE LOBBY &rarr;
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
