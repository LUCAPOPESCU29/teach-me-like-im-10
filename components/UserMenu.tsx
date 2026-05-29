"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthProvider";

export function useGhostMode() {
  const [ghostMode, setGhostMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tmi10_ghost_mode");
    if (stored === "true") setGhostMode(true);
  }, []);

  const toggleGhostMode = () => {
    setGhostMode((prev) => {
      const next = !prev;
      localStorage.setItem("tmi10_ghost_mode", String(next));
      window.dispatchEvent(new Event("ghost-mode-change"));
      return next;
    });
  };

  return { ghostMode, toggleGhostMode };
}

export default function UserMenu() {
  const { user, isGuest, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { ghostMode, toggleGhostMode } = useGhostMode();

  if (isGuest) {
    return (
      <button
        onClick={() => router.push("/auth/login")}
        className="px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 font-sans text-xs transition-all"
      >
        Sign in
      </button>
    );
  }

  const displayName =
    user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
      >
        <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-300 font-mono">
          {displayName[0].toUpperCase()}
        </div>
        <span className="text-white/50 text-xs font-sans">{displayName}</span>
        {ghostMode && <span className="text-xs opacity-60">{"\uD83D\uDC7B"}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-[#0a1020]/95 backdrop-blur-xl p-2 z-50"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <p className="px-3 py-2 text-white/30 text-[10px] font-mono truncate">
              {user?.email}
            </p>
            <button
              onClick={() => {
                router.push(`/profile/${user?.id}`);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-white/50 text-sm font-sans hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors"
            >
              My Profile
            </button>
            <button
              onClick={() => {
                router.push("/progress");
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-white/50 text-sm font-sans hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors"
            >
              My Progress
            </button>
            <button
              onClick={() => {
                router.push("/library");
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-white/50 text-sm font-sans hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors"
            >
              My Library
            </button>
            <button
              onClick={() => {
                router.push("/flashcards");
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-white/50 text-sm font-sans hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors"
            >
              Flashcards
            </button>
            <button
              onClick={() => {
                router.push("/paths");
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-white/50 text-sm font-sans hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors"
            >
              Learning Paths
            </button>
            <button
              onClick={() => {
                router.push("/leaderboard");
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-white/50 text-sm font-sans hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors"
            >
              Leaderboard
            </button>
            <div className="border-t border-white/5 mt-1 pt-1">
              <button
                onClick={toggleGhostMode}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <span className="text-white/50 text-sm font-sans group-hover:text-white/70 flex items-center gap-1.5">
                  <span className="text-base">{"\uD83D\uDC7B"}</span> Ghost Mode
                </span>
                <div
                  className={`relative w-8 h-[18px] rounded-full transition-colors duration-200 ${
                    ghostMode ? "bg-purple-500/40" : "bg-white/10"
                  }`}
                >
                  <div
                    className={`absolute top-[2px] w-[14px] h-[14px] rounded-full transition-all duration-200 ${
                      ghostMode
                        ? "left-[16px] bg-purple-400"
                        : "left-[2px] bg-white/30"
                    }`}
                  />
                </div>
              </button>
            </div>
            <div className="border-t border-white/5 mt-1 pt-1">
              <button
                onClick={async () => {
                  await signOut();
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-red-400/60 text-sm font-sans hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
              >
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
