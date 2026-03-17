"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import QuizMode from "@/components/QuizMode";
import Podium from "@/components/Podium";
import { createClient } from "@/lib/supabase/client";
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

type ViewState = "loading" | "join" | "lobby" | "quiz" | "podium" | "error";

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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [newPlayer, setNewPlayer] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

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

  // Subscribe to Supabase Realtime for live updates
  useEffect(() => {
    if (!data?.challenge?.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`challenge:${data.challenge.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenge_participants",
          filter: `challenge_id=eq.${data.challenge.id}`,
        },
        () => {
          // Refetch on any participant change (join, score submit)
          fetchChallenge();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [data?.challenge?.id, fetchChallenge]);

  // Initial load
  useEffect(() => {
    fetchChallenge().then((d) => {
      if (!d) return;
      const savedName = localStorage.getItem(`tmi10_challenge_${code}`);
      if (savedName) {
        const participant = d.participants.find((p: Participant) => p.name === savedName);
        if (participant) {
          setName(savedName);
          setParticipantId(participant.id);
          if (participant.completedAt) {
            setViewState("podium");
          } else {
            setViewState("lobby");
          }
          return;
        }
      }
      setViewState("join");
    });
  }, [fetchChallenge, code]);

  // Show toast when new player joins in lobby
  useEffect(() => {
    if (newPlayer) {
      const t = setTimeout(() => setNewPlayer(null), 3000);
      return () => clearTimeout(t);
    }
  }, [newPlayer]);

  // Track new participants joining
  const prevParticipantCount = useRef(0);
  useEffect(() => {
    if (!data) return;
    const count = data.participants.length;
    if (
      prevParticipantCount.current > 0 &&
      count > prevParticipantCount.current &&
      (viewState === "lobby" || viewState === "podium")
    ) {
      const newest = data.participants[data.participants.length - 1];
      if (newest && newest.name !== name) {
        setNewPlayer(newest.name);
      }
    }
    prevParticipantCount.current = count;
  }, [data?.participants?.length, viewState, name, data]);

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
        setViewState("lobby");
        fetchChallenge();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setJoining(false);
    }
  }

  function handleStartQuiz() {
    setCountdown(3);
  }

  // Countdown timer
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      setViewState("quiz");
      return;
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

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
      try {
        await navigator.share({ title: "Quiz Challenge", text, url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  // Loading
  if (viewState === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white/30 font-mono text-sm animate-pulse">
          Loading challenge...
        </div>
      </main>
    );
  }

  // Error
  if (viewState === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400/60 font-mono text-sm">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-white/30 text-sm font-sans hover:text-white/50"
          >
            Go home
          </button>
        </div>
      </main>
    );
  }

  // Countdown overlay
  if (countdown !== null && countdown > 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <motion.div
          key={countdown}
          className="text-8xl font-display text-amber-400"
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {countdown}
        </motion.div>
      </main>
    );
  }

  // Quiz
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
            ⚡ Live Quiz Battle
          </div>

          <h1 className="font-display text-3xl text-white mb-2">
            {data.challenge.topic}
          </h1>

          <p className="text-white/30 font-sans text-sm mb-2">
            <span className="text-amber-400/60">
              {data.challenge.creatorName}
            </span>{" "}
            challenged you!
          </p>

          <p className="text-white/20 font-mono text-xs mb-8">
            {data.participants.length}/{data.challenge.maxParticipants} players
          </p>

          {data.isExpired ? (
            <p className="text-red-400/60 font-mono text-sm">
              This challenge has expired
            </p>
          ) : data.isFull ? (
            <p className="text-amber-400/60 font-mono text-sm">
              This challenge is full
            </p>
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
              {error && (
                <p className="text-red-400/60 font-mono text-xs mb-3">
                  {error}
                </p>
              )}
              <button
                onClick={handleJoin}
                disabled={!name.trim() || joining}
                className="w-full px-6 py-3 rounded-xl font-mono text-sm tracking-wider border border-amber-500/40 text-amber-300 bg-amber-500/5 hover:bg-amber-500/10 disabled:opacity-30 transition-all"
              >
                {joining ? "JOINING..." : "JOIN BATTLE"}
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

  // Lobby / Waiting Room
  if (viewState === "lobby") {
    const completedCount = data.participants.filter(
      (p) => p.completedAt
    ).length;
    const allDone =
      completedCount === data.participants.length &&
      data.participants.length > 0;

    // If all participants are done, auto-switch to podium
    if (allDone) {
      return (
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-white/30 font-mono text-sm animate-pulse">
            Loading results...
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        {/* New player toast */}
        <AnimatePresence>
          {newPlayer && (
            <motion.div
              className="fixed top-4 left-0 right-0 flex justify-center z-50"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
                <span className="text-amber-400 font-mono text-xs">
                  ⚡ {newPlayer} joined the battle!
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="max-w-sm w-full text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-white/20 font-mono text-[10px] tracking-[0.2em] uppercase mb-4">
            ⚡ Battle Lobby
          </div>

          <h1 className="font-display text-2xl text-white mb-2">
            {data.challenge.topic}
          </h1>

          <p className="text-white/20 font-mono text-xs mb-6">
            CODE: {code}
          </p>

          {/* Player list */}
          <div className="space-y-2 mb-8">
            {data.participants.map((p, i) => (
              <motion.div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background:
                      p.name === name
                        ? "linear-gradient(135deg, #f59e0b, #d97706)"
                        : "rgba(255,255,255,0.08)",
                    color: p.name === name ? "white" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span
                  className={`flex-1 text-left font-sans text-sm ${
                    p.name === name ? "text-amber-400" : "text-white/50"
                  }`}
                >
                  {p.name}
                  {p.name === name && (
                    <span className="text-white/20 text-xs ml-1">(you)</span>
                  )}
                </span>
                {p.completedAt ? (
                  <span className="text-emerald-400/60 font-mono text-xs">
                    {p.score}/{p.total} ✓
                  </span>
                ) : (
                  <motion.div
                    className="w-2 h-2 rounded-full bg-amber-400/50"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
            ))}

            {/* Empty slots */}
            {Array.from({
              length: data.challenge.maxParticipants - data.participants.length,
            }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-white/[0.06]"
              >
                <div className="w-8 h-8 rounded-full bg-white/[0.03]" />
                <span className="text-white/15 font-sans text-sm italic">
                  Waiting for player...
                </span>
              </div>
            ))}
          </div>

          {/* Live indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-white/20 font-mono text-[10px] tracking-wider">
              LIVE · {data.participants.length}/{data.challenge.maxParticipants}{" "}
              players
            </span>
          </div>

          {/* Start button */}
          <button
            onClick={handleStartQuiz}
            className="w-full px-6 py-3 rounded-xl font-mono text-sm tracking-wider border border-amber-500/40 text-amber-300 bg-amber-500/5 hover:bg-amber-500/10 transition-all mb-3"
          >
            ⚡ START QUIZ
          </button>

          {/* Share link */}
          <button
            onClick={handleShare}
            className="w-full px-6 py-2.5 rounded-xl font-mono text-xs tracking-wider border border-white/10 text-white/30 hover:bg-white/5 transition-all"
          >
            INVITE FRIENDS
          </button>

          <button
            onClick={() => router.push("/")}
            className="mt-4 text-white/15 text-xs font-sans hover:text-white/40 transition-colors"
          >
            Leave
          </button>
        </motion.div>
      </main>
    );
  }

  // Podium view
  return (
    <main className="min-h-screen max-w-lg mx-auto px-4 py-8 pb-24">
      {/* New player toast */}
      <AnimatePresence>
        {newPlayer && (
          <motion.div
            className="fixed top-4 left-0 right-0 flex justify-center z-50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
              <span className="text-amber-400 font-mono text-xs">
                ⚡ {newPlayer} joined the battle!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <div className="text-white/20 font-mono text-[10px] tracking-[0.2em] uppercase mb-2">
            ⚡ Battle Results
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-white mb-1">
            {data.challenge.topic}
          </h1>
          <p className="text-white/20 font-mono text-xs">CODE: {code}</p>

          {/* Live indicator */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-white/20 font-mono text-[10px]">
              Live updates enabled
            </span>
          </div>
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
