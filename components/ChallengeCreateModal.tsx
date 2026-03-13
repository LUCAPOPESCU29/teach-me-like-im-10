"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { QuizQuestion } from "@/components/QuizMode";

interface ChallengeCreateModalProps {
  topic: string;
  slug: string;
  questions: QuizQuestion[];
  score: number;
  total: number;
  lang?: string;
  onClose: () => void;
}

export default function ChallengeCreateModal({
  topic,
  slug,
  questions,
  score,
  total,
  lang,
  onClose,
}: ChallengeCreateModalProps) {
  const [step, setStep] = useState<"name" | "creating" | "share">("name");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    setStep("creating");
    try {
      const res = await fetch("/api/challenge/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          slug,
          questions,
          lang: lang || "en",
          creatorName: name.trim(),
          creatorScore: score,
          creatorTotal: total,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCode(data.code);
      // Save name locally so we can identify on the podium
      localStorage.setItem(`tmi10_challenge_${data.code}`, name.trim());
      setStep("share");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create challenge");
      setStep("name");
    }
  }

  const challengeUrl = code ? `${window.location.origin}/challenge/${code}` : "";

  async function handleCopy() {
    await navigator.clipboard.writeText(challengeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    const text = `Can you beat my score on "${topic}"? Take my quiz challenge!`;
    if (navigator.share) {
      try { await navigator.share({ title: "Quiz Challenge", text, url: challengeUrl }); } catch {}
    } else {
      handleCopy();
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="max-w-sm w-full rounded-2xl border border-white/10 bg-[#0a1020]/95 backdrop-blur-xl p-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {step === "name" && (
            <div>
              <h3 className="font-mono text-sm tracking-wider text-amber-400 mb-1">
                CHALLENGE A FRIEND
              </h3>
              <p className="text-white/30 text-xs font-sans mb-6">
                Up to 3 friends can compete on &ldquo;{topic}&rdquo;
              </p>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Your display name"
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-sans text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 mb-4"
                autoFocus
              />

              {error && <p className="text-red-400/60 font-mono text-xs mb-3">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/30 font-mono text-xs hover:bg-white/5 transition-all"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-amber-500/40 text-amber-300 font-mono text-xs bg-amber-500/5 hover:bg-amber-500/10 disabled:opacity-30 transition-all"
                >
                  CREATE
                </button>
              </div>
            </div>
          )}

          {step === "creating" && (
            <div className="text-center py-4">
              <div className="text-white/30 font-mono text-sm animate-pulse">Creating challenge...</div>
            </div>
          )}

          {step === "share" && (
            <div className="text-center">
              <h3 className="font-mono text-sm tracking-wider text-emerald-400 mb-1">
                CHALLENGE CREATED!
              </h3>
              <p className="text-white/30 text-xs font-sans mb-4">
                Share this link with up to 3 friends
              </p>

              {/* Code display */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                <p className="font-mono text-2xl tracking-[0.3em] text-white mb-2">{code}</p>
                <p className="text-white/20 font-mono text-[10px] truncate">{challengeUrl}</p>
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={handleCopy}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 font-mono text-xs hover:bg-white/5 transition-all"
                >
                  {copied ? "COPIED!" : "COPY LINK"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-amber-500/40 text-amber-300 font-mono text-xs bg-amber-500/5 hover:bg-amber-500/10 transition-all"
                >
                  SHARE
                </button>
              </div>

              <button
                onClick={() => {
                  onClose();
                  window.location.href = `/challenge/${code}`;
                }}
                className="w-full px-4 py-3 rounded-xl border border-emerald-500/40 text-emerald-300 font-mono text-sm tracking-wider bg-emerald-500/5 hover:bg-emerald-500/10 transition-all"
              >
                START CHALLENGE &rarr;
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
