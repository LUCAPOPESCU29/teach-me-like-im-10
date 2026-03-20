"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import LanguagePicker from "@/components/LanguagePicker";
import XPBadge from "@/components/XPBadge";
import UserMenu from "@/components/UserMenu";
import MagneticButton from "@/components/MagneticButton";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useAuth } from "@/components/AuthProvider";
import type { LangCode } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/battle", label: "Quiz Battle", color: "rose" },
  { href: "/math", label: "Math", color: "indigo" },
  { href: "/code", label: "Code", color: "emerald" },
  { href: "/paths", label: "Paths", color: "default" },
  { href: "/leaderboard", label: "Leaderboard", color: "default" },
];

function useTheme() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const update = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export default function Navbar() {
  const { data } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isDark = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const joinInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState<LangCode>("en");

  useEffect(() => {
    const saved = data.getLang() as LangCode;
    if (saved) setLang(saved);
  }, [data]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
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

  const colorMap: Record<string, { bg: string; border: string; text: string; hoverBg: string; hoverText: string; hoverBorder: string }> = {
    rose: {
      bg: "bg-rose-500/[0.06]",
      border: "border-rose-500/15",
      text: "text-rose-400/70",
      hoverBg: "hover:bg-rose-500/[0.12]",
      hoverText: "hover:text-rose-400",
      hoverBorder: "hover:border-rose-500/30",
    },
    indigo: {
      bg: "bg-indigo-500/[0.06]",
      border: "border-indigo-500/15",
      text: "text-indigo-400/70",
      hoverBg: "hover:bg-indigo-500/[0.12]",
      hoverText: "hover:text-indigo-400",
      hoverBorder: "hover:border-indigo-500/30",
    },
    emerald: {
      bg: "bg-emerald-500/[0.06]",
      border: "border-emerald-500/15",
      text: "text-emerald-400/70",
      hoverBg: "hover:bg-emerald-500/[0.12]",
      hoverText: "hover:text-emerald-400",
      hoverBorder: "hover:border-emerald-500/30",
    },
    default: {
      bg: "bg-white/[0.03]",
      border: "border-white/[0.06]",
      text: "text-white/50",
      hoverBg: "hover:bg-white/[0.08]",
      hoverText: "hover:text-white/80",
      hoverBorder: "hover:border-white/15",
    },
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <nav
        className={`relative w-full z-50 transition-colors duration-300 ${
          isDark
            ? "bg-[#070b14]/80 border-b border-white/[0.06]"
            : "bg-white/70 border-b border-black/[0.06]"
        } backdrop-blur-xl`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo + XP */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="font-display text-lg sm:text-xl text-white hover:opacity-80 transition-opacity flex items-center gap-2"
              >
                <span className="text-emerald-400">✦</span>
                <span className="hidden sm:inline">Teach Me Like I&apos;m 10</span>
                <span className="sm:hidden">TM10</span>
              </button>
              <div className="hidden sm:flex">
                <XPBadge />
              </div>
            </div>

            {/* Center: Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1.5">
              {NAV_ITEMS.map((item) => {
                const c = colorMap[item.color];
                const active = isActive(item.href);
                return (
                  <MagneticButton
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`px-3 py-1.5 rounded-lg border font-sans text-xs transition-all duration-300 ${
                      active
                        ? `${c.bg} ${c.border} ${c.text.replace("/70", "").replace("/50", "")} font-medium`
                        : `${c.bg} ${c.border} ${c.text} ${c.hoverBg} ${c.hoverText} ${c.hoverBorder}`
                    }`}
                  >
                    {item.label}
                  </MagneticButton>
                );
              })}

              {/* Join Challenge */}
              <AnimatePresence mode="wait">
                {!showJoinInput ? (
                  <motion.button
                    key="join-btn"
                    onClick={() => {
                      setShowJoinInput(true);
                      setTimeout(() => joinInputRef.current?.focus(), 100);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/[0.06] border border-amber-500/15 text-amber-400/50 hover:text-amber-400/80 hover:border-amber-500/25 hover:bg-amber-500/[0.1] font-sans text-xs transition-all duration-300"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    Join Code
                  </motion.button>
                ) : (
                  <motion.div
                    key="join-input"
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
                      isDark
                        ? "bg-[#070b14]/90 border-amber-500/20"
                        : "bg-white border-amber-500/25 shadow-sm"
                    }`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <input
                      ref={joinInputRef}
                      type="text"
                      value={joinCode}
                      onChange={(e) =>
                        setJoinCode(
                          e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "")
                            .slice(0, 6)
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && joinCode.trim())
                          router.push(`/challenge/${joinCode.trim()}`);
                        if (e.key === "Escape") {
                          setShowJoinInput(false);
                          setJoinCode("");
                        }
                      }}
                      placeholder="CODE"
                      maxLength={6}
                      className="w-16 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white font-mono text-xs tracking-[0.15em] text-center placeholder:text-white/20 focus:outline-none focus:border-amber-500/30 transition-colors"
                    />
                    <button
                      onClick={() => {
                        if (joinCode.trim())
                          router.push(`/challenge/${joinCode.trim()}`);
                      }}
                      disabled={!joinCode.trim()}
                      className="px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-400/70 font-mono text-[10px] tracking-wider hover:bg-amber-500/10 disabled:opacity-20 transition-all"
                    >
                      GO
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
            </div>

            {/* Right: Utils */}
            <div className="flex items-center gap-2" ref={mobileMenuRef}>
              <div className="sm:hidden">
                <XPBadge />
              </div>
              <LanguagePicker value={lang} onChange={handleLangChange} />
              <AnimatedThemeToggler
                className={`${
                  isDark
                    ? "bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
                    : "bg-black/[0.03] border border-black/[0.06] text-black/40 hover:text-black/70 hover:bg-black/[0.06]"
                }`}
              />
              <UserMenu />

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen((o) => !o)}
                className={`flex lg:hidden items-center justify-center w-8 h-8 rounded-lg border transition-all duration-300 ${
                  isDark
                    ? "bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
                    : "bg-black/[0.03] border-black/[0.06] text-black/40 hover:text-black/70 hover:bg-black/[0.06]"
                }`}
                aria-label="Menu"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
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

              {/* Mobile dropdown */}
              <AnimatePresence>
                {mobileMenuOpen && (
                  <motion.div
                    className={`absolute top-full right-0 mt-2 w-52 rounded-xl border p-1.5 lg:hidden ${
                      isDark
                        ? "border-white/[0.08] bg-[#0a1020]/95 backdrop-blur-xl"
                        : "border-black/[0.08] bg-white/95 backdrop-blur-xl shadow-lg"
                    }`}
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    {NAV_ITEMS.map((item) => {
                      const active = isActive(item.href);
                      const mobileColors: Record<string, string> = {
                        rose: `text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/[0.06] ${active ? "bg-rose-500/[0.06] text-rose-400" : ""}`,
                        indigo: `text-indigo-400/70 hover:text-indigo-400 hover:bg-indigo-500/[0.06] ${active ? "bg-indigo-500/[0.06] text-indigo-400" : ""}`,
                        emerald: `text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/[0.06] ${active ? "bg-emerald-500/[0.06] text-emerald-400" : ""}`,
                        default: `text-white/50 hover:text-white/80 hover:bg-white/[0.05] ${active ? "bg-white/[0.05] text-white/80" : ""}`,
                      };
                      return (
                        <button
                          key={item.href}
                          onClick={() => {
                            router.push(item.href);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-sans transition-colors ${
                            mobileColors[item.color]
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                    <div
                      className={`my-1 h-px ${isDark ? "bg-white/[0.06]" : "bg-black/[0.06]"}`}
                    />
                    <button
                      onClick={() => {
                        setShowJoinInput(true);
                        setMobileMenuOpen(false);
                        setTimeout(() => joinInputRef.current?.focus(), 100);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-amber-400/60 hover:text-amber-400/90 hover:bg-amber-500/[0.06] text-sm font-sans transition-colors"
                    >
                      Join Challenge
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile join input overlay */}
      <AnimatePresence>
        {showJoinInput && (
          <motion.div
            className="absolute top-16 left-4 right-4 z-50 lg:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border shadow-lg ${
                isDark
                  ? "bg-[#070b14]/95 backdrop-blur-xl border-amber-500/15 shadow-black/20"
                  : "bg-white/95 backdrop-blur-xl border-amber-500/20 shadow-black/5"
              }`}
            >
              <input
                ref={joinInputRef}
                type="text"
                value={joinCode}
                onChange={(e) =>
                  setJoinCode(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                      .slice(0, 6)
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && joinCode.trim())
                    router.push(`/challenge/${joinCode.trim()}`);
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
                  if (joinCode.trim())
                    router.push(`/challenge/${joinCode.trim()}`);
                }}
                disabled={!joinCode.trim()}
                className="px-3 py-2 rounded-lg border border-amber-500/30 text-amber-400/70 font-mono text-xs tracking-wider hover:bg-amber-500/10 disabled:opacity-20 transition-all"
              >
                JOIN
              </button>
              <button
                onClick={() => {
                  setShowJoinInput(false);
                  setJoinCode("");
                }}
                className="text-white/20 hover:text-white/50 text-sm transition-colors px-1"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
