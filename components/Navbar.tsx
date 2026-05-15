"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { slugify } from "@/lib/utils";
import { NewDot } from "@/components/NewBadge";
import LanguagePicker from "@/components/LanguagePicker";
import XPBadge from "@/components/XPBadge";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/components/AuthProvider";
import type { LangCode } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/battle", label: "Battle", color: "#fb7185", icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/>
      <path d="M14.5 6.5L18 3h3v3l-3.5 3.5"/><path d="M5 14l4 4"/><path d="M7 17l-3 3"/>
    </svg>
  )},
  { href: "/speedrun", label: "Speed Run", color: "#fbbf24", icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )},
  { href: "/explore", label: "Explore", color: "#c084fc", icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  )},
  { href: "/dna", label: "My DNA", color: "#34d399", icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="M17 6l-2.5-2.5"/><path d="M14 8l-1-1"/><path d="M7 18l2.5 2.5"/><path d="M3.5 14.5l.5.5"/><path d="M20 9l.5.5"/><path d="M6.5 12.5l1 1"/><path d="M16.5 10.5l1 1"/>
    </svg>
  )},
  { href: "/leaderboard", label: "Ranks", color: "#38bdf8", icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )},
  { href: "/playground", label: "Playground", color: "#06b6d4", icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2v6.292a4 4 0 0 1-1.17 2.829L4 16h16l-4.83-4.879A4 4 0 0 1 14 8.292V2"/><path d="M8.5 2h7"/><path d="M7 16l-1.5 6h13L17 16"/><path d="M9 6.5h6"/>
    </svg>
  )},
];

// Extra items only shown in the mobile hamburger "More" section
const MOBILE_EXTRA_ITEMS = [
  { href: "/debate", label: "Debates", color: "#f43f5e", icon: "🗣️" },
  { href: "/time-machine", label: "Time Machine", color: "#67e8f9", icon: "🕰️" },
  { href: "/wrong-on-purpose", label: "Spot Errors", color: "#f59e0b", icon: "🔍" },
  { href: "/study-room", label: "Study Rooms", color: "#4ade80", icon: "🏠" },
  { href: "/flashcards", label: "Flashcards", color: "#fbbf24", icon: "🃏" },
  { href: "/library", label: "Library", color: "#34d399", icon: "📖" },
  { href: "/notes", label: "Notes", color: "#f0abfc", icon: "📝" },
  { href: "/friends", label: "Friends", color: "#60a5fa", icon: "👋" },
  { href: "/paths", label: "Paths", color: "#a78bfa", icon: "🛤️" },
  { href: "/journal", label: "Journal", color: "#a78bfa", icon: "📓" },
  { href: "/titles", label: "Titles", color: "#ec4899", icon: "🏅" },
  { href: "/study", label: "Study Timer", color: "#fb923c", icon: "⏱️" },
  { href: "/math", label: "Math", color: "#60a5fa", icon: "🔢" },
  { href: "/code", label: "Code", color: "#a78bfa", icon: "💻" },
  { href: "/progress", label: "Progress", color: "#38bdf8", icon: "📊" },
  { href: "/compare", label: "Compare", color: "#fbbf24", icon: "⚖️" },
  { href: "/blackjack", label: "Blackjack", color: "#4ade80", icon: "🃏" },
  { href: "/shop", label: "XP Shop", color: "#facc15", icon: "🛒" },
  { href: "/pro", label: "Pro", color: "#34d399", icon: "✦" },
  { href: "/settings", label: "Settings", color: "#94a3b8", icon: "⚙️" },
];

