"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import TopicInput from "@/components/TopicInput";
import ExampleTopics from "@/components/ExampleTopics";
import DailyChallenge from "@/components/DailyChallenge";
import { useAuth } from "@/components/AuthProvider";
import type { LangCode } from "@/lib/utils";
import TiltCard from "@/components/TiltCard";
import SplitText from "@/components/SplitText";
import Aurora from "@/components/Aurora";
import StreakBanner from "@/components/StreakBanner";
import StreakRiskWarning from "@/components/StreakRiskWarning";
import RecentTopics from "@/components/RecentTopics";
import OnboardingTour from "@/components/OnboardingTour";
import DailyLoginReward from "@/components/DailyLoginReward";
import DailySpinWheel from "@/components/DailySpinWheel";
import WeeklyGoals from "@/components/WeeklyGoals";
import TimeSpentWidget from "@/components/TimeSpentWidget";
import ShakeDetector, { ShakeHint } from "@/components/ShakeDetector";
import { NewDot } from "@/components/NewBadge";
import PullToRefresh from "@/components/PullToRefresh";
import SessionSummary from "@/components/SessionSummary";
import { hasPerk as checkPerk, PERK as PERK_IDS } from "@/lib/perks";
import { getTopicsRemaining, getMinutesUntilSlotFrees, FREE_LIMITS, isPro } from "@/lib/limits";

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Good morning", emoji: "\u2600\uFE0F" };
  if (hour >= 12 && hour < 17) return { text: "Good afternoon", emoji: "\uD83C\uDF24\uFE0F" };
  if (hour >= 17 && hour < 21) return { text: "Good evening", emoji: "\uD83C\uDF05" };
  if (hour >= 21) return { text: "Late night studying?", emoji: "\uD83C\uDF19" };
  return { text: "Burning the midnight oil?", emoji: "\uD83E\uDD89" };
}

const ALL_FEATURES = [
  { href: "/battle", label: "Battle", desc: "Quiz battles", icon: "⚔️", cat: "play" },
  { href: "/flash", label: "Flash", desc: "Learn in 10 min", icon: "⚡", cat: "play" },
  { href: "/flash/math", label: "Math Flash", desc: "Worked examples", icon: "📐", cat: "play" },
  { href: "/flash/upgrade", label: "Flash Pro", desc: "25/day · $3.50/mo", icon: "✦", cat: "play" },
  { href: "/speedrun", label: "Speed Run", desc: "Race to Level 5", icon: "🏎️", cat: "play" },
  { href: "/wrong-on-purpose", label: "Spot Errors", desc: "Find mistakes", icon: "🔍", cat: "play" },
  { href: "/debate", label: "Debates", desc: "Argue & learn", icon: "🗣️", cat: "play" },
  { href: "/time-machine", label: "Time Machine", desc: "Explain to the past", icon: "🕰️", cat: "play" },
  { href: "/playground", label: "Playground", desc: "Interactive formulas", icon: "🧪", cat: "play" },
  { href: "/blackjack", label: "Blackjack", desc: "Bet your XP", icon: "🃏", cat: "play" },
  { href: "/explore", label: "Explore", desc: "Rabbit hole", icon: "🧭", cat: "learn" },
  { href: "/paths", label: "Paths", desc: "Guided journeys", icon: "🛤️", cat: "learn" },
  { href: "/flashcards", label: "Flashcards", desc: "Quick review", icon: "🃏", cat: "learn" },
  { href: "/math", label: "Math", desc: "Interactive math", icon: "🔢", cat: "learn" },
  { href: "/code", label: "Code", desc: "Learn to program", icon: "💻", cat: "learn" },
  { href: "/library", label: "Library", desc: "Saved topics", icon: "📖", cat: "learn" },
  { href: "/notes", label: "Notes", desc: "Your notes", icon: "📝", cat: "learn" },
  { href: "/dna", label: "My DNA", desc: "Your fingerprint", icon: "🧬", cat: "you" },
  { href: "/progress", label: "Progress", desc: "Stats & streaks", icon: "📊", cat: "you" },
  { href: "/journal", label: "Journal", desc: "Daily diary", icon: "📓", cat: "you" },
  { href: "/titles", label: "Titles", desc: "Earn flair", icon: "🏅", cat: "you" },
  { href: "/study", label: "Study Timer", desc: "Pomodoro focus", icon: "⏱️", cat: "you" },
  { href: "/leaderboard", label: "Leaderboard", desc: "Global ranks", icon: "🏆", cat: "you" },
  { href: "/friends", label: "Friends", desc: "Find & follow", icon: "👋", cat: "social" },
  { href: "/study-room", label: "Study Rooms", desc: "Learn together", icon: "🏠", cat: "social" },
  { href: "/shop", label: "XP Shop", desc: "Spend your XP", icon: "🛒", cat: "you" },
  { href: "/pro", label: "Pro", desc: "Unlock everything", icon: "✦", cat: "you" },
  { href: "/settings", label: "Settings", desc: "Customize", icon: "⚙️", cat: "social" },
  { href: "/compare", label: "Compare", desc: "X vs Y", icon: "⚖️", cat: "learn" },
  { href: "/how-it-works", label: "How It Works", desc: "See the magic", icon: "✨", cat: "learn" },
];

