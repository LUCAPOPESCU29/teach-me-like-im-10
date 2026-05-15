"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import LevelCard from "@/components/LevelCard";
import GoDeeper from "@/components/GoDeeper";
import { LEVEL_XP } from "@/lib/xp";
import type { LevelData } from "@/lib/data";
import PageTransition from "@/components/PageTransition";
import { createClient } from "@/lib/supabase/client";

const AVATAR_COLORS = ["#10b981", "#f59e0b", "#f43f5e", "#a855f7", "#3b82f6"];
const LEVEL_COLORS = ["#4ade80", "#facc15", "#fb923c", "#f472b6", "#a78bfa"];
const REACTION_EMOJIS = ["🤯", "💡", "😅", "🔥", "❤️"];

interface Participant {
  id: string;
  userId: string;
  displayName: string;
  currentLevel: number;
  joinedAt: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  content: string;
  createdAt: string;
}

interface ReactionsMap {
  [level: number]: { [emoji: string]: { count: number; userReacted: boolean } };
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
    hostLevel: number;
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

  // Learning state
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingLevel, setStreamingLevel] = useState<number | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initialized = useRef(false);
  const prevParticipantsRef = useRef<Participant[]>([]);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [mobileTab, setMobileTab] = useState<"learn" | "chat">("learn");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Reactions state
  const [reactions, setReactions] = useState<ReactionsMap>({});

  // Host pacing state
  const [hostLevel, setHostLevel] = useState(0);
  const [paceNotice, setPaceNotice] = useState<number | null>(null);
  const [settingPace, setSettingPace] = useState(false);

  // Status events
  const [statusEvents, setStatusEvents] = useState<StatusEvent[]>([]);

  const lang = dataLayer.getLang();

  // ── Fetch initial room data ──────────────────────────────────────────────
  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data as RoomData;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load room");
      return null;
    }
  }, [code]);

  useEffect(() => {
    fetchRoom().then((data) => {
      setLoading(false);
      if (!data) return;
      setRoomData(data);
      setHostLevel(data.room.hostLevel ?? 0);
      if (user) handleJoin();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load cached levels for the topic ────────────────────────────────────
  useEffect(() => {
    if (!roomData || initialized.current) return;
    initialized.current = true;
    const slug = roomData.room.topicSlug;
    dataLayer.getTopicLevels(slug, lang).then((cached) => {
      if (cached.length > 0) {
        setLevels(cached);
        const maxComplete = Math.max(...cached.filter((l) => l.complete).map((l) => l.level), 0);
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

  // ── Load initial chat messages + reactions ───────────────────────────────
  useEffect(() => {
    if (!roomData) return;
    fetch(`/api/rooms/${code}/messages`)
      .then((r) => r.json())
      .then((d) => { if (d.messages) setMessages(d.messages); })
      .catch(() => {});

    fetch(`/api/rooms/${code}/reactions`)
      .then((r) => r.json())
      .then((d) => { if (d.reactions) setReactions(d.reactions); })
      .catch(() => {});
  }, [roomData, code]);

  // ── Supabase Realtime subscriptions ─────────────────────────────────────
  useEffect(() => {
    if (!roomData) return;
    const supabase = createClient();
    const roomId = roomData.room.id;

    const channel = supabase
      .channel(`room:${code}`)
      // Participant changes (join, level up)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "study_room_participants", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const p = payload.new as Record<string, unknown>;
          if (!p) return;
          const updated: Participant = {
            id: p.id as string,
            userId: p.user_id as string,
            displayName: p.display_name as string,
            currentLevel: p.current_level as number,
            joinedAt: p.joined_at as string,
          };

          setRoomData((prev) => {
            if (!prev) return prev;
            const existing = prev.participants.find((x) => x.id === updated.id);
            if (!existing && payload.eventType === "INSERT") {
              if (updated.userId !== user?.id) addStatusEvent(`${updated.displayName} joined! 👋`);
              return { ...prev, participants: [...prev.participants, updated] };
            }
            if (existing && updated.currentLevel > existing.currentLevel && updated.userId !== user?.id) {
              addStatusEvent(`${updated.displayName} reached Level ${updated.currentLevel}! 🎉`);
            }
            return {
              ...prev,
              participants: prev.participants.map((x) => (x.id === updated.id ? updated : x)),
            };
          });
        }
      )
      // New chat messages
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const m = payload.new as Record<string, unknown>;
          setMessages((prev) => {
            if (prev.find((x) => x.id === m.id)) return prev;
            return [
              ...prev,
              {
                id: m.id as string,
                userId: m.user_id as string,
                displayName: m.display_name as string,
                content: m.content as string,
                createdAt: m.created_at as string,
              },
            ];
          });
        }
      )
      // Reaction inserts
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_reactions", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          const level = r.level as number;
          const emoji = r.emoji as string;
          const isMe = r.user_id === user?.id;
          setReactions((prev) => {
            const levelReactions = { ...(prev[level] || {}) };
            const current = levelReactions[emoji] || { count: 0, userReacted: false };
            levelReactions[emoji] = { count: current.count + 1, userReacted: isMe || current.userReacted };
            return { ...prev, [level]: levelReactions };
          });
        }
      )
      // Reaction deletes
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "room_reactions", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const r = payload.old as Record<string, unknown>;
          const level = r.level as number;
          const emoji = r.emoji as string;
          const isMe = r.user_id === user?.id;
          setReactions((prev) => {
            const levelReactions = { ...(prev[level] || {}) };
            const current = levelReactions[emoji];
            if (!current) return prev;
            const newCount = Math.max(0, current.count - 1);
            if (newCount === 0) {
              const { [emoji]: _removed, ...rest } = levelReactions;
              return { ...prev, [level]: rest };
            }
            levelReactions[emoji] = { count: newCount, userReacted: isMe ? false : current.userReacted };
            return { ...prev, [level]: levelReactions };
          });
        }
      )
      // Room updates (host_level changes)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "study_rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          const newHostLevel = r.host_level as number;
          if (newHostLevel > 0) {
            setHostLevel(newHostLevel);
            // Show pace notice to non-host participants
            if (user?.id !== roomData?.room.hostId) {
              setPaceNotice(newHostLevel);
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomData?.room.id]);

  // ── Auto-scroll chat to bottom ───────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Status events helper ─────────────────────────────────────────────────
  function addStatusEvent(text: string) {
    const event: StatusEvent = { id: Math.random().toString(36).slice(2), text, timestamp: Date.now() };
    setStatusEvents((prev) => [...prev.slice(-19), event]);
    setTimeout(() => {
      setStatusEvents((prev) => prev.filter((e) => Date.now() - e.timestamp < 10000));
    }, 10000);
  }

  // ── Join room ────────────────────────────────────────────────────────────
  async function handleJoin() {
    try {
      const res = await fetch(`/api/rooms/${code}/join`, { method: "POST" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setJoined(true);
      fetchRoom().then((d) => { if (d) setRoomData(d); });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join room");
    }
  }

  // ── Fetch a level ────────────────────────────────────────────────────────
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
        document.getElementById(`level-${level}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            previousLevels: previousLevels.filter((l) => l.complete).map((l) => ({ level: l.level, content: l.content })),
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
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) {
                accumulated += parsed.text;
                setLevels((prev) => prev.map((l) => l.level === level ? { ...l, content: accumulated } : l));
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }

        let finalLevels: LevelData[] = [];
        setLevels((prev) => {
          finalLevels = prev.map((l) => l.level === level ? { ...l, content: accumulated, complete: true } : l);
          return finalLevels;
        });

        dataLayer.saveTopicLevels(roomData.room.topicSlug, activeLang, finalLevels, topic);
        await dataLayer.addXP(LEVEL_XP[level] || 10);
        await fetch(`/api/rooms/${code}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ level }),
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setStreamError(e instanceof Error ? e.message : "Something went wrong. Try again.");
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

  // ── Chat send ────────────────────────────────────────────────────────────
  async function handleSendMessage() {
    const content = chatInput.trim();
    if (!content || sendingMsg) return;
    setSendingMsg(true);
    setChatInput("");
    try {
      await fetch(`/api/rooms/${code}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    } catch {
      setChatInput(content);
    } finally {
      setSendingMsg(false);
    }
  }

  // ── Reaction toggle ──────────────────────────────────────────────────────
  async function handleReaction(level: number, emoji: string) {
    if (!user) return;
    // Optimistic update
    setReactions((prev) => {
      const levelReactions = { ...(prev[level] || {}) };
      const current = levelReactions[emoji] || { count: 0, userReacted: false };
      if (current.userReacted) {
        const newCount = Math.max(0, current.count - 1);
        if (newCount === 0) {
          const { [emoji]: _removed, ...rest } = levelReactions;
          return { ...prev, [level]: rest };
        }
        levelReactions[emoji] = { count: newCount, userReacted: false };
      } else {
        levelReactions[emoji] = { count: current.count + 1, userReacted: true };
      }
      return { ...prev, [level]: levelReactions };
    });
    await fetch(`/api/rooms/${code}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, emoji }),
    });
  }

  // ── Host pacing ──────────────────────────────────────────────────────────
  async function handleSetPace(level: number) {
    setSettingPace(true);
    try {
      await fetch(`/api/rooms/${code}/pace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      setHostLevel(level);
      addStatusEvent(`You pushed everyone to Level ${level} 📢`);
    } finally {
      setSettingPace(false);
    }
  }

  async function handleJumpToHostLevel() {
    if (!paceNotice) return;
    setPaceNotice(null);
    const target = paceNotice;
    // Load all levels up to target that haven't been loaded
    let current = [...levels];
    for (let l = current.length + 1; l <= target; l++) {
      await fetchLevel(l, current.filter((x) => x.complete), lang);
      current = [...current, { level: l, content: "", complete: false }];
    }
  }

  useEffect(() => { return () => { abortRef.current?.abort(); }; }, []);

  async function handleCopyLink() {
    const url = `${window.location.origin}/study-room/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (navigator.share) await navigator.share({ title: `Study Room: ${roomData?.room.topicName}`, text: `Join my study room! Code: ${code}`, url });
    }
  }

  // ── Loading / error states ───────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white/30 font-mono text-sm animate-pulse">Loading study room...</div>
      </main>
    );
  }

  if (error && !roomData) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400/60 font-mono text-sm">{error}</p>
          <button onClick={() => router.push("/study-room")} className="mt-4 text-white/30 text-sm font-sans hover:text-white/50">
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
  const isHost = user?.id === room.hostId;
  const nextHostLevel = Math.min(5, (levels.filter((l) => l.complete).length || 1) + 1);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Main content ── */}
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-4 w-full">
        {/* Header */}
        <motion.div className="mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => router.push("/study-room")} className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans">
              &larr; Rooms
            </button>
          </div>
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl text-white">{topic}</h1>
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-400 text-lg tracking-[0.2em] font-bold">{room.code}</span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs hover:bg-emerald-500/20 transition-all"
              >
                {copied ? "COPIED!" : "COPY LINK"}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div className="w-2 h-2 rounded-full bg-emerald-400" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
            <span className="text-white/20 font-mono text-[10px] tracking-wider">
              LIVE · {participants.length}/{room.maxParticipants} learners
            </span>
          </div>
        </motion.div>

        {/* Mobile: participant bar */}
        <div className="lg:hidden mb-4">
          <ParticipantBar participants={participants} hostId={room.hostId} currentUserId={user?.id} />
        </div>

        {/* Host pace notice (non-host) */}
        <AnimatePresence>
          {paceNotice !== null && paceNotice > currentLevel && (
            <motion.div
              className="mb-4 flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            >
              <span className="text-amber-300 font-sans text-sm">
                📢 <strong>{room.hostName}</strong> pushed to Level {paceNotice} — jump there?
              </span>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleJumpToHostLevel}
                  className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs hover:bg-amber-500/30 transition-all"
                >
                  JUMP
                </button>
                <button onClick={() => setPaceNotice(null)} className="text-white/30 text-xs font-sans hover:text-white/50">✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status events */}
        <AnimatePresence>
          {statusEvents.length > 0 && (
            <div className="mb-4 space-y-1">
              {statusEvents.slice(-3).map((event) => (
                <motion.div
                  key={event.id}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                >
                  <span className="text-emerald-400/80 font-mono text-xs">{event.text}</span>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Mobile tab bar */}
        <div className="lg:hidden flex mb-4 rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
          <button
            onClick={() => setMobileTab("learn")}
            className={`flex-1 py-2.5 font-mono text-xs tracking-wider transition-all ${mobileTab === "learn" ? "bg-emerald-500/15 text-emerald-300" : "text-white/30"}`}
          >
            📚 LEARN
          </button>
          <button
            onClick={() => setMobileTab("chat")}
            className={`flex-1 py-2.5 font-mono text-xs tracking-wider transition-all relative ${mobileTab === "chat" ? "bg-emerald-500/15 text-emerald-300" : "text-white/30"}`}
          >
            💬 CHAT
            {messages.length > 0 && mobileTab !== "chat" && (
              <span className="absolute top-1.5 right-4 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Learn tab content */}
        {(mobileTab === "learn" || typeof window === "undefined") && (
          <div className="lg:block">
            <div className="space-y-6">
              {levels.map((level) => (
                <div key={level.level} id={`level-${level.level}`}>
                  <LevelCard
                    level={level.level}
                    content={level.content}
                    isStreaming={streamingLevel === level.level}
                    isLoading={streamingLevel === level.level && level.content.length === 0}
                    topic={topic}
                    lang={lang}
                  />
                  {/* Reaction bar — shown after level completes */}
                  {level.complete && (
                    <ReactionBar
                      level={level.level}
                      reactions={reactions[level.level] || {}}
                      onReact={(emoji) => handleReaction(level.level, emoji)}
                      disabled={!user}
                    />
                  )}
                </div>
              ))}
            </div>

            {streamError && (
              <motion.div
                className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-sans"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
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

            {showGoDeeper && (
              <div className="flex flex-col items-center gap-3 mt-2">
                <GoDeeper nextLevel={currentLevel + 1} onClick={handleGoDeeper} isLoading={isStreaming} />
              </div>
            )}

            {currentLevel >= 5 && lastLevel?.complete && (
              <motion.div className="mt-8 text-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-white/30 font-sans text-sm">You&apos;ve reached the deepest level! Great study session!</p>
                <button
                  onClick={() => router.push("/study-room")}
                  className="mt-4 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white/60 hover:text-white/90 transition-all font-sans text-sm"
                >
                  Back to Study Rooms
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Mobile chat tab */}
        {mobileTab === "chat" && (
          <div className="lg:hidden flex flex-col" style={{ height: "calc(100vh - 280px)" }}>
            <ChatPanel
              messages={messages}
              currentUserId={user?.id}
              chatInput={chatInput}
              onInputChange={setChatInput}
              onSend={handleSendMessage}
              sending={sendingMsg}
              chatEndRef={chatEndRef}
            />
          </div>
        )}

        <div className="h-8" />
      </main>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 flex-shrink-0 border-l border-white/[0.06] sticky top-0 h-screen">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
          {/* Room code */}
          <div className="text-center">
            <div className="text-white/20 font-mono text-[10px] tracking-[0.2em] uppercase mb-2">Room Code</div>
            <div className="font-mono text-emerald-400 text-2xl tracking-[0.25em] font-bold">{room.code}</div>
            <button
              onClick={handleCopyLink}
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
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
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
                      <span className={`text-sm font-sans truncate ${p.userId === user?.id ? "text-emerald-400" : "text-white/60"}`}>
                        {p.displayName}
                      </span>
                      {p.userId === user?.id && <span className="text-white/20 text-[10px]">(you)</span>}
                      {p.userId === room.hostId && (
                        <span className="text-[9px] font-mono bg-amber-500/15 text-amber-400/80 px-1.5 py-0.5 rounded">HOST</span>
                      )}
                    </div>
                    <LevelDots level={p.currentLevel} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Host pace controls */}
          {isHost && (
            <div>
              <div className="text-white/30 font-mono text-[10px] tracking-[0.15em] uppercase mb-3">Sync Everyone</div>
              <p className="text-white/25 font-sans text-xs mb-3 leading-relaxed">
                Push all participants to a level at once.
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleSetPace(lvl)}
                    disabled={settingPace}
                    className={`py-2 rounded-lg font-mono text-xs transition-all ${
                      hostLevel === lvl
                        ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                        : "bg-white/[0.03] border border-white/[0.06] text-white/40 hover:border-amber-500/30 hover:text-amber-300"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              {hostLevel > 0 && (
                <p className="text-amber-400/50 font-mono text-[10px] mt-2">Currently synced to Level {hostLevel}</p>
              )}
            </div>
          )}

          {/* Activity feed */}
          {statusEvents.length > 0 && (
            <div>
              <div className="text-white/30 font-mono text-[10px] tracking-[0.15em] uppercase mb-3">Activity</div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-none">
                <AnimatePresence>
                  {statusEvents.slice(-8).map((event) => (
                    <motion.div
                      key={event.id}
                      className="text-emerald-400/60 font-mono text-[11px] px-2 py-1 rounded bg-emerald-500/5"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    >
                      {event.text}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Chat — pinned at bottom of sidebar */}
        <div className="border-t border-white/[0.06] flex flex-col" style={{ height: "340px" }}>
          <div className="px-4 pt-3 pb-1">
            <span className="text-white/30 font-mono text-[10px] tracking-[0.15em] uppercase">Chat</span>
          </div>
          <ChatPanel
            messages={messages}
            currentUserId={user?.id}
            chatInput={chatInput}
            onInputChange={setChatInput}
            onSend={handleSendMessage}
            sending={sendingMsg}
            chatEndRef={chatEndRef}
          />
        </div>
      </aside>
    </div>
  );
}

// ── Reaction bar ──────────────────────────────────────────────────────────────
function ReactionBar({
  level,
  reactions,
  onReact,
  disabled,
}: {
  level: number;
  reactions: { [emoji: string]: { count: number; userReacted: boolean } };
  onReact: (emoji: string) => void;
  disabled: boolean;
}) {
  return (
    <motion.div
      className="flex gap-2 mt-2 px-1"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {REACTION_EMOJIS.map((emoji) => {
        const data = reactions[emoji];
        const reacted = data?.userReacted ?? false;
        const count = data?.count ?? 0;
        return (
          <motion.button
            key={emoji}
            onClick={() => !disabled && onReact(emoji)}
            whileTap={{ scale: 0.88 }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all border ${
              reacted
                ? "bg-emerald-500/15 border-emerald-500/35 text-white"
                : "bg-white/[0.03] border-white/[0.07] text-white/50 hover:border-white/20 hover:text-white/80"
            } ${disabled ? "cursor-default" : "cursor-pointer"}`}
          >
            <span>{emoji}</span>
            {count > 0 && (
              <span className={`font-mono text-[10px] ${reacted ? "text-emerald-400" : "text-white/30"}`}>
                {count}
              </span>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

// ── Chat panel ────────────────────────────────────────────────────────────────
function ChatPanel({
  messages,
  currentUserId,
  chatInput,
  onInputChange,
  onSend,
  sending,
  chatEndRef,
}: {
  messages: ChatMessage[];
  currentUserId?: string;
  chatInput: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-none">
        {messages.length === 0 && (
          <p className="text-white/15 font-sans text-xs text-center pt-4">No messages yet. Say hi! 👋</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.userId === currentUserId;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              {!isMe && (
                <span className="text-white/30 font-mono text-[10px] mb-0.5 ml-1">{msg.displayName}</span>
              )}
              <div
                className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-sm font-sans leading-relaxed break-words ${
                  isMe
                    ? "bg-emerald-500/20 border border-emerald-500/25 text-white rounded-br-sm"
                    : "bg-white/[0.05] border border-white/[0.07] text-white/80 rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-1 flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder="Message..."
          maxLength={500}
          className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-sans text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/30 min-w-0"
        />
        <motion.button
          onClick={onSend}
          disabled={!chatInput.trim() || sending}
          whileTap={{ scale: 0.92 }}
          className="w-9 h-9 flex-shrink-0 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center disabled:opacity-30 hover:bg-emerald-500/25 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}

// ── Horizontal participant bar (mobile) ───────────────────────────────────────
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
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white relative"
            style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
          >
            {p.displayName.charAt(0).toUpperCase()}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className={`text-xs font-sans truncate max-w-[80px] ${p.userId === currentUserId ? "text-emerald-400" : "text-white/60"}`}>
                {p.displayName}
                {p.userId === currentUserId && <span className="text-white/20 text-[10px] ml-0.5">(you)</span>}
              </span>
              {p.userId === hostId && <span className="text-[8px] font-mono bg-amber-500/15 text-amber-400/80 px-1 rounded">HOST</span>}
            </div>
            <LevelDots level={p.currentLevel} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Level progress dots ───────────────────────────────────────────────────────
function LevelDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1 mt-0.5">
      {[1, 2, 3, 4, 5].map((l) => (
        <motion.div
          key={l}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: l <= level ? LEVEL_COLORS[l - 1] : "rgba(255,255,255,0.08)" }}
          initial={l === level ? { scale: 0 } : {}}
          animate={l === level ? { scale: 1 } : {}}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        />
      ))}
    </div>
  );
}
