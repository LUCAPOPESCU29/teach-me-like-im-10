"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
import { useRouter } from "next/navigation";
import { isPro, getProDaysRemaining } from "@/lib/limits";

// ── Floating orb background ──────────────────────────────────────────────────
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Deep base */}
      <div className="absolute inset-0 bg-[#030609]" />

      {/* Orbs */}
      <motion.div
        className="absolute rounded-full blur-[120px]"
        style={{ width: 600, height: 600, top: "-10%", left: "-10%", background: "radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)" }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full blur-[150px]"
        style={{ width: 700, height: 700, top: "30%", right: "-15%", background: "radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)" }}
        animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
      <motion.div
        className="absolute rounded-full blur-[100px]"
        style={{ width: 400, height: 400, bottom: "10%", left: "30%", background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)" }}
        animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 8 }}
      />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(52,211,153,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.8) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Noise grain */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />
    </div>
  );
}

// ── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * to));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, to]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ── Marquee strip ────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  "Unlimited Topics", "Audio Explanations", "PDF Export", "AI Follow-ups",
  "Custom Paths", "Private Study Rooms", "Full XP Shop", "Teach-Back AI Grading",
  "Analytics Dashboard", "Priority Support", "Exclusive Perks", "Early Access",
];

function Marquee() {
  return (
    <div className="relative overflow-hidden py-4 border-y border-emerald-500/10">
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-[#030609] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-[#030609] to-transparent pointer-events-none" />
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <span key={i} className="flex items-center gap-3 text-sm font-sans text-white/30">
            <span className="text-emerald-400">✦</span>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Feature check row ────────────────────────────────────────────────────────
function Feat({ label, free, pro }: { label: string; free: boolean | string; pro: boolean | string }) {
  return (
    <div className="grid grid-cols-[1fr_100px_100px] items-center py-3.5 border-b border-white/[0.04] group hover:bg-white/[0.02] transition-colors rounded-lg px-3">
      <span className="text-sm font-sans text-white/60 group-hover:text-white/80 transition-colors">{label}</span>
      <div className="flex justify-center">
        {free === true ? (
          <span className="text-emerald-400 text-base">✓</span>
        ) : free === false ? (
          <span className="text-white/15 text-base">—</span>
        ) : (
          <span className="text-white/40 text-xs font-sans">{free}</span>
        )}
      </div>
      <div className="flex justify-center">
        {pro === true ? (
          <motion.span
            className="text-emerald-400 text-base"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 300 }}
          >✓</motion.span>
        ) : pro === false ? (
          <span className="text-white/15 text-base">—</span>
        ) : (
          <span className="text-emerald-400 text-xs font-sans font-medium">{pro}</span>
        )}
      </div>
    </div>
  );
}

// ── Toggle pill ──────────────────────────────────────────────────────────────
function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative flex-shrink-0"
      style={{
        width: 36, height: 20,
        borderRadius: 10,
        background: enabled
          ? "linear-gradient(135deg, #34d399, #10b981)"
          : "rgba(255,255,255,0.07)",
        border: enabled ? "none" : "1px solid rgba(255,255,255,0.11)",
        boxShadow: enabled ? "0 0 10px rgba(52,211,153,0.3)" : "none",
        transition: "all 0.3s cubic-bezier(0.32,0.72,0,1)",
      }}
    >
      <motion.div
        className="absolute top-0.5 rounded-full"
        style={{ width: 16, height: 16, background: enabled ? "#000" : "rgba(255,255,255,0.3)" }}
        animate={{ x: enabled ? 18 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ProPage() {
  const router = useRouter();
  const [annual, setAnnual] = useState(true);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const proPrice = annual ? 40 : 60;
  const proMonthly = annual ? "3.33" : "5";

  // ── Pro subscription state ─────────────────────────────────────────────────
  const [isProUser, setIsProUser] = useState(false);
  const [proExpiry, setProExpiry] = useState<number | null>(null);
  const [proLegacy, setProLegacy] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);
  const [prefs, setPrefs] = useState({
    emailDigest: true,
    autoAudio: false,
    streakReminder: true,
    newFeatures: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsProUser(isPro());
    const expiry = localStorage.getItem("tmi10_pro_expiry");
    if (expiry) setProExpiry(parseInt(expiry, 10));
    if (localStorage.getItem("tmi10_is_pro") === "1") setProLegacy(true);
    try {
      const saved = localStorage.getItem("tmi10_sub_prefs");
      if (saved) setPrefs(p => ({ ...p, ...JSON.parse(saved) }));
    } catch {}
  }, []);

  function togglePref(key: keyof typeof prefs) {
    setPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (typeof window !== "undefined")
        localStorage.setItem("tmi10_sub_prefs", JSON.stringify(next));
      return next;
    });
  }

  function handleCancelSubscription() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("tmi10_pro_expiry");
    localStorage.removeItem("tmi10_is_pro");
    setIsProUser(false);
    setShowCancelConfirm(false);
    setCancelDone(true);
    setTimeout(() => router.push("/"), 4000);
  }

  // ── helpers ─────────────────────────────────────────────────────────────────
  const daysLeft = proExpiry ? Math.max(0, Math.ceil((proExpiry - Date.now()) / 86400000)) : (proLegacy ? Infinity : 0);
  const expiryDate = proExpiry ? new Date(proExpiry).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      <FloatingOrbs />

      {/* ── PRO SUBSCRIPTION PANEL ── */}
      <AnimatePresence>
        {cancelDone ? (
          // ── Cancelled confirmation ────────────────────────────────────────
          <motion.section
            key="cancelled"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative min-h-screen flex items-center justify-center px-4"
          >
            <motion.div
              className="text-center max-w-md"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 24 }}
            >
              <motion.div
                className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 300 }}
              >
                ✓
              </motion.div>
              <h1 className="font-display text-3xl text-white mb-3">Subscription cancelled</h1>
              <p className="text-white/40 font-sans text-sm leading-relaxed mb-2">
                {expiryDate
                  ? `You keep Pro access until ${expiryDate}. After that, your account stays free with all your data intact.`
                  : "Your Pro access has been removed. Your XP, streak, and history are all still safe."}
              </p>
              <p className="text-white/20 text-xs font-sans mt-6">Redirecting home in a moment…</p>
            </motion.div>
          </motion.section>
        ) : isProUser ? (
          // ── Active subscription dashboard ────────────────────────────────
          <motion.section
            key="sub-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative px-4 pt-28 pb-20 max-w-5xl mx-auto"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-10"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-sans font-semibold tracking-[0.14em] uppercase"
                  style={{
                    background: "rgba(52,211,153,0.08)",
                    border: "1px solid rgba(52,211,153,0.2)",
                    color: "rgba(52,211,153,0.8)",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    style={{ boxShadow: "0 0 6px rgba(52,211,153,0.9)" }}
                  />
                  Active subscription
                </div>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">
                Your Pro <span style={{
                  background: "linear-gradient(135deg, #34d399, #6ee7b7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>subscription</span>
              </h1>
              {proLegacy ? (
                <p className="text-white/35 font-sans text-sm mt-2">Lifetime Pro access · Never expires</p>
              ) : expiryDate ? (
                <p className="text-white/35 font-sans text-sm mt-2">
                  Expires {expiryDate}
                  {daysLeft <= 14 && daysLeft > 0 && (
                    <span className="ml-2 text-amber-400/70">· {daysLeft} days left</span>
                  )}
                  {daysLeft > 14 && (
                    <span className="ml-2 text-white/20">· {daysLeft} days remaining</span>
                  )}
                </p>
              ) : null}
            </motion.div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">

              {/* ── Plan card ── */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  padding: "1.5px",
                  background: "linear-gradient(140deg, rgba(52,211,153,0.5) 0%, rgba(52,211,153,0.08) 50%, rgba(52,211,153,0.35) 100%)",
                }}
              >
                <div
                  className="rounded-[15px] h-full p-6 relative overflow-hidden"
                  style={{ background: "#040d09" }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "radial-gradient(ellipse at 60% 0%, rgba(52,211,153,0.1) 0%, transparent 60%)" }}
                  />
                  <div
                    className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-30"
                    style={{
                      backgroundImage: "radial-gradient(rgba(52,211,153,0.4) 1px, transparent 1px)",
                      backgroundSize: "16px 16px",
                      maskImage: "radial-gradient(ellipse at 100% 0%, black 0%, transparent 65%)",
                    }}
                  />
                  <div className="relative">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base mb-4"
                      style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)" }}
                    >
                      ✦
                    </div>
                    <p className="text-[10px] font-sans font-semibold tracking-[0.16em] uppercase mb-1" style={{ color: "rgba(52,211,153,0.6)" }}>
                      Plan
                    </p>
                    <p className="font-display text-2xl text-white mb-1">Pro</p>
                    <p className="text-white/35 text-xs font-sans mb-5">
                      {proLegacy ? "Lifetime access" : "Donation-based · Ko-fi"}
                    </p>
                    <div className="space-y-2">
                      {[
                        { label: "Status", value: "Active", green: true },
                        { label: "Expires", value: proLegacy ? "Never" : (expiryDate ?? "—") },
                        { label: "Features", value: "12 unlocked" },
                      ].map(({ label, value, green }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-[11px] font-sans text-white/25">{label}</span>
                          <span
                            className="text-[11px] font-sans font-medium"
                            style={{ color: green ? "#34d399" : "rgba(255,255,255,0.55)" }}
                          >
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => router.push("/checkout?plan=annual")}
                      className="mt-5 w-full py-2 rounded-xl text-[11px] font-sans font-medium text-center"
                      style={{
                        background: "rgba(52,211,153,0.07)",
                        border: "1px solid rgba(52,211,153,0.18)",
                        color: "rgba(52,211,153,0.7)",
                        transition: "all 0.3s cubic-bezier(0.32,0.72,0,1)",
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Extend Pro →
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* ── Preferences card ── */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, ease: [0.32, 0.72, 0, 1] }}
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-20"
                  style={{
                    backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                    maskImage: "radial-gradient(ellipse at 100% 0%, black 0%, transparent 65%)",
                  }}
                />
                <div className="relative">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base mb-4"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    🔔
                  </div>
                  <p className="text-[10px] font-sans font-semibold tracking-[0.16em] uppercase mb-1 text-white/30">
                    Preferences
                  </p>
                  <p className="font-display text-lg text-white mb-5">Notifications</p>
                  <div className="space-y-4">
                    {([
                      { key: "emailDigest" as const, label: "Weekly digest", desc: "Summary of what you've learned" },
                      { key: "streakReminder" as const, label: "Streak reminders", desc: "Don't lose your streak" },
                      { key: "autoAudio" as const, label: "Auto-play audio", desc: "Play narration on topic load" },
                      { key: "newFeatures" as const, label: "New features", desc: "Be first to know what's new" },
                    ] as const).map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[12px] font-sans font-medium text-white/65 leading-none mb-0.5">{label}</p>
                          <p className="text-[10px] font-sans text-white/22 truncate">{desc}</p>
                        </div>
                        <Toggle enabled={prefs[key]} onToggle={() => togglePref(key)} />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* ── Features card ── */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, ease: [0.32, 0.72, 0, 1] }}
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="relative">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base mb-4"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    ⚡
                  </div>
                  <p className="text-[10px] font-sans font-semibold tracking-[0.16em] uppercase mb-1 text-white/30">
                    Included
                  </p>
                  <p className="font-display text-lg text-white mb-5">Pro features</p>
                  <div className="space-y-2.5">
                    {[
                      { emoji: "♾️", label: "Unlimited topics" },
                      { emoji: "🔊", label: "Audio narration" },
                      { emoji: "📄", label: "PDF export" },
                      { emoji: "💬", label: "AI follow-ups" },
                      { emoji: "📝", label: "Teach-back AI grading" },
                      { emoji: "🏠", label: "Private study rooms" },
                      { emoji: "🛤️", label: "Custom learning paths" },
                      { emoji: "🎁", label: "Full XP shop" },
                    ].map(({ emoji, label }, i) => (
                      <motion.div
                        key={label}
                        className="flex items-center gap-2.5"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.04 }}
                      >
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)" }}
                        >
                          <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                            <path d="M1 3.5l1.8 1.8L6 1.5" stroke="#34d399" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="text-[11px] font-sans text-white/50">{emoji} {label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── Danger zone ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="rounded-2xl p-6 relative"
              style={{
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <AnimatePresence mode="wait">
                {!showCancelConfirm ? (
                  <motion.div
                    key="cancel-idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-sans font-medium text-white/50 mb-0.5">Cancel subscription</p>
                      <p className="text-[11px] font-sans text-white/22">
                        {expiryDate
                          ? `You'll keep Pro access until ${expiryDate}.`
                          : "You'll keep Pro access for the rest of your billing period."}{" "}
                        No data is ever deleted.
                      </p>
                    </div>
                    <motion.button
                      onClick={() => setShowCancelConfirm(true)}
                      className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-sans font-medium"
                      style={{
                        background: "rgba(239,68,68,0.07)",
                        border: "1px solid rgba(239,68,68,0.18)",
                        color: "rgba(239,68,68,0.65)",
                        transition: "all 0.25s cubic-bezier(0.32,0.72,0,1)",
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)";
                        (e.currentTarget as HTMLButtonElement).style.color = "rgba(239,68,68,0.85)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.07)";
                        (e.currentTarget as HTMLButtonElement).style.color = "rgba(239,68,68,0.65)";
                      }}
                    >
                      Cancel subscription
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="cancel-confirm"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ ease: [0.32, 0.72, 0, 1] }}
                  >
                    <div
                      className="flex items-start gap-3 p-4 rounded-xl mb-4"
                      style={{
                        background: "rgba(239,68,68,0.06)",
                        border: "1px solid rgba(239,68,68,0.16)",
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
                      >
                        ⚠️
                      </div>
                      <div>
                        <p className="text-sm font-sans font-semibold text-white/70 mb-1">Are you sure?</p>
                        <p className="text-[11px] font-sans leading-relaxed" style={{ color: "rgba(255,255,255,0.32)" }}>
                          You&apos;ll lose access to all Pro features — audio narration, Teach It Back, study rooms,
                          unlimited topics, and the full XP shop.{" "}
                          {expiryDate
                            ? `Your Pro access will continue until ${expiryDate}.`
                            : ""}
                          {" "}Your XP, streak, and learning history are never deleted.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.button
                        onClick={handleCancelSubscription}
                        className="px-4 py-2 rounded-xl text-xs font-sans font-semibold"
                        style={{
                          background: "rgba(239,68,68,0.12)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          color: "rgba(239,68,68,0.9)",
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                      >
                        Yes, cancel my subscription
                      </motion.button>
                      <motion.button
                        onClick={() => setShowCancelConfirm(false)}
                        className="px-4 py-2 rounded-xl text-xs font-sans font-medium"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.45)",
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                      >
                        Keep my Pro
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* divider into the marketing page below */}
            <div className="mt-16 mb-0 flex items-center gap-4">
              <div className="flex-1 h-px bg-white/[0.05]" />
              <span className="text-[10px] font-sans text-white/20 uppercase tracking-widest">Plan details & compare</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {/* ── MARKETING CONTENT (hidden after cancel) ── */}
      {!cancelDone && <>
      {/* ── HERO ── */}
      <motion.section
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 pt-24 pb-16"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/5 backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-emerald-400 text-xs font-sans font-medium tracking-wide uppercase">Now available — Pro Plan</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-5xl sm:text-7xl lg:text-8xl mb-6 leading-[0.95] tracking-tight"
        >
          <span className="text-white">Learn without</span>
          <br />
          <span
            className="relative"
            style={{
              background: "linear-gradient(135deg, #34d399 0%, #6ee7b7 40%, #a7f3d0 70%, #34d399 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            limits.
          </span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="max-w-xl text-lg sm:text-xl text-white/45 font-sans leading-relaxed mb-12"
        >
          Everything you love about Teach Me Like I'm 10 — unlocked.
          Unlimited depth, audio, exports, and tools that turn curiosity into mastery.
        </motion.p>

        {/* CTA group */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 items-center"
        >
          <button
            onClick={() => router.push("/checkout?plan=annual")}
            className="group relative px-8 py-3.5 rounded-xl font-sans font-medium text-sm overflow-hidden"
            style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }}
          >
            <span className="relative z-10 text-black">Get Pro — from $3.33/mo</span>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3.5 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 font-sans text-sm transition-all"
          >
            Keep Free Plan
          </button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-5 h-8 rounded-full border border-white/15 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-white/30" />
          </div>
        </motion.div>
      </motion.section>

      {/* ── MARQUEE ── */}
      <Marquee />

      {/* ── STATS ── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.06]">
          {[
            { val: 40, suffix: "+", label: "Languages" },
            { val: 5, suffix: " levels", label: "Per topic" },
            { val: 10, suffix: "+", label: "Learning modes" },
            { val: 100, suffix: "%", label: "Free forever" },
          ].map(({ val, suffix, label }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#030609] p-8 text-center group hover:bg-emerald-500/[0.04] transition-colors"
            >
              <p className="font-display text-4xl sm:text-5xl text-white mb-2">
                <Counter to={val} suffix={suffix} />
              </p>
              <p className="text-white/30 text-sm font-sans">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-4xl sm:text-5xl text-white mb-4">Simple, honest pricing</h2>
            <p className="text-white/40 font-sans text-lg mb-8">No dark patterns. No hidden fees. Cancel anytime.</p>

            {/* Toggle — rounded-full pill */}
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.07]">
              <button
                onClick={() => setAnnual(false)}
                className="relative px-5 py-2 rounded-full text-sm font-sans transition-all duration-400 font-medium"
                style={{
                  background: !annual ? "rgba(255,255,255,0.1)" : "transparent",
                  color: !annual ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.38)",
                  transition: "all 0.35s cubic-bezier(0.23,1,0.32,1)",
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-sans font-medium"
                style={{
                  background: annual ? "rgba(255,255,255,0.1)" : "transparent",
                  color: annual ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.38)",
                  transition: "all 0.35s cubic-bezier(0.23,1,0.32,1)",
                }}
              >
                Annual
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "rgba(52,211,153,0.15)",
                    color: "#34d399",
                    border: "1px solid rgba(52,211,153,0.25)",
                  }}
                >
                  −33%
                </span>
              </button>
            </div>
          </motion.div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">

            {/* ── Free ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0, ease: [0.23, 1, 0.32, 1] }}
              whileHover={{ y: -4 }}
              className="relative rounded-2xl border border-white/[0.08] flex flex-col overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.02)",
                transition: "box-shadow 0.4s cubic-bezier(0.23,1,0.32,1)",
              }}
            >
              {/* Subtle corner dot grid */}
              <div
                className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                  maskImage: "radial-gradient(ellipse at 100% 0%, black 0%, transparent 65%)",
                  WebkitMaskImage: "radial-gradient(ellipse at 100% 0%, black 0%, transparent 65%)",
                }}
              />

              <div className="p-8 flex flex-col h-full relative">
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.09] flex items-center justify-center text-sm">🆓</div>
                    <p className="text-white/35 text-xs font-sans uppercase tracking-[0.16em]">Free</p>
                  </div>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="font-display text-5xl text-white">$0</span>
                  </div>
                  <p className="text-white/25 text-sm font-sans">Forever. No card required.</p>
                </div>

                <ul className="space-y-2.5 mb-10 flex-1">
                  {[
                    { text: "2 topics per 45 min", limited: true },
                    { text: "All 5 explanation levels", limited: false },
                    { text: "Quiz battles & games", limited: false },
                    { text: "Streak & XP system", limited: false },
                    { text: "Basic XP shop only", limited: true },
                    { text: "Progress solar system", limited: false },
                    { text: "40+ languages", limited: false },
                    { text: "No audio explanations", locked: true },
                    { text: "No PDF export", locked: true },
                    { text: "No AI follow-ups", locked: true },
                    { text: "No custom paths", locked: true },
                    { text: "No private study rooms", locked: true },
                  ].map((f, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.038, ease: [0.23, 1, 0.32, 1] }}
                      className="flex items-center gap-3 text-sm font-sans"
                      style={{
                        color: f.locked
                          ? "rgba(255,255,255,0.2)"
                          : f.limited
                          ? "rgba(251,191,36,0.65)"
                          : "rgba(255,255,255,0.48)",
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: f.locked
                            ? "rgba(239,68,68,0.08)"
                            : f.limited
                            ? "rgba(251,191,36,0.1)"
                            : "rgba(255,255,255,0.06)",
                          border: f.locked
                            ? "1px solid rgba(239,68,68,0.18)"
                            : f.limited
                            ? "1px solid rgba(251,191,36,0.22)"
                            : "1px solid rgba(255,255,255,0.09)",
                        }}
                      >
                        {f.locked ? (
                          <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                            <path d="M1.5 1.5l3 3M4.5 1.5l-3 3" stroke="rgba(239,68,68,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                        ) : f.limited ? (
                          <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                            <path d="M3.5 1v2.5M3.5 5v.5" stroke="rgba(251,191,36,0.7)" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                        ) : (
                          <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                            <path d="M1 3.5l1.8 1.8L6 1.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      {f.text}
                    </motion.li>
                  ))}
                </ul>

                <motion.button
                  onClick={() => router.push("/")}
                  className="w-full py-3 rounded-xl border border-white/[0.09] text-white/45 hover:text-white/75 hover:border-white/[0.18] font-sans text-sm"
                  style={{ transition: "all 0.35s cubic-bezier(0.23,1,0.32,1)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                >
                  Stay Free
                </motion.button>
              </div>
            </motion.div>

            {/* ── Pro — featured ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              whileHover={{ y: -6 }}
              className="relative rounded-2xl flex flex-col"
              style={{
                padding: "1.5px",
                background: "linear-gradient(140deg, rgba(52,211,153,0.65) 0%, rgba(52,211,153,0.12) 45%, rgba(52,211,153,0.5) 100%)",
                boxShadow: "0 0 50px rgba(52,211,153,0.12), 0 24px 60px rgba(0,0,0,0.5)",
                transition: "box-shadow 0.5s cubic-bezier(0.23,1,0.32,1)",
              }}
            >
              {/* Outer ambient glow — pulses */}
              <motion.div
                className="absolute -inset-3 rounded-3xl pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.1) 0%, transparent 70%)" }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Inner card */}
              <div className="rounded-[15px] bg-[#040d09] flex flex-col h-full relative overflow-hidden">
                {/* Mesh gradient top */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at 70% 0%, rgba(52,211,153,0.1) 0%, transparent 55%)" }}
                />
                {/* Dot pattern top-right */}
                <div
                  className="absolute top-0 right-0 w-44 h-44 pointer-events-none"
                  style={{
                    backgroundImage: "radial-gradient(rgba(52,211,153,0.25) 1px, transparent 1px)",
                    backgroundSize: "18px 18px",
                    maskImage: "radial-gradient(ellipse at 100% 0%, black 0%, transparent 65%)",
                    WebkitMaskImage: "radial-gradient(ellipse at 100% 0%, black 0%, transparent 65%)",
                  }}
                />

                <div className="p-8 flex flex-col h-full relative">
                  {/* Popular badge */}
                  <div className="absolute top-6 right-6">
                    <div
                      className="flex items-center gap-1.5 text-[10px] font-sans font-semibold tracking-[0.12em] uppercase px-2.5 py-1 rounded-full"
                      style={{
                        background: "rgba(52,211,153,0.12)",
                        color: "#34d399",
                        border: "1px solid rgba(52,211,153,0.28)",
                      }}
                    >
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      Most Popular
                    </div>
                  </div>

                  <div className="mb-8 relative">
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)" }}
                      >
                        ✦
                      </div>
                      <p className="text-emerald-400 text-xs font-sans uppercase tracking-[0.16em]">Pro</p>
                    </div>
                    <div className="flex items-end gap-1.5 mb-1">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={proMonthly}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                          className="font-display text-5xl text-white"
                        >
                          ${proMonthly}
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-white/35 text-sm font-sans mb-1.5">/mo</span>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={annual ? "annual" : "monthly"}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="text-white/35 text-sm font-sans"
                      >
                        {annual ? `Billed $${proPrice}/year` : "Billed monthly"}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  <ul className="space-y-2.5 mb-8 flex-1 relative">
                    {[
                      "Everything in Free",
                      "Unlimited topics daily",
                      "🎧 Audio explanations",
                      "📄 PDF export any topic",
                      "💬 AI follow-up questions",
                      "🛤️ Custom learning paths",
                      "🎤 Teach-back AI grading",
                      "🔒 Private study rooms",
                      "Full XP shop — all perks",
                      "Analytics dashboard",
                      "Custom profile URL",
                      "Priority support",
                    ].map((f, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.25 + i * 0.038, ease: [0.23, 1, 0.32, 1] }}
                        className="flex items-center gap-3 text-sm font-sans text-white/72"
                      >
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.28)" }}
                        >
                          <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                            <path d="M1 3.5l1.8 1.8L6 1.5" stroke="#34d399" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        {f}
                      </motion.li>
                    ))}
                  </ul>

                  <motion.button
                    onClick={() => router.push(`/checkout?plan=${annual ? "annual" : "monthly"}`)}
                    className="relative w-full py-3.5 rounded-xl font-sans font-semibold text-sm overflow-hidden text-black"
                    style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    {/* Shimmer */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)" }}
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
                    />
                    <span className="relative z-10">Get Pro</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* ── Teams ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
              whileHover={{ y: -4 }}
              className="relative rounded-2xl border flex flex-col overflow-hidden"
              style={{
                background: "rgba(167,139,250,0.025)",
                borderColor: "rgba(167,139,250,0.12)",
                transition: "box-shadow 0.4s cubic-bezier(0.23,1,0.32,1)",
              }}
            >
              {/* Corner dot grid — indigo tinted */}
              <div
                className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(rgba(167,139,250,0.12) 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                  maskImage: "radial-gradient(ellipse at 100% 0%, black 0%, transparent 65%)",
                  WebkitMaskImage: "radial-gradient(ellipse at 100% 0%, black 0%, transparent 65%)",
                }}
              />
              {/* Top mesh */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 80% 0%, rgba(167,139,250,0.06) 0%, transparent 55%)" }}
              />

              <div className="p-8 flex flex-col h-full relative">
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)" }}
                    >
                      🏫
                    </div>
                    <p className="text-xs font-sans uppercase tracking-[0.16em]" style={{ color: "rgba(167,139,250,0.7)" }}>Teams</p>
                  </div>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="font-display text-5xl text-white">$3</span>
                    <span className="text-white/35 text-sm font-sans mb-1.5">/seat/mo</span>
                  </div>
                  <p className="text-white/25 text-sm font-sans">Min 5 seats · Perfect for classrooms</p>
                </div>

                <ul className="space-y-3 mb-10 flex-1">
                  {[
                    "Everything in Pro",
                    "Team progress dashboard",
                    "Shared learning paths",
                    "Admin controls",
                    "Bulk seat management",
                    "Group leaderboards",
                    "Classroom study rooms",
                    "Invoice billing",
                  ].map((f, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.045, ease: [0.23, 1, 0.32, 1] }}
                      className="flex items-center gap-3 text-sm font-sans"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.22)" }}
                      >
                        <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                          <path d="M1 3.5l1.8 1.8L6 1.5" stroke="rgba(167,139,250,0.7)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      {f}
                    </motion.li>
                  ))}
                </ul>

                <motion.button
                  className="w-full py-3 rounded-xl font-sans text-sm font-medium"
                  style={{
                    background: "rgba(167,139,250,0.07)",
                    border: "1px solid rgba(167,139,250,0.2)",
                    color: "rgba(167,139,250,0.8)",
                    transition: "all 0.35s cubic-bezier(0.23,1,0.32,1)",
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                >
                  Contact Us
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURE COMPARE ── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-3">Compare plans</h2>
            <p className="text-white/35 font-sans">Every detail, side by side.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden"
          >
            {/* Table header */}
            <div className="grid grid-cols-[1fr_100px_100px] px-3 py-4 border-b border-white/[0.06] bg-white/[0.02]">
              <span className="text-xs font-sans text-white/30 uppercase tracking-widest">Feature</span>
              <span className="text-xs font-sans text-white/30 uppercase tracking-widest text-center">Free</span>
              <span className="text-xs font-sans text-emerald-400 uppercase tracking-widest text-center">Pro</span>
            </div>

            <div className="px-2 py-2 space-y-0.5">
              {/* Core learning */}
              <p className="text-[10px] font-sans text-white/20 uppercase tracking-widest px-3 pt-4 pb-2">Core Learning</p>
              <Feat label="Topics per 45 min" free="2 topics" pro="Unlimited" />
              <Feat label="All 5 explanation levels" free pro />
              <Feat label="40+ language support" free pro />
              <Feat label="Audio explanations" free={false} pro />
              <Feat label="PDF export" free={false} pro />
              <Feat label="AI follow-up questions" free={false} pro />
              <Feat label="Teach-back AI grading" free={false} pro />

              {/* Modes */}
              <p className="text-[10px] font-sans text-white/20 uppercase tracking-widest px-3 pt-6 pb-2">Modes & Games</p>
              <Feat label="Quiz Battle, Speed Run, Spot Errors" free pro />
              <Feat label="Debate & Time Machine" free pro />
              <Feat label="Blackjack (XP betting)" free pro />
              <Feat label="Custom Learning Paths" free={false} pro />
              <Feat label="Private Study Rooms" free={false} pro />

              {/* Gamification */}
              <p className="text-[10px] font-sans text-white/20 uppercase tracking-widest px-3 pt-6 pb-2">XP & Gamification</p>
              <Feat label="XP & streak system" free pro />
              <Feat label="Basic XP shop" free pro />
              <Feat label="Full shop — all perks unlocked" free={false} pro />
              <Feat label="Exclusive Pro perks" free={false} pro />
              <Feat label="Global leaderboard" free pro />

              {/* Profile */}
              <p className="text-[10px] font-sans text-white/20 uppercase tracking-widest px-3 pt-6 pb-2">Profile & Analytics</p>
              <Feat label="Progress solar system" free pro />
              <Feat label="Learning DNA fingerprint" free pro />
              <Feat label="Full analytics dashboard" free={false} pro />
              <Feat label="Custom profile URL" free={false} pro />
              <Feat label="Priority support" free={false} pro />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS / SOCIAL PROOF ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-3xl sm:text-4xl text-white text-center mb-14"
          >
            Built for the relentlessly curious
          </motion.h2>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                quote: "I learned more about quantum physics in one evening than I did in a semester. The 5-level system is genius.",
                name: "Alex M.",
                role: "Software engineer",
              },
              {
                quote: "My students actually want to use it. The streak system keeps them coming back without me having to chase them.",
                name: "Sarah K.",
                role: "High school teacher",
              },
              {
                quote: "I use it to prep for meetings on topics I know nothing about. Level 3 is my sweet spot — fast and actually useful.",
                name: "James L.",
                role: "Product manager",
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-emerald-500/20 hover:bg-emerald-500/[0.03] transition-all duration-300"
              >
                <p className="text-emerald-400 text-xl mb-4 leading-none">"</p>
                <p className="text-white/60 text-sm font-sans leading-relaxed mb-6">{t.quote}</p>
                <div>
                  <p className="text-white/80 text-sm font-sans font-medium">{t.name}</p>
                  <p className="text-white/30 text-xs font-sans">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-3xl sm:text-4xl text-white text-center mb-12"
          >
            Questions
          </motion.h2>
          <FAQList />
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-28 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center relative"
        >
          {/* Glow behind */}
          <div className="absolute inset-0 blur-[80px] bg-emerald-500/10 rounded-full pointer-events-none" />

          <p className="text-emerald-400 text-xs font-sans uppercase tracking-widest mb-5">Ready?</p>
          <h2 className="font-display text-4xl sm:text-6xl text-white mb-6 leading-tight">
            Start learning<br />without limits.
          </h2>
          <p className="text-white/35 font-sans mb-10 text-lg">
            Join thousands of learners going deeper every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/checkout?plan=annual")}
              className="group relative px-8 py-4 rounded-xl font-sans font-semibold text-sm overflow-hidden"
              style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }}
            >
              <span className="relative z-10 text-black">Get Pro — from $3.33/mo</span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-8 py-4 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 font-sans text-sm transition-all"
            >
              Try it free first
            </button>
          </div>
        </motion.div>
      </section>

      {/* Bottom spacing for navbar */}
      <div className="h-24" />
      </>}
    </div>
  );
}

