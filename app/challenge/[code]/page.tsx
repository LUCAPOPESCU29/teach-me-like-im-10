"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import QuizMode from "@/components/QuizMode";
import Podium from "@/components/Podium";
import type { QuizQuestion } from "@/components/QuizMode";

interface Participant {
  id: string;
  name: string;
  score: number | null;
  total: number;
  completedAt: string | null;
}

interface ChallengeData {
  challenge: {
    id: string;
    code: string;
    creatorName: string;
    topic: string;
    slug: string;
    questions: QuizQuestion[];
    lang: string;
    maxParticipants: number;
  };
  participants: Participant[];
  isExpired: boolean;
  isFull: boolean;
}

type ViewState = "loading" | "join" | "quiz" | "podium" | "error";

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [viewState, setViewState] = useState<ViewState>("loading");
  const [data, setData] = useState<ChallengeData | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const fetchChallenge = useCallback(async () => {
    try {
      const res = await fetch(`/api/challenge/${code}`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setData(d);
      return d as ChallengeData;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load challenge");
      setViewState("error");
      return null;
    }
  }, [code]);

  // Initial load
  useEffect(() => {
    fetchChallenge().then((d) => {
      if (!d) return;
      // Check if user has a saved name for this challenge
      const savedName = localStorage.getItem(`tmi10_challenge_${code}`);
      if (savedName) {
        const participant = d.participants.find((p: Participant) => p.name === savedName);
        if (participant) {
          setName(savedName);
          setParticipantId(participant.id);
          if (participant.completedAt) {
            setViewState("podium");
          } else {
            // Already joined but not completed — go to quiz
            setViewState("quiz");
          }
          return;
        }
      }
      setViewState("join");
    });
  }, [fetchChallenge, code]);

  // Poll for updates when on podium
  useEffect(() => {
    if (viewState !== "podium") return;
    const interval = setInterval(async () => {
      const d = await fetchChallenge();
      if (d) setData(d);
    }, 5000);
    return () => clearInterval(interval);
  }, [viewState, fetchChallenge]);

  async function handleJoin() {
    if (!name.trim() || !data) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/challenge/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantName: name.trim() }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);

      localStorage.setItem(`tmi10_challenge_${code}`, name.trim());
      setParticipantId(d.participantId);

      if (d.completed) {
        setViewState("podium");
        fetchChallenge();
      } else {
        setViewState("quiz");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setJoining(false);
    }
  }

  const handleQuizComplete = useCallback(
    async (score: number, total: number) => {
      if (!participantId) return;
      await fetch(`/api/challenge/${code}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, score, total }),
      });
      await fetchChallenge();
      setViewState("podium");
    },
    [participantId, code, fetchChallenge]
  );

  async function handleShare() {
    const url = `${window.location.origin}/challenge/${code}`;
    const text = `Can you beat my score? Take my quiz challenge on "${data?.challenge.topic}"!`;
    if (navigator.share) {
      try { await navigator.share({ title: "Quiz Challenge", text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  }

  if (viewState === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white/30 font-mono text-sm animate-pulse">Loading challenge...</div>
      </main>
    );
  }

  if (viewState === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400/60 font-mono text-sm">{error}</p>
          <button onClick={() => router.push("/")} className="mt-4 text-white/30 text-sm font-sans hover:text-white/50">
            Go home
          </button>
        </div>
      </main>
    );
  }

  if (viewState === "quiz" && data) {
    return (
      <QuizMode
        topic={data.challenge.topic}
        levels={[{ level: 1, content: "" }]}
        lang={data.challenge.lang}
        preloadedQuestions={data.challenge.questions}
        onComplete={handleQuizComplete}
        bonusLabel="Challenge submitted!"
        onClose={() => {
          setViewState("podium");
          fetchChallenge();
        }}
      />
    );
  }

  if (!data) return null;

  // Join view
  if (viewState === "join") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          className="max-w-sm w-full text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-white/20 font-mono text-[10px] tracking-[0.2em] uppercase mb-4">
            Quiz Challenge
          </div>

          <h1 className="font-display text-3xl text-white mb-2">{data.challenge.topic}</h1>

          <p className="text-white/30 font-sans text-sm mb-2">
            <span className="text-amber-400/60">{data.challenge.creatorName}</span> challenged you!
          </p>

          <p className="text-white/20 font-mono text-xs mb-8">
            {data.participants.length}/{data.challenge.maxParticipants} players
          </p>

          {data.isExpired ? (
            <p className="text-red-400/60 font-mono text-sm">This challenge has expired</p>
          ) : data.isFull ? (
            <p className="text-amber-400/60 font-mono text-sm">This challenge is full</p>
          ) : (
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-sans text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 mb-4"
                autoFocus
              />
              {error && <p className="text-red-400/60 font-mono text-xs mb-3">{error}</p>}
              <button
                onClick={handleJoin}
                disabled={!name.trim() || joining}
                className="w-full px-6 py-3 rounded-xl font-mono text-sm tracking-wider border border-amber-500/40 text-amber-300 bg-amber-500/5 hover:bg-amber-500/10 disabled:opacity-30 transition-all"
              >
                {joining ? "JOINING..." : "ACCEPT CHALLENGE"}
              </button>
            </div>
          )}

          <button
            onClick={() => router.push("/")}
            className="mt-6 text-white/20 text-xs font-sans hover:text-white/40 transition-colors"
          >
            Go home
          </button>
        </motion.div>
      </main>
    );
  }

  // Podium view
  return (
    <main className="min-h-screen max-w-lg mx-auto px-4 py-8 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="text-white/20 font-mono text-[10px] tracking-[0.2em] uppercase mb-2">
            Challenge Results
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-white mb-1">
            {data.challenge.topic}
          </h1>
          <p className="text-white/20 font-mono text-xs">CODE: {code}</p>
        </div>
      </motion.div>

      <Podium
        participants={data.participants}
        maxParticipants={data.challenge.maxParticipants}
      />

      <motion.div
        className="mt-10 flex justify-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <button
          onClick={handleShare}
          className="px-5 py-2.5 rounded-xl font-mono text-xs tracking-wider border border-amber-500/30 text-amber-400/70 hover:bg-amber-500/5 transition-all"
        >
          SHARE CHALLENGE
        </button>
        <button
          onClick={() => router.push("/")}
          className="px-5 py-2.5 rounded-xl font-mono text-xs tracking-wider border border-white/10 text-white/30 hover:bg-white/5 transition-all"
        >
          HOME
        </button>
      </motion.div>
    </main>
  );
}
