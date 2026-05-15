"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { unslugify, LEVEL_META } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import LevelCard from "@/components/LevelCard";
import GoDeeper from "@/components/GoDeeper";
import { LEVEL_XP } from "@/lib/xp";
import type { LevelData } from "@/lib/data";
import PageTransition from "@/components/PageTransition";

const AVATAR_COLORS = ["#10b981", "#f59e0b", "#f43f5e", "#a855f7"];
const LEVEL_COLORS = ["#4ade80", "#facc15", "#fb923c", "#f472b6", "#a78bfa"];
const POLL_INTERVAL = 5000;

interface Participant {
  id: string;
  userId: string;
  displayName: string;
  currentLevel: number;
  joinedAt: string;
}

interface RoomData {
  room: {
    id: string;
    code: string;
    topicName: string;
    topicSlug: string;
    hostId: string;
    hostName: string;
    maxParticipants: number;
    status: string;
    createdAt: string;
    expiresAt: string;
  };
  participants: Participant[];
  isExpired: boolean;
}

interface StatusEvent {
  id: string;
  text: string;
  timestamp: number;
}

export default function StudyRoomSession() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const { user, data: dataLayer } = useAuth();

  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusEvents, setStatusEvents] = useState<StatusEvent[]>([]);

  // Learning state (mirrors learn/[slug] page)
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingLevel, setStreamingLevel] = useState<number | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initialized = useRef(false);
  const prevParticipantsRef = useRef<Participant[]>([]);

  const lang = dataLayer.getLang();

  // Fetch room data
  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRoomData(data);
      return data as RoomData;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load room");
      return null;
    }
  }, [code]);

  // Initial load
  useEffect(() => {
    fetchRoom().then((data) => {
      setLoading(false);
      if (!data) return;

      // Auto-join if authenticated
      if (user) {
        handleJoin();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load cached levels for the topic
  useEffect(() => {
    if (!roomData || initialized.current) return;
    initialized.current = true;

    const slug = roomData.room.topicSlug;
    dataLayer.getTopicLevels(slug, lang).then((cached) => {
      if (cached.length > 0) {
        setLevels(cached);
        // Sync progress to room
        const maxComplete = Math.max(...cached.filter(l => l.complete).map(l => l.level), 0);
        if (maxComplete > 0) {
          fetch(`/api/rooms/${code}/progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ level: maxComplete }),
          });
        }
      } else {
        fetchLevel(1, [], lang);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomData]);

  // Poll for participant updates
  useEffect(() => {
    if (!joined) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${code}/progress`);
        const data = await res.json();
        if (data.participants) {
          // Detect level changes for status events
          const prev = prevParticipantsRef.current;
          for (const p of data.participants) {
            const old = prev.find((op: Participant) => op.id === p.id);
            if (old && p.currentLevel > old.currentLevel && p.userId !== user?.id) {
              addStatusEvent(`${p.displayName} reached Level ${p.currentLevel}! 🎉`);
            }
            if (!old && p.userId !== user?.id) {
              addStatusEvent(`${p.displayName} joined the room! 👋`);
            }
          }
          prevParticipantsRef.current = data.participants;

          setRoomData((prev) =>
            prev ? { ...prev, participants: data.participants } : prev
          );
        }
      } catch {
        // silently fail polling
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [joined, code, user?.id]);

  function addStatusEvent(text: string) {
    const event: StatusEvent = {
      id: Math.random().toString(36).slice(2),
      text,
      timestamp: Date.now(),
    };
    setStatusEvents((prev) => [...prev.slice(-19), event]);
  }

  // Auto-remove old status events after 10s
  useEffect(() => {
    if (statusEvents.length === 0) return;
    const timer = setTimeout(() => {
      setStatusEvents((prev) =>
        prev.filter((e) => Date.now() - e.timestamp < 10000)
      );
    }, 10000);
    return () => clearTimeout(timer);
  }, [statusEvents]);

  async function handleJoin() {
    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setJoined(true);
      // Refresh room data to get updated participants
      fetchRoom();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join room");
    }
  }

  const fetchLevel = useCallback(
    async (level: number, previousLevels: LevelData[], fetchLang?: string) => {
      if (!roomData) return;
      const activeLang = fetchLang || lang;
      const topic = roomData.room.topicName;

      setIsStreaming(true);
      setStreamingLevel(level);
      setStreamError(null);

      const newLevel: LevelData = { level, content: "", complete: false };
      const updated = [...previousLevels, newLevel];
      setLevels(updated);

      setTimeout(() => {
        document
          .getElementById(`level-${level}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      try {
        abortRef.current = new AbortController();

        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            level,
            lang: activeLang,
            previousLevels: previousLevels
              .filter((l) => l.complete)
              .map((l) => ({ level: l.level, content: l.content })),
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) {
                accumulated += parsed.text;
                setLevels((prev) =>
                  prev.map((l) =>
                    l.level === level ? { ...l, content: accumulated } : l
                  )
                );
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }

        // Mark complete
        let finalLevels: LevelData[] = [];
        setLevels((prev) => {
          finalLevels = prev.map((l) =>
            l.level === level
              ? { ...l, content: accumulated, complete: true }
              : l
          );
          return finalLevels;
        });

        dataLayer.saveTopicLevels(roomData.room.topicSlug, activeLang, finalLevels, topic);

        // Award XP
        const xpAmount = LEVEL_XP[level] || 10;
        await dataLayer.addXP(xpAmount);

        // Update room progress
        await fetch(`/api/rooms/${code}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ level }),
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setStreamError(
          e instanceof Error ? e.message : "Something went wrong. Try again."
        );
      } finally {
        setIsStreaming(false);
        setStreamingLevel(null);
      }
    },
    [roomData, lang, dataLayer, code]
  );

  const handleGoDeeper = useCallback(() => {
    const nextLevel = levels.length + 1;
    if (nextLevel > 5 || isStreaming) return;
    fetchLevel(nextLevel, levels, lang);
  }, [levels, isStreaming, fetchLevel, lang]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function handleCopyLink() {
    const url = `${window.location.origin}/study-room/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: try share
      if (navigator.share) {
        await navigator.share({
          title: `Study Room: ${roomData?.room.topicName}`,
          text: `Join my study room! Code: ${code}`,
          url,
        });
      }
    }
  }

  // Loading
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white/30 font-mono text-sm animate-pulse">
          Loading study room...
        </div>
      </main>
    );
  }

  // Error
  if (error && !roomData) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400/60 font-mono text-sm">{error}</p>
          <button
            onClick={() => router.push("/study-room")}
            className="mt-4 text-white/30 text-sm font-sans hover:text-white/50"
          >
            Back to Study Rooms
          </button>
        </div>
      </main>
    );
  }

  if (!roomData) return null;

  const { room, participants } = roomData;
  const topic = room.topicName;
  const currentLevel = levels.length;
  const lastLevel = levels[levels.length - 1];
  const showGoDeeper = lastLevel?.complete && currentLevel < 5 && !isStreaming;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Main content area */}
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 w-full">
        {/* Room header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.push("/study-room")}
              className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans"
            >
              &larr; Rooms
            </button>
          </div>

          {/* Room code banner */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl text-white">
              {topic}
            </h1>
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-400 text-lg sm:text-xl tracking-[0.2em] font-bold">
                {room.code}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs hover:bg-emerald-500/20 transition-all"
              >
                {copied ? "COPIED!" : "COPY LINK"}
              </button>
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-white/20 font-mono text-[10px] tracking-wider">
              LIVE STUDY SESSION · {participants.length}/{room.maxParticipants} learners
            </span>
          </div>
        </motion.div>

        {/* Participants sidebar on mobile (horizontal scroll) */}
        <div className="lg:hidden mb-6">
          <ParticipantBar
            participants={participants}
            hostId={room.hostId}
            currentUserId={user?.id}
          />
        </div>

        {/* Status events feed */}
        <AnimatePresence>
          {statusEvents.length > 0 && (
            <div className="mb-4 space-y-1">
              {statusEvents.slice(-3).map((event) => (
                <motion.div
                  key={event.id}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <span className="text-emerald-400/80 font-mono text-xs">
                    {event.text}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Level cards (same as learn/[slug]) */}
        <div className="space-y-6">
          {levels.map((level) => (
            <LevelCard
              key={level.level}
              level={level.level}
              content={level.content}
              isStreaming={streamingLevel === level.level}
              isLoading={streamingLevel === level.level && level.content.length === 0}
              topic={topic}
              lang={lang}
            />
          ))}
        </div>

        {/* Stream error */}
        {streamError && (
          <motion.div
            className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>{streamError}</p>
            <button
              onClick={() => {
                setStreamError(null);
                const retryLevel = levels.length;
                setLevels((prev) => prev.filter((l) => l.complete));
                fetchLevel(retryLevel, levels.filter((l) => l.complete));
              }}
              className="mt-2 text-red-300 hover:text-red-200 underline"
            >
              Try again
            </button>
          </motion.div>
        )}

        {/* Go Deeper button */}
        {showGoDeeper && (
          <div className="flex flex-col items-center gap-3">
            <GoDeeper
              nextLevel={currentLevel + 1}
              onClick={handleGoDeeper}
              isLoading={isStreaming}
            />
          </div>
        )}

        {/* All 5 levels complete */}
        {currentLevel >= 5 && lastLevel?.complete && (
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-white/30 font-sans text-sm">
              You&apos;ve reached the deepest level! Great study session!
            </p>
            <button
              onClick={() => router.push("/study-room")}
              className="mt-4 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white/60 hover:text-white/90 transition-all font-sans text-sm"
            >
              Back to Study Rooms
            </button>
          </motion.div>
        )}
      </main>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0 border-l border-white/[0.06] p-6 sticky top-0 h-screen overflow-y-auto">
        <ParticipantSidebar
          participants={participants}
          hostId={room.hostId}
          currentUserId={user?.id}
          roomCode={room.code}
          onCopyLink={handleCopyLink}
          copied={copied}
          statusEvents={statusEvents}
        />
      </aside>
    </div>
  );
}

// Horizontal participant bar for mobile
function ParticipantBar({
  participants,
  hostId,
  currentUserId,
}: {
  participants: Participant[];
  hostId: string;
  currentUserId?: string;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
      {participants.map((p, i) => (
        <motion.div
          key={p.id}
          className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white relative"
            style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
          >
            {p.displayName.charAt(0).toUpperCase()}
            {/* Active pulse */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className={`text-xs font-sans truncate max-w-[80px] ${
                p.userId === currentUserId ? "text-emerald-400" : "text-white/60"
              }`}>
                {p.displayName}
                {p.userId === currentUserId && <span className="text-white/20 text-[10px] ml-0.5">(you)</span>}
              </span>
              {p.userId === hostId && (
                <span className="text-[8px] font-mono bg-amber-500/15 text-amber-400/80 px-1 rounded">HOST</span>
              )}
            </div>
            <LevelDots level={p.currentLevel} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Desktop sidebar with full participant list and status events
function ParticipantSidebar({
  participants,
  hostId,
  currentUserId,
  roomCode,
  onCopyLink,
  copied,
  statusEvents,
}: {
  participants: Participant[];
  hostId: string;
  currentUserId?: string;
  roomCode: string;
  onCopyLink: () => void;
  copied: boolean;
  statusEvents: StatusEvent[];
}) {
  return (
    <div className="space-y-6">
      {/* Room code */}
      <div className="text-center">
        <div className="text-white/20 font-mono text-[10px] tracking-[0.2em] uppercase mb-2">
          Room Code
        </div>
        <div className="font-mono text-emerald-400 text-2xl tracking-[0.25em] font-bold">
          {roomCode}
        </div>
        <button
          onClick={onCopyLink}
          className="mt-2 px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs hover:bg-emerald-500/20 transition-all"
        >
          {copied ? "COPIED!" : "COPY INVITE LINK"}
        </button>
      </div>

      {/* Participants */}
      <div>
        <div className="text-white/30 font-mono text-[10px] tracking-[0.15em] uppercase mb-3">
          Learners ({participants.length})
        </div>
        <div className="space-y-2">
          {participants.map((p, i) => (
            <motion.div
              key={p.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white relative flex-shrink-0"
                style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                {p.displayName.charAt(0).toUpperCase()}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-sans truncate ${
                    p.userId === currentUserId ? "text-emerald-400" : "text-white/60"
                  }`}>
                    {p.displayName}
                  </span>
                  {p.userId === currentUserId && (
                    <span className="text-white/20 text-[10px]">(you)</span>
                  )}
                  {p.userId === hostId && (
                    <span className="text-[9px] font-mono bg-amber-500/15 text-amber-400/80 px-1.5 py-0.5 rounded">
                      HOST
                    </span>
                  )}
                </div>
                <LevelDots level={p.currentLevel} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Status events feed */}
      {statusEvents.length > 0 && (
        <div>
          <div className="text-white/30 font-mono text-[10px] tracking-[0.15em] uppercase mb-3">
            Activity
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-none">
            <AnimatePresence>
              {statusEvents.slice(-10).map((event) => (
                <motion.div
                  key={event.id}
                  className="text-emerald-400/60 font-mono text-[11px] px-2 py-1 rounded bg-emerald-500/5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {event.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

// Level progress dots (1-5)
function LevelDots({ level }: { level: number }) {
  return (
    <PageTransition>
    <div className="flex gap-1 mt-0.5">
      {[1, 2, 3, 4, 5].map((l) => (
        <motion.div
          key={l}
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: l <= level ? LEVEL_COLORS[l - 1] : "rgba(255,255,255,0.08)",
          }}
          initial={l === level ? { scale: 0 } : {}}
          animate={l === level ? { scale: 1 } : {}}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        />
      ))}
    </div>
      </PageTransition>
  );
}
