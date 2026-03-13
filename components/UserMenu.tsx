"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthProvider";

export default function UserMenu() {
  const { user, isGuest, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
