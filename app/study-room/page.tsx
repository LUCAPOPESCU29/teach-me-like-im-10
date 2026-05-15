"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { slugify } from "@/lib/utils";
import PageTransition from "@/components/PageTransition";
import { isPro } from "@/lib/limits";
import ProUpgradeModal from "@/components/ProUpgradeModal";

interface ActiveRoom {
  id: string;
  code: string;
  topicName: string;
  topicSlug: string;
  hostName: string;
  maxParticipants: number;
  participantCount: number;
  status: string;
  createdAt: string;
}

export default function StudyRoomPage() {
  const router = useRouter();
  const { user, isGuest } = useAuth();

  const [view, setView] = useState<"menu" | "create" | "join">("menu");
  const [topicInput, setTopicInput] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [rooms, setRooms] = useState<ActiveRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [showProModal, setShowProModal] = useState(false);

  // Fetch active rooms
  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch("/api/rooms");
        const data = await res.json();
        if (data.rooms) setRooms(data.rooms);
      } catch {
        // silently fail
      } finally {
        setLoadingRooms(false);
      }
    }
    fetchRooms();
  }, []);

  async function handleCreate() {
    if (!topicInput.trim()) return;
    if (!isPro()) {
      setShowProModal(true);
      return;
    }
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicName: topicInput.trim(),
          topicSlug: slugify(topicInput.trim()),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      router.push(`/study-room/${data.code}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create room";
      if (msg.includes("Authentication")) {
        setError("Sign in to create a study room");
      } else if (msg.includes("being set up")) {
        setError("Study rooms are being set up — check back soon!");
      } else {
        setError(msg);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setJoining(true);
    setError("");

    try {
      const res = await fetch(`/api/rooms/${joinCode.toUpperCase()}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      router.push(`/study-room/${joinCode.toUpperCase()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join room");
    } finally {
      setJoining(false);
    }
  }

  // Guest prompt
  if (isGuest) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          className="max-w-sm w-full text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-4xl mb-4">📚</div>
          <h1 className="font-display text-2xl text-white mb-3">Study Rooms</h1>
          <p className="text-white/40 font-sans text-sm mb-6">
            Sign in to create or join study rooms and learn together with friends.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-xl font-mono text-sm tracking-wider border border-emerald-500/40 text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all"
          >
            SIGN IN TO GET STARTED
          </button>
          <button
            onClick={() => router.push("/")}
            className="mt-4 block mx-auto text-white/20 text-xs font-sans hover:text-white/40 transition-colors"
          >
            Go home
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <PageTransition>
    <main className="min-h-screen max-w-2xl mx-auto px-4 py-8 pb-24 lg:ml-52">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans"
          >
            &larr; Home
          </button>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-white mb-2">
          Study Rooms
        </h1>
        <p className="text-white/30 font-sans text-sm mb-8">
          Learn together in real-time. Create a room or join one with a code.
        </p>

        {/* Action cards */}
        <AnimatePresence mode="wait">
          {view === "menu" && (
            <motion.div
              key="menu"
              className="grid sm:grid-cols-2 gap-4 mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Create Room */}
              <button
                onClick={() => setView("create")}
                className="group relative text-left p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all"
              >
                {!isPro() && (
                  <span
                    className="absolute top-3 right-3 px-1.5 py-0.5 rounded-full text-[9px] font-sans font-semibold"
                    style={{
                      background: "rgba(251,191,36,0.12)",
                      border: "1px solid rgba(251,191,36,0.28)",
                      color: "#fbbf24",
                    }}
                  >
                    PRO
                  </span>
                )}
                <div className="text-2xl mb-3">🏠</div>
                <h2 className="font-display text-lg text-white mb-1 group-hover:text-emerald-300 transition-colors">
                  Create a Room
                </h2>
                <p className="text-white/30 font-sans text-sm">
                  Pick a topic and invite friends to learn together
                </p>
              </button>

              {/* Join Room */}
              <button
                onClick={() => setView("join")}
                className="group text-left p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-amber-500/30 hover:bg-amber-500/[0.03] transition-all"
              >
                <div className="text-2xl mb-3">🔗</div>
                <h2 className="font-display text-lg text-white mb-1 group-hover:text-amber-300 transition-colors">
                  Join a Room
                </h2>
                <p className="text-white/30 font-sans text-sm">
                  Enter a 6-character code to join a friend&apos;s room
                </p>
              </button>
            </motion.div>
          )}

          {view === "create" && (
            <motion.div
              key="create"
              className="max-w-sm mb-10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={() => { setView("menu"); setError(""); }}
                className="text-white/30 text-xs font-sans hover:text-white/50 transition-colors mb-4 inline-block"
              >
                &larr; Back
              </button>
              <h2 className="font-display text-xl text-white mb-4">Choose a Topic</h2>
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Quantum Physics, Black Holes, DNA..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-sans text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 mb-4"
                autoFocus
              />
              {error && (
                <p className="text-red-400/60 font-mono text-xs mb-3">{error}</p>
              )}
              <button
                onClick={handleCreate}
                disabled={!topicInput.trim() || creating}
                className="w-full px-6 py-3 rounded-xl font-mono text-sm tracking-wider border border-emerald-500/40 text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10 disabled:opacity-30 transition-all"
              >
                {creating ? "CREATING..." : "CREATE ROOM"}
              </button>
            </motion.div>
          )}

          {view === "join" && (
            <motion.div
              key="join"
              className="max-w-sm mb-10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={() => { setView("menu"); setError(""); }}
                className="text-white/30 text-xs font-sans hover:text-white/50 transition-colors mb-4 inline-block"
              >
                &larr; Back
              </button>
              <h2 className="font-display text-xl text-white mb-4">Enter Room Code</h2>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="XXXXXX"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xl text-center tracking-[0.3em] placeholder:text-white/20 placeholder:tracking-[0.3em] focus:outline-none focus:border-amber-500/40 mb-4"
                autoFocus
              />
              {error && (
                <p className="text-red-400/60 font-mono text-xs mb-3">{error}</p>
              )}
              <button
                onClick={handleJoin}
                disabled={joinCode.length < 6 || joining}
                className="w-full px-6 py-3 rounded-xl font-mono text-sm tracking-wider border border-amber-500/40 text-amber-300 bg-amber-500/5 hover:bg-amber-500/10 disabled:opacity-30 transition-all"
              >
                {joining ? "JOINING..." : "JOIN ROOM"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Public Rooms */}
        <div>
          <h2 className="font-display text-lg text-white/60 mb-4">
            Active Rooms
          </h2>
          {loadingRooms ? (
            <div className="text-white/20 font-mono text-sm animate-pulse">
              Loading rooms...
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-3">🌙</div>
              <p className="text-white/30 font-sans text-sm">
                No active rooms right now. Be the first to create one!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room, i) => (
                <motion.div
                  key={room.id}
                  className="group flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/20 transition-all cursor-pointer"
                  onClick={() => router.push(`/study-room/${room.code}`)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display text-white text-sm truncate">
                        {room.topicName}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider uppercase ${
                        room.status === "waiting"
                          ? "bg-amber-500/10 text-amber-400/70 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20"
                      }`}>
                        {room.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-white/30 font-mono text-xs">
                      <span>Host: {room.hostName}</span>
                      <span>{room.participantCount}/{room.maxParticipants} learners</span>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="font-mono text-emerald-400/60 text-xs tracking-[0.15em] group-hover:text-emerald-400 transition-colors">
                      {room.code}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </main>
    <ProUpgradeModal
      open={showProModal}
      onClose={() => setShowProModal(false)}
      featureName="Study Rooms"
      featureEmoji="🏠"
      featureDescription="Create private study rooms and learn with friends in real-time — a Pro-exclusive feature."
    />
      </PageTransition>
  );
}
