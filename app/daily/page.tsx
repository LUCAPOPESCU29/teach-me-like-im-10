"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import QuizMode from "@/components/QuizMode";
import StreamingText from "@/components/StreamingText";
import type { QuizQuestion } from "@/components/QuizMode";

interface DailyChallenge {
  date: string;
  topic: string;
  slug: string;
  levelContent: string;
  questions: QuizQuestion[];
  completed: boolean;
  userScore: number;
}

export default function DailyPage() {
  const { data: dataLayer, isGuest } = useAuth();
  const router = useRouter();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  useEffect(() => {
    fetch("/api/daily-challenge")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        // Check guest localStorage
        const guestKey = `tmi10_daily_${data.date}`;
        const guestData = localStorage.getItem(guestKey);
        const isCompleted = data.completed || !!guestData;
        const userScore = data.userScore || (guestData ? JSON.parse(guestData).score : 0);

        setChallenge({ ...data, completed: isCompleted, userScore });
        setCompleted(isCompleted);
        setScore(userScore);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const handleQuizComplete = useCallback(
    async (finalScore: number, total: number) => {
      setScore(finalScore);
      setCompleted(true);
      setShowQuiz(false);

      // Save completion
      if (isGuest && challenge) {
        const guestKey = `tmi10_daily_${challenge.date}`;
        localStorage.setItem(guestKey, JSON.stringify({ score: finalScore, xpEarned: 100 }));
        const result = await dataLayer.addXP(100);
        setXpEarned(result.xpGained);
      } else {
        const res = await fetch("/api/daily-challenge/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: finalScore, total }),
        });
        const data = await res.json();
        setXpEarned(data.xpEarned || 0);
      }
    },
    [isGuest, dataLayer, challenge]
  );

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white/30 font-mono text-sm animate-pulse">Loading daily challenge...</div>
      </main>
    );
  }

  if (error || !challenge) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400/60 font-mono text-sm">{error || "Challenge not found"}</p>
          <button onClick={() => router.push("/")} className="mt-4 text-white/30 text-sm font-sans hover:text-white/50">
            Go home
          </button>
        </div>
      </main>
    );
  }

  if (showQuiz) {
    return (
      <QuizMode
        topic={challenge.topic}
        levels={[{ level: 1, content: challenge.levelContent }]}
        preloadedQuestions={challenge.questions}
        onComplete={handleQuizComplete}
        bonusLabel="+100 XP Daily Bonus!"
        onClose={() => setShowQuiz(false)}
      />
    );
  }

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans mb-6 inline-block"
        >
          &larr; Home
        </button>

        <div className="flex items-center gap-3 mb-2">
          <span className="text-amber-400/80 font-mono text-[10px] tracking-[0.2em] uppercase">
            Daily Challenge
          </span>
          <span className="text-white/20 font-mono text-[10px]">
            {new Date(challenge.date + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl text-white mb-8">{challenge.topic}</h1>
      </motion.div>

      {/* Lesson content */}
      <motion.div
        className="prose prose-invert max-w-none mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="text-white/10 font-mono text-[10px] tracking-widest mb-4">LEVEL 1 &middot; THE BASICS</div>
          <StreamingText content={challenge.levelContent} isStreaming={false} />
        </div>
      </motion.div>

      {/* Action area */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {completed ? (
          <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04]">
            <div className="text-emerald-400 text-2xl mb-2">&#10003;</div>
            <p className="text-emerald-400 font-mono text-sm mb-1">Challenge Complete!</p>
            <p className="text-white/40 font-mono text-xs mb-2">
              Score: {score}/5
            </p>
            {xpEarned > 0 && (
              <p className="text-emerald-400/60 font-mono text-xs">+{xpEarned} XP earned</p>
            )}
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-6 py-2 rounded-lg border border-white/10 text-white/40 font-mono text-sm hover:bg-white/5 transition-all"
            >
              RETURN HOME
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowQuiz(true)}
            className="group relative px-10 py-4 font-mono text-sm tracking-[0.2em] text-amber-300 overflow-hidden rounded-lg"
          >
            <div className="absolute inset-0 border border-amber-500/40 rounded-lg" />
            <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
            <span className="relative">START QUIZ</span>
          </button>
        )}
      </motion.div>
    </main>
  );
}
