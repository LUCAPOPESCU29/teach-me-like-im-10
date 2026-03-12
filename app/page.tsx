"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import TopicInput from "@/components/TopicInput";
import ExampleTopics from "@/components/ExampleTopics";
import DailyChallenge from "@/components/DailyChallenge";
import LanguagePicker from "@/components/LanguagePicker";
import XPBadge from "@/components/XPBadge";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/components/AuthProvider";
import type { LangCode } from "@/lib/utils";

export default function Home() {
  const { data, isGuest } = useAuth();
  const router = useRouter();
  const [lang, setLang] = useState<LangCode>("en");
  const [joinCode, setJoinCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const joinInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = data.getLang() as LangCode;
    if (saved) setLang(saved);
  }, [data]);

  // Close mobile menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [mobileMenuOpen]);

  function handleLangChange(code: LangCode) {
    setLang(code);
    data.setLang(code);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Ambient hero glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-purple-500/[0.03] blur-[100px] pointer-events-none" />

      {/* Top bar */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <XPBadge />
        <UserMenu />
      </div>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2" ref={mobileMenuRef}>
        {/* Desktop nav items */}
        <div className="hidden sm:flex items-center gap-2">
          <AnimatePresence mode="wait">
            {!showJoinInput ? (
              <motion.button
                key="breadcrumb"
                onClick={() => {
                  setShowJoinInput(true);
                  setTimeout(() => joinInputRef.current?.focus(), 100);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500/[0.04] border border-amber-500/10 text-amber-400/40 hover:text-amber-400/70 hover:border-amber-500/25 hover:bg-amber-500/[0.08] font-sans text-xs transition-all duration-300"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                Join Challenge
              </motion.button>
            ) : (
              <motion.div
                key="input"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#070b14]/90 backdrop-blur-xl border border-amber-500/15 shadow-lg shadow-black/20"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  ref={joinInputRef}
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && joinCode.trim()) {
                      router.push(`/challenge/${joinCode.trim()}`);
                    }
                    if (e.key === "Escape") {
                      setShowJoinInput(false);
                      setJoinCode("");
                    }
                  }}
                  placeholder="CODE"
                  maxLength={6}
                  className="w-20 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-xs tracking-[0.15em] text-center placeholder:text-white/20 focus:outline-none focus:border-amber-500/30 transition-colors"
                />
                <button
                  onClick={() => {
                    if (joinCode.trim()) {
                      router.push(`/challenge/${joinCode.trim()}`);
                    }
                  }}
                  disabled={!joinCode.trim()}
                  className="px-2 py-1 rounded-lg border border-amber-500/30 text-amber-400/70 font-mono text-[10px] tracking-wider hover:bg-amber-500/10 disabled:opacity-20 transition-all"
                >
                  JOIN
                </button>
                <button
                  onClick={() => {
                    setShowJoinInput(false);
                    setJoinCode("");
                  }}
                  className="text-white/20 hover:text-white/50 text-xs transition-colors"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => router.push("/math")}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/[0.06] border border-indigo-500/15 text-indigo-400/60 hover:text-indigo-400/90 hover:bg-indigo-500/[0.12] hover:border-indigo-500/30 font-sans text-xs transition-all duration-300"
          >
            Math Edition
          </button>
          <button
            onClick={() => router.push("/code")}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15 text-emerald-400/60 hover:text-emerald-400/90 hover:bg-emerald-500/[0.12] hover:border-emerald-500/30 font-sans text-xs transition-all duration-300"
          >
            Code Edition
          </button>
          <button
            onClick={() => router.push("/paths")}
            className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] hover:border-white/10 font-sans text-xs transition-all duration-300"
          >
            Paths
          </button>
          <button
            onClick={() => router.push("/leaderboard")}
            className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] hover:border-white/10 font-sans text-xs transition-all duration-300"
          >
            Leaderboard
          </button>
        </div>

        <LanguagePicker value={lang} onChange={handleLangChange} />

        {/* Mobile hamburger button */}
        <button
          onClick={() => setMobileMenuOpen((o) => !o)}
          className="flex sm:hidden items-center justify-center w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all duration-300"
          aria-label="Menu"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            {mobileMenuOpen ? (
              <>
                <line x1="4" y1="4" x2="12" y2="12" />
                <line x1="12" y1="4" x2="4" y2="12" />
              </>
            ) : (
              <>
                <line x1="2" y1="4" x2="14" y2="4" />
                <line x1="2" y1="8" x2="14" y2="8" />
                <line x1="2" y1="12" x2="14" y2="12" />
              </>
            )}
          </svg>
        </button>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="absolute top-full right-0 mt-2 w-48 rounded-xl border border-white/[0.08] bg-[#0a1020]/95 backdrop-blur-xl p-1.5 sm:hidden"
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <button
                onClick={() => { router.push("/math"); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-indigo-400/60 hover:text-indigo-400/90 hover:bg-indigo-500/[0.05] text-sm font-sans transition-colors"
              >
                Math Edition
              </button>
              <button
                onClick={() => { router.push("/code"); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-emerald-400/60 hover:text-emerald-400/90 hover:bg-emerald-500/[0.05] text-sm font-sans transition-colors"
              >
                Code Edition
              </button>
              <button
                onClick={() => { router.push("/paths"); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/[0.05] text-sm font-sans transition-colors"
              >
                Paths
              </button>
              <button
                onClick={() => { router.push("/leaderboard"); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/[0.05] text-sm font-sans transition-colors"
              >
                Leaderboard
              </button>
              <button
                onClick={() => {
                  setShowJoinInput(true);
                  setMobileMenuOpen(false);
                  setTimeout(() => joinInputRef.current?.focus(), 100);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-amber-400/50 hover:text-amber-400/80 hover:bg-amber-500/[0.05] text-sm font-sans transition-colors"
              >
                Join Challenge
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile join input (shown below nav when triggered from mobile menu) */}
      <AnimatePresence>
        {showJoinInput && (
          <motion.div
            className="fixed top-16 left-4 right-4 z-50 sm:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#070b14]/95 backdrop-blur-xl border border-amber-500/15 shadow-lg shadow-black/20">
              <input
                ref={joinInputRef}
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && joinCode.trim()) {
                    router.push(`/challenge/${joinCode.trim()}`);
                  }
                  if (e.key === "Escape") {
                    setShowJoinInput(false);
                    setJoinCode("");
                  }
                }}
                placeholder="Enter challenge code"
                maxLength={6}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm tracking-[0.15em] text-center placeholder:text-white/20 focus:outline-none focus:border-amber-500/30 transition-colors"
              />
              <button
                onClick={() => {
                  if (joinCode.trim()) router.push(`/challenge/${joinCode.trim()}`);
                }}
                disabled={!joinCode.trim()}
                className="px-3 py-2 rounded-lg border border-amber-500/30 text-amber-400/70 font-mono text-xs tracking-wider hover:bg-amber-500/10 disabled:opacity-20 transition-all"
              >
                JOIN
              </button>
              <button
                onClick={() => { setShowJoinInput(false); setJoinCode(""); }}
                className="text-white/20 hover:text-white/50 text-sm transition-colors px-1"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero section */}
      <motion.div
        className="text-center mb-12 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* Level dots decoration */}
        <motion.div
          className="flex items-center justify-center gap-2 mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {["#4ade80", "#fbbf24", "#f97316", "#f43f5e", "#a855f7"].map((color, i) => (
            <motion.div
              key={color}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: color, opacity: 0.6 }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>

        <h1 className="font-display text-5xl sm:text-7xl text-white mb-5 leading-tight">
          Teach Me
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
            Like I&apos;m 10
          </span>
        </h1>
        <p className="text-white/35 text-lg sm:text-xl max-w-lg mx-auto font-serif leading-relaxed">
          Pick any topic. Start simple. Go as deep as you want.
        </p>
      </motion.div>

      <DailyChallenge />

      <TopicInput lang={lang} />

      <motion.div
        className="mt-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <ExampleTopics />
      </motion.div>

      <footer className="hidden sm:block fixed bottom-0 left-0 right-0 py-4 text-center bg-gradient-to-t from-[#070b14] via-[#070b14]/80 to-transparent pointer-events-none">
        <p className="text-white/10 text-xs font-sans pointer-events-auto">
          Teach Me Like I&apos;m 10
          {isGuest && (
            <>
              {" · "}
              <button
                onClick={() => router.push("/auth/login")}
                className="text-white/20 hover:text-white/40 transition-colors underline"
              >
                Sign in to save progress
              </button>
            </>
          )}
        </p>
      </footer>
    </main>
  );
}