const DISCOVER_TABS = [
  { id: "play", label: "Play", icon: "🎮" },
  { id: "learn", label: "Learn", icon: "📚" },
  { id: "you", label: "You", icon: "🧬" },
  { id: "social", label: "Social", icon: "👥" },
] as const;

// ─── Flash Suite promo card ───────────────────────────────────────────────────
const FLASH_HOOKS = [
  "A single teaspoon of a neutron star weighs about a billion tons.",
  "Your brain uses roughly the same power as a 20-watt light bulb.",
  "Sharks are older than trees — they've been around for 450 million years.",
  "There are more possible chess games than atoms in the observable universe.",
  "The internet weighs about 50 grams — just the electrons in motion.",
];

function FlashPromoCard() {
  const router = useRouter();
  const [hookIdx, setHookIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [hoveredMode, setHoveredMode] = useState<"flash" | "math" | "upgrade" | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setHookIdx((i) => (i + 1) % FLASH_HOOKS.length);
        setVisible(true);
      }, 320);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-xl mt-6"
    >
      {/* Suite header */}
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <span className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-white/25">Flash Suite</span>
        <div className="flex-1 h-px bg-white/[0.05]" />
        <span className="text-[9px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{ backgroundColor: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
          NEW
        </span>
      </div>

      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.02)" }}>

        {/* ── General Flash row ── */}
        <div
          className="relative overflow-hidden p-4 cursor-pointer transition-all duration-200"
          style={{ backgroundColor: hoveredMode === "flash" ? "rgba(245,158,11,0.07)" : "transparent" }}
          onClick={() => router.push("/flash")}
          onMouseEnter={() => setHoveredMode("flash")}
          onMouseLeave={() => setHoveredMode(null)}
        >
          {/* Ambient glow */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)", opacity: hoveredMode === "flash" ? 1 : 0, transition: "opacity 0.3s" }} />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-transform duration-200"
              style={{ backgroundColor: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.22)", transform: hoveredMode === "flash" ? "scale(1.06)" : "scale(1)" }}>
              ⚡
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-sans font-bold" style={{ color: "#f59e0b" }}>Flash</span>
                <span className="text-white/25 text-[11px] font-sans">Any topic · 10 minutes</span>
              </div>
              {/* Rotating hook */}
              <div className="h-5 overflow-hidden">
                <motion.p key={hookIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -6 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="text-[12px] font-sans text-white/40 truncate">
                  {FLASH_HOOKS[hookIdx]}
                </motion.p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {["Black holes", "CRISPR"].map((t) => (
                <span key={t} className="hidden sm:inline text-[10px] font-sans text-white/25 px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {t}
                </span>
              ))}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#f59e0b", opacity: hoveredMode === "flash" ? 1 : 0.4, transition: "opacity 0.2s, transform 0.2s", transform: hoveredMode === "flash" ? "translateX(2px)" : "translateX(0)" }}>
                <path d="M3 7h8M7.5 4L10.5 7l-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mx-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />

        {/* ── Math Flash row ── */}
        <div
          className="relative overflow-hidden p-4 cursor-pointer transition-all duration-200"
          style={{ backgroundColor: hoveredMode === "math" ? "rgba(129,140,248,0.07)" : "transparent" }}
          onClick={() => router.push("/flash/math")}
          onMouseEnter={() => setHoveredMode("math")}
          onMouseLeave={() => setHoveredMode(null)}
        >
          {/* Ambient glow */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)", opacity: hoveredMode === "math" ? 1 : 0, transition: "opacity 0.3s" }} />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-transform duration-200"
              style={{ backgroundColor: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.22)", transform: hoveredMode === "math" ? "scale(1.06)" : "scale(1)" }}>
              📐
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-sans font-bold" style={{ color: "#818cf8" }}>Math Flash</span>
                <span className="text-[9px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(129,140,248,0.12)", color: "#818cf8", border: "1px solid rgba(129,140,248,0.2)" }}>NEW</span>
              </div>
              <p className="text-[12px] font-sans text-white/40 truncate">
                Worked examples · practice notebook · step-by-step
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {["Derivatives", "Logarithms"].map((t) => (
                <span key={t} className="hidden sm:inline text-[10px] font-sans text-white/25 px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {t}
                </span>
              ))}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#818cf8", opacity: hoveredMode === "math" ? 1 : 0.4, transition: "opacity 0.2s, transform 0.2s", transform: hoveredMode === "math" ? "translateX(2px)" : "translateX(0)" }}>
                <path d="M3 7h8M7.5 4L10.5 7l-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mx-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />

        {/* ── Pro upgrade row ── */}
        <div
          className="relative overflow-hidden p-4 cursor-pointer transition-all duration-200 group"
          style={{ backgroundColor: hoveredMode === "upgrade" ? "rgba(245,158,11,0.06)" : "transparent" }}
          onClick={() => router.push("/flash/upgrade")}
          onMouseEnter={() => setHoveredMode("upgrade")}
          onMouseLeave={() => setHoveredMode(null)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0"
              style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.15),rgba(251,146,60,0.1))", border: "1px solid rgba(245,158,11,0.2)" }}>
              ✦
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-sans font-bold" style={{ color: "#f59e0b" }}>Flash Pro</span>
                <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>$3.50/mo</span>
                <span className="text-white/20 text-[9px]">·</span>
                <span className="text-[11px] font-sans font-bold" style={{ color: "#818cf8" }}>Executive</span>
                <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(129,140,248,0.12)", color: "#818cf8", border: "1px solid rgba(129,140,248,0.2)" }}>$12/mo</span>
              </div>
              <p className="text-[11px] font-sans text-white/30">25/day · Science · History · Code · Flash history</p>
            </div>
            <span className="text-[11px] font-sans font-semibold shrink-0 transition-all duration-200 group-hover:translate-x-0.5"
              style={{ color: "rgba(245,158,11,0.6)" }}>
              Upgrade →
            </span>
          </div>
        </div>

        {/* Footer strip */}
        <div className="px-4 py-2 flex items-center justify-between"
          style={{ backgroundColor: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="text-[11px] font-sans text-white/20">7 animated cards · pure signal · no fluff</span>
          <span className="text-[11px] font-sans text-white/25">3 free / hour</span>
        </div>
      </div>
    </motion.div>
  );
}