export default function Navbar() {
  const { data } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const joinInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState<LangCode>("en");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    const saved = data.getLang() as LangCode;
    if (saved) setLang(saved);
  }, [data]);

  useEffect(() => {
    function handleFocusSearch() {
      setShowSearch(true);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    window.addEventListener("focus-search", handleFocusSearch);
    return () => window.removeEventListener("focus-search", handleFocusSearch);
  }, []);

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

  const isActive = (href: string) => pathname === href;

  if (pathname.startsWith("/learn/")) return null;

  return (
    <>
      {/* Spacer so page content starts below the floating pill */}
      <div className="h-[56px] shrink-0" />

      {/* Floating pill nav */}
      <nav
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50
                   flex items-center gap-1.5
                   w-[calc(100%-24px)] max-w-[860px]
                   pl-3 pr-1.5 py-1
                   bg-[#030609]/80 backdrop-blur-2xl
                   border border-white/[0.06]
                   rounded-full
                   shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]
                   transition-all duration-300"
        style={{ WebkitBackdropFilter: "blur(24px) saturate(1.6)", backdropFilter: "blur(24px) saturate(1.6)" }}
      >
        {/* Left: Logo */}
        <button
          onClick={() => router.push("/")}
          className="group flex items-center gap-1 whitespace-nowrap shrink-0"
        >
          <span className="text-emerald-400 text-xs group-hover:rotate-90 transition-transform duration-300">✦</span>
          <span
            className="text-[12px] font-extrabold text-emerald-400 tracking-[-0.02em] group-hover:opacity-70 transition-opacity"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            TM10
          </span>
        </button>

        <XPBadge />

        {/* Divider */}
        <div className="h-4 w-px bg-white/[0.08] mx-0.5 shrink-0 hidden lg:block" />

        {/* Center: Nav items — desktop only, icons only */}
        <div className="hidden lg:flex items-center gap-0.5 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <div key={item.href} className="relative">
                <NewDot path={item.href} size="sm" />
                <motion.button
                  onClick={() => router.push(item.href)}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="relative flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200"
                  style={{
                    color: active ? item.color : "rgba(255,255,255,0.28)",
                    backgroundColor: active ? `${item.color}14` : "transparent",
                  }}
                  whileHover={{ backgroundColor: `${item.color}12`, color: item.color }}
                  whileTap={{ scale: 0.93 }}
                >
                  {active && (
                    <motion.div
                      className="absolute inset-0 rounded-lg"
                      style={{ boxShadow: `0 0 8px ${item.color}25` }}
                      layoutId="nav-glow"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.icon}</span>
                </motion.button>

                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredItem === item.href && (
                    <motion.div
                      className="absolute top-full left-1/2 mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-sans whitespace-nowrap pointer-events-none"
                      style={{
                        backgroundColor: `${item.color}18`,
                        color: item.color,
                        border: `1px solid ${item.color}25`,
                        x: "-50%",
                      }}
                      initial={{ opacity: 0, y: -3, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -3, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                    >
                      {item.label}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Divider */}
          <div className="h-4 w-px bg-white/[0.06] mx-0.5" />

          {/* Join Code */}
          <AnimatePresence mode="wait">
            {!showJoinInput ? (
              <motion.button
                key="join-btn"
                onClick={() => {
                  setShowJoinInput(true);
                  setTimeout(() => joinInputRef.current?.focus(), 100);
                }}
                className="flex items-center justify-center w-7 h-7 rounded-lg text-white/20 hover:text-amber-400/70 hover:bg-amber-500/[0.07] transition-all duration-200"
                title="Join Code"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </motion.button>
            ) : (
              <motion.div
                key="join-input"
                className="flex items-center gap-1"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
              >
                <input
                  ref={joinInputRef}
                  type="text"
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
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
                  className="w-[4rem] px-1.5 py-0.5 rounded-md bg-amber-500/[0.06] border border-amber-500/15 text-amber-300 font-mono text-[10px] tracking-[0.2em] text-center placeholder:text-amber-500/20 focus:outline-none focus:border-amber-500/30 transition-colors"
                />
                <button
                  onClick={() => { if (joinCode.trim()) router.push(`/challenge/${joinCode.trim()}`); }}
                  disabled={!joinCode.trim()}
                  className="px-1 py-0.5 rounded-md bg-amber-500/10 text-amber-400/80 font-mono text-[9px] hover:bg-amber-500/20 disabled:opacity-20 transition-all"
                >
                  GO
                </button>
                <button
                  onClick={() => { setShowJoinInput(false); setJoinCode(""); }}
                  className="text-white/15 hover:text-white/40 text-[9px] transition-colors px-0.5"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Utils */}
        <div className="flex items-center gap-0.5 ml-auto" ref={mobileMenuRef}>
          {/* Search */}
          <AnimatePresence mode="wait">
            {!showSearch ? (
              <motion.button
                key="search-icon"
                onClick={() => {
                  setShowSearch(true);
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                className="flex items-center justify-center w-7 h-7 rounded-lg text-white/25 hover:text-white/55 hover:bg-white/[0.04] transition-all duration-200"
                aria-label="Search topics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="6.5" cy="6.5" r="5" />
                  <path d="M10.5 10.5L15 15" />
                </svg>
              </motion.button>
            ) : (
              <motion.form
                key="search-input"
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = searchQuery.trim();
                  if (q) {
                    router.push(`/learn/${slugify(q)}`);
                    setShowSearch(false);
                    setSearchQuery("");
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07]"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="6.5" cy="6.5" r="5" />
                  <path d="M10.5 10.5L15 15" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { setShowSearch(false); setSearchQuery(""); }
                  }}
                  onBlur={() => {
                    if (!searchQuery.trim()) { setShowSearch(false); setSearchQuery(""); }
                  }}
                  placeholder="Search..."
                  className="w-24 sm:w-32 bg-transparent text-[11px] font-sans text-white placeholder:text-white/20 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                  className="text-white/15 hover:text-white/40 text-[9px] transition-colors"
                >
                  ✕
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="hidden sm:block">
            <LanguagePicker value={lang} onChange={handleLangChange} />
          </div>
          <UserMenu />

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="flex lg:hidden items-center justify-center w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.07] text-white/50 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
            aria-label="Menu"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {mobileMenuOpen ? (
                <><line x1="4" y1="4" x2="12" y2="12" /><line x1="12" y1="4" x2="4" y2="12" /></>
              ) : (
                <><line x1="2" y1="5" x2="14" y2="5" /><line x1="4" y1="9" x2="14" y2="9" /><line x1="6" y1="13" x2="14" y2="13" /></>
              )}
            </svg>
          </button>

          {/* Mobile dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                className="absolute top-full right-3 mt-2 w-56 rounded-2xl border border-white/[0.06] bg-[#0a0f1a]/95 backdrop-blur-2xl p-2 lg:hidden shadow-2xl shadow-black/40"
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                {NAV_ITEMS.map((item, i) => {
                  const active = isActive(item.href);
                  return (
                    <motion.button
                      key={item.href}
                      onClick={() => { router.push(item.href); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-sans transition-all duration-150"
                      style={{
                        color: active ? item.color : "rgba(255,255,255,0.45)",
                        backgroundColor: active ? `${item.color}10` : "transparent",
                      }}
                      whileHover={{ backgroundColor: `${item.color}10`, color: item.color }}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <span style={{ color: active ? item.color : "rgba(255,255,255,0.25)" }}>
                        {item.icon}
                      </span>
                      {item.label}
                      {active && (
                        <div
                          className="ml-auto w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                    </motion.button>
                  );
                })}
                <div className="my-1.5 h-px bg-white/[0.04]" />
                <p className="px-3 py-1 text-[10px] font-sans text-white/15 tracking-widest uppercase">More</p>
                <div className="max-h-48 overflow-y-auto scrollbar-thin">
                  {MOBILE_EXTRA_ITEMS.map((item, i) => {
                    const active = isActive(item.href);
                    return (
                      <motion.button
                        key={item.href}
                        onClick={() => { router.push(item.href); setMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-sans transition-all duration-150"
                        style={{
                          color: active ? item.color : "rgba(255,255,255,0.35)",
                          backgroundColor: active ? `${item.color}10` : "transparent",
                        }}
                        whileHover={{ backgroundColor: `${item.color}10`, color: item.color }}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (NAV_ITEMS.length + i) * 0.02 }}
                      >
                        <span className="text-sm w-5 text-center relative">
                          {item.icon}
                          <NewDot path={item.href} size="sm" />
                        </span>
                        {item.label}
                        {active && (
                          <div
                            className="ml-auto w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="my-1.5 h-px bg-white/[0.04]" />
                <button
                  onClick={() => {
                    setShowJoinInput(true);
                    setMobileMenuOpen(false);
                    setTimeout(() => joinInputRef.current?.focus(), 100);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-sans text-white/25 hover:text-amber-400/70 hover:bg-amber-500/[0.06] transition-all"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Join Code
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Mobile join input overlay */}
      <AnimatePresence>
        {showJoinInput && (
          <motion.div
            className="fixed top-[72px] left-3 right-3 z-50 lg:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#0a0f1a]/95 backdrop-blur-2xl border border-amber-500/10 shadow-2xl shadow-black/30">
              <input
                ref={joinInputRef}
                type="text"
                value={joinCode}
                onChange={(e) =>
                  setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && joinCode.trim()) router.push(`/challenge/${joinCode.trim()}`);
                  if (e.key === "Escape") { setShowJoinInput(false); setJoinCode(""); }
                }}
                placeholder="Enter code"
                maxLength={6}
                className="flex-1 px-3 py-2 rounded-lg bg-amber-500/[0.05] border border-amber-500/10 text-amber-300 font-mono text-sm tracking-[0.15em] text-center placeholder:text-amber-500/15 focus:outline-none focus:border-amber-500/25 transition-colors"
              />
              <button
                onClick={() => { if (joinCode.trim()) router.push(`/challenge/${joinCode.trim()}`); }}
                disabled={!joinCode.trim()}
                className="px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400/80 font-mono text-xs tracking-wider hover:bg-amber-500/20 disabled:opacity-20 transition-all"
              >
                JOIN
              </button>
              <button
                onClick={() => { setShowJoinInput(false); setJoinCode(""); }}
                className="text-white/15 hover:text-white/40 text-sm transition-colors px-1"
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