// ── FAQ accordion ────────────────────────────────────────────────────────────
const FAQS = [
  { q: "Will the free plan get worse over time?", a: "No. The free plan is free forever and won't be downgraded. Pro is for people who want more — not a tax on what you already have." },
  { q: "What happens to my XP and progress if I upgrade?", a: "Everything carries over. Your streak, XP, shop purchases, topic history — all intact. Pro just unlocks more on top." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from your account settings. You keep Pro access until the end of your billing period, then drop to the free plan with no data loss." },
  { q: "Is there a student discount?", a: "Yes — reach out with a student email and we'll set you up with 50% off Pro." },
  { q: "What's included in the Teams plan?", a: "Everything in Pro, plus a group dashboard, shared learning paths, admin controls, and invoice billing. Minimum 5 seats." },
  { q: "Do you offer refunds?", a: "Yes, within 7 days of purchase, no questions asked." },
];

function FAQList() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {FAQS.map(({ q, a }, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.07 }}
          className="rounded-xl border border-white/[0.06] overflow-hidden"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-sm font-sans font-medium text-white/80">{q}</span>
            <motion.span
              animate={{ rotate: open === i ? 45 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-white/30 text-xl leading-none shrink-0 ml-4"
            >
              +
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <div className="px-6 pb-5 text-sm font-sans text-white/40 leading-relaxed border-t border-white/[0.04]">
                  <p className="pt-4">{a}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