function hasTimeData(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("tmi10_learning_time");
    if (!raw) return false;
    const data = JSON.parse(raw);
    return (data.sessions || []).length > 0;
  } catch {
    return false;
  }
}

export default function Home() {
  const { data, isGuest, user, isLoading } = useAuth();
  const router = useRouter();
  const [lang, setLang] = useState<LangCode>("en");
  const [greeting, setGreeting] = useState<{ text: string; emoji: string } | null>(null);

  const [discoverTab, setDiscoverTab] = useState<string>("play");
  const [showDiscover, setShowDiscover] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setGreeting(getGreeting());
    // XP Generator perk: +5 XP per hour passively
    try {
      if (checkPerk(PERK_IDS.XP_GENERATOR)) {
        const key = "tmi10_xp_gen_last";
        const now = Date.now();
        const last = parseInt(localStorage.getItem(key) || "0", 10);
        if (last === 0) {
          localStorage.setItem(key, String(now));
        } else {
          const hours = Math.floor((now - last) / (1000 * 60 * 60));
          if (hours > 0) {
            const earned = hours * 5;
            data.addXP(earned, "xp_generator");
            localStorage.setItem(key, String(now));
          }
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const saved = data.getLang() as LangCode;
    if (saved) setLang(saved);
  }, [data]);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 80) setScrolled(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filteredFeatures = ALL_FEATURES.filter((f) => f.cat === discoverTab);

  if (isLoading) return null;

  return (
    <PullToRefresh>
      <main className="min-h-screen flex flex-col items-center px-4 pt-14 sm:pt-20 pb-10 relative overflow-hidden">
      <ShakeDetector />

      {/* Lander-style background: subtle grid + green glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(52,211,153,1) 1px,transparent 1px),linear-gradient(90deg,rgba(52,211,153,1) 1px,transparent 1px)",
          backgroundSize: "72px 72px",
          opacity: 0.018,
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          top: "-10%", left: "-5%",
          width: "700px", height: "700px",
          background: "radial-gradient(ellipse,rgba(52,211,153,0.1) 0%,transparent 65%)",
        }}
      />

      {/* Hero */}
      <motion.div
        className="text-center mb-10 sm:mb-14 relative z-10 w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Greeting */}
        {greeting && (
          <motion.p
            className="text-white/28 text-sm font-sans mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            {greeting.emoji}{" "}{greeting.text}
            {user?.user_metadata?.display_name ? `, ${user.user_metadata.display_name}` : ""}
          </motion.p>
        )}

        {/* Eyebrow badge — matches lander .hero-badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] mb-7"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
            style={{ boxShadow: "0 0 8px rgba(52,211,153,0.9)", animation: "pulse 2s infinite" }}
          />
          <span className="text-emerald-400/80 text-[10px] font-sans font-semibold tracking-[0.16em] uppercase">
            AI-Powered Learning
          </span>
        </motion.div>

        {/* Main heading — Syne, matches lander .hero-h1 */}
        <motion.h1
          className="mb-5 sm:mb-6"
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: "clamp(52px, 7vw, 92px)",
            fontWeight: 800,
            lineHeight: 0.96,
            letterSpacing: "-0.035em",
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.18, ease: [0.23, 1, 0.32, 1] }}
        >
          <span className="block text-white/90">Teach Me</span>
          <span
            className="block"
            style={{
              background: "linear-gradient(135deg,#34d399 0%,#6ee7b7 45%,#a7f3d0 75%,#34d399 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Like I&apos;m 10
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-white/38 text-base sm:text-[1.1rem] max-w-sm mx-auto font-sans leading-[1.72] mb-7"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
        >
          Pick any topic. Start simple. Go as deep as you want.
        </motion.p>

        {/* CTA row — matches lander .hero-actions */}
        <motion.div
          className="flex items-center justify-center gap-3 flex-wrap"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          <button
            onClick={() => router.push("/how-it-works")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.04] text-white/45 hover:text-white/80 hover:bg-white/[0.08] hover:border-white/[0.16] font-sans text-sm"
            style={{ transition: "all 0.35s cubic-bezier(0.23,1,0.32,1)" }}
          >
            ✦ How does it work?
          </button>
          <button
            onClick={() => router.push("/pro")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-400/80 hover:bg-emerald-500/[0.12] hover:border-emerald-500/40 font-sans text-sm"
            style={{ transition: "all 0.35s cubic-bezier(0.23,1,0.32,1)" }}
          >
            Pro plans ✦
          </button>
        </motion.div>
        <ShakeHint />
      </motion.div>

      <StreakBanner />
      <StreakRiskWarning />

      {/* Topic input — FIRST, most important action */}
      <TopicInput lang={lang} />

      {/* Rate-limit pill — shows when at least 1 topic used in current window */}
      {typeof window !== "undefined" && !isPro() && (() => {
        const remaining = getTopicsRemaining();
        if (remaining >= FREE_LIMITS.topicsPerWindow) return null;
        const minsLeft = getMinutesUntilSlotFrees();
        return (
          <motion.div
            className="mt-3 flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-sans"
              style={{
                borderColor: remaining === 0 ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)",
                backgroundColor: remaining === 0 ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)",
                color: remaining === 0 ? "#f87171" : "rgba(255,255,255,0.35)",
              }}
            >
              <span>{remaining === 0 ? "🔒" : "⚡"}</span>
              <span>
                {remaining === 0
                  ? `Limit reached · frees in ${minsLeft}m`
                  : `${remaining} of ${FREE_LIMITS.topicsPerWindow} topics left · resets in ${minsLeft}m`}
              </span>
              <button
                onClick={() => router.push("/pro")}
                className="underline font-medium"
                style={{ color: "#34d399" }}
              >
                Go Pro
              </button>
            </div>
          </motion.div>
        );
      })()}

      <motion.div
        className="mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <ExampleTopics />
      </motion.div>

      {/* Flash promo */}
      <FlashPromoCard />

      {/* Continue learning (only shows if you have history) */}
      <RecentTopics />

      {/* Session summary — shows after 2+ topics and 5+ minutes */}
      <SessionSummary />

      {/* Daily Challenge + Stats row — side by side on desktop, stacked on mobile */}
      <div className="w-full max-w-xl mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TiltCard glareColor="rgba(52, 211, 153, 0.06)">
          <DailyChallenge />
        </TiltCard>
        <div className="space-y-3">
          <WeeklyGoals />
          <TimeSpentWidget />
        </div>
      </div>

      <DailyLoginReward />
      <DailySpinWheel />

      {/* Discover section — tabbed to reduce clutter */}
      <motion.div
        className="w-full max-w-xl mt-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        {/* Section header with expand toggle */}
        <button
          onClick={() => setShowDiscover((p) => !p)}
          className="flex items-center gap-3 mb-4 px-1 group w-full"
        >
          <h2 className="text-white/30 text-[10px] font-sans font-semibold tracking-[0.16em] uppercase shrink-0">
            Discover
          </h2>
          <div className="flex-1 h-px bg-white/[0.05]" />
          <motion.div
            className="w-5 h-5 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center group-hover:bg-white/[0.09] transition-colors duration-300"
            animate={{ rotate: showDiscover ? 180 : 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 3L4 5.5L6.5 3" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </button>

        <AnimatePresence>
          {showDiscover && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {/* Tab bar */}
              <div className="flex gap-1 mb-5 bg-white/[0.04] rounded-full p-1 w-fit border border-white/[0.06]">
                {DISCOVER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDiscoverTab(tab.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans"
                    style={{
                      backgroundColor: discoverTab === tab.id ? "var(--accent)" : "transparent",
                      color: discoverTab === tab.id ? "#000" : "rgba(255,255,255,0.38)",
                      fontWeight: discoverTab === tab.id ? 600 : 400,
                      transition: "all 0.4s cubic-bezier(0.32,0.72,0,1)",
                    }}
                  >
                    <span className="text-sm">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Feature grid */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={discoverTab}
                  className="grid grid-cols-3 gap-2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {filteredFeatures.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className="relative flex flex-col gap-3 p-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.14] text-left group"
                      style={{ transition: "all 0.5s cubic-bezier(0.32,0.72,0,1)" }}
                    >
                      <NewDot path={item.href} />
                      <div
                        className="w-9 h-9 rounded-xl bg-white/[0.06] group-hover:bg-white/[0.11] flex items-center justify-center text-lg"
                        style={{ transition: "all 0.5s cubic-bezier(0.32,0.72,0,1)" }}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <span className="text-white/70 text-sm font-sans font-medium block group-hover:text-white/95 transition-colors duration-300">{item.label}</span>
                        <span className="text-white/20 text-[10px] font-sans block mt-0.5">{item.desc}</span>
                      </div>
                    </button>
                  ))}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick links when collapsed — ALL features visible */}
        {!showDiscover && (
          <div className="flex gap-2 flex-wrap">
            {[
              { href: "/battle", icon: "⚔️", label: "Battle" },
              { href: "/flash", icon: "⚡", label: "Flash" },
              { href: "/flash/math", icon: "📐", label: "Math Flash" },
              { href: "/flash/upgrade", icon: "✦", label: "Flash Pro" },
              { href: "/explore", icon: "🧭", label: "Explore" },
              { href: "/math", icon: "🔢", label: "Math" },
              { href: "/code", icon: "💻", label: "Code" },
              { href: "/playground", icon: "🧪", label: "Playground" },
              { href: "/time-machine", icon: "🕰️", label: "Time Machine" },
              { href: "/debate", icon: "🗣️", label: "Debates" },
              { href: "/speedrun", icon: "⚡", label: "Speed Run" },
              { href: "/wrong-on-purpose", icon: "🔍", label: "Spot Errors" },
              { href: "/paths", icon: "🛤️", label: "Paths" },
              { href: "/flashcards", icon: "🃏", label: "Flashcards" },
              { href: "/journal", icon: "📓", label: "Journal" },
              { href: "/progress", icon: "📊", label: "Progress" },
              { href: "/leaderboard", icon: "🏆", label: "Ranks" },
              { href: "/titles", icon: "🏅", label: "Titles" },
              { href: "/friends", icon: "👋", label: "Friends" },
              { href: "/blackjack", icon: "🃏", label: "Blackjack" },
              { href: "/compare", icon: "⚖️", label: "Compare" },
              { href: "/shop", icon: "🛒", label: "XP Shop" },
              { href: "/pro", icon: "✦", label: "Pro" },
              { href: "/settings", icon: "⚙️", label: "Settings" },
            ].map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.16] text-xs font-sans text-white/45 hover:text-white/80"
                style={{ transition: "all 0.45s cubic-bezier(0.32,0.72,0,1)" }}
              >
                <NewDot path={item.href} />
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      <OnboardingTour />

      {/* Scroll hint — fades out once user scrolls */}
      <AnimatePresence>
        {!scrolled && (
          <motion.div
            className="fixed bottom-[72px] sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1.5 pointer-events-none"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4, transition: { duration: 0.25 } }}
            transition={{ delay: 1.4, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className="text-white/20 text-[10px] font-sans tracking-[0.14em] uppercase">scroll</span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 6L8 11L13 6" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimal footer */}
      <footer className="w-full py-6 sm:py-4 text-center pb-24 sm:pb-8 mt-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="h-px w-12 bg-white/[0.06]" />
          <p className="text-white/[0.12] text-xs font-sans tracking-wide">Teach Me Like I&apos;m 10</p>
          <div className="h-px w-12 bg-white/[0.06]" />
        </div>
        {isGuest && (
          <button
            onClick={() => router.push("/auth/login")}
            className="text-white/[0.18] hover:text-white/40 transition-colors text-xs font-sans underline"
            style={{ transition: "color 0.4s cubic-bezier(0.32,0.72,0,1)" }}
          >
            Sign in to save progress
          </button>
        )}
      </footer>
      </main>
    </PullToRefresh>
  );
}
