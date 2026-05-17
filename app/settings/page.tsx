"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useAccent } from "@/components/AccentProvider";
import { useCelebration } from "@/components/CelebrationProvider";
import { LANGUAGES, type LangCode } from "@/lib/utils";
import { isPro, getProDaysRemaining } from "@/lib/limits";
import { ProfileEditor } from "@/components/ProfileCustomization";
import StreakFreezeShop from "@/components/StreakFreezeShop";
import PageTransition from "@/components/PageTransition";

/* ─── Accent color presets ─── */
const ACCENT_COLORS = [
  { hex: "#34d399", name: "Emerald" },
  { hex: "#60a5fa", name: "Blue" },
  { hex: "#a78bfa", name: "Purple" },
  { hex: "#f472b6", name: "Pink" },
  { hex: "#fbbf24", name: "Amber" },
  { hex: "#f87171", name: "Red" },
  { hex: "#22d3ee", name: "Cyan" },
  { hex: "#fb923c", name: "Orange" },
  { hex: "#a3e635", name: "Lime" },
  { hex: "#e879f9", name: "Fuchsia" },
];

/* ─── Font options ─── */
const FONT_OPTIONS = [
  { id: "default", label: "Default", family: "inherit" },
  { id: "serif", label: "Serif", family: "Georgia, serif" },
  { id: "mono", label: "Mono", family: "'Courier New', monospace" },
  { id: "dyslexia", label: "Dyslexia-friendly", family: "'Comic Sans MS', 'OpenDyslexic', sans-serif" },
];

/* ─── Text size options ─── */
const TEXT_SIZES = [
  { id: "sm", label: "A-", scale: 0.9 },
  { id: "md", label: "A", scale: 1.0 },
  { id: "lg", label: "A+", scale: 1.1 },
  { id: "xl", label: "A++", scale: 1.25 },
];

/* ─── Pro: AI explanation styles ─── */
const AI_STYLES = [
  { id: "default",   label: "Default",   desc: "Clear and balanced",               emoji: "✦" },
  { id: "socratic",  label: "Socratic",  desc: "Questions back at you",            emoji: "❓" },
  { id: "narrative", label: "Narrative", desc: "Story-driven explanations",        emoji: "📖" },
  { id: "technical", label: "Technical", desc: "Dense and precise, no fluff",      emoji: "⚙️" },
  { id: "casual",    label: "Casual",    desc: "Like a friend explaining it",      emoji: "💬" },
];

/* ─── Pro: Explanation lengths ─── */
const EXPLAIN_LENGTHS = [
  { id: "short",  label: "Short",  desc: "2–3 paragraphs" },
  { id: "normal", label: "Normal", desc: "Balanced depth" },
  { id: "deep",   label: "Deep",   desc: "Exhaustive + examples" },
];

/* ─── Pro: Spaced repetition intervals ─── */
const SPACED_REP_OPTIONS = [
  { id: "0",  label: "Off"    },
  { id: "3",  label: "3 days" },
  { id: "7",  label: "7 days" },
  { id: "14", label: "14 days"},
];

/* ─── Toggle component ─── */
function Toggle({ enabled, onToggle, label, desc }: { enabled: boolean; onToggle: () => void; label: string; desc?: string }) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between py-3 group">
      <div className="text-left">
        <span className="text-white/80 text-sm font-sans group-hover:text-white transition-colors">{label}</span>
        {desc && <p className="text-white/25 text-xs font-sans mt-0.5">{desc}</p>}
      </div>
      <div
        className="relative w-10 h-6 rounded-full transition-colors duration-200"
        style={{ backgroundColor: enabled ? "var(--accent)" : "rgba(255,255,255,0.08)" }}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
          animate={{ left: enabled ? 20 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}

/* ─── Section wrapper ─── */
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="flex items-center gap-2 text-white/30 text-xs font-sans font-medium tracking-widest uppercase mb-2 px-1">
        <span>{icon}</span> {title}
      </h3>
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 divide-y divide-white/[0.04]">
        {children}
      </div>
    </motion.div>
  );
}

/* ─── Confirm Modal ─── */
function ConfirmModal({ open, onClose, onConfirm, title, desc }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; desc: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl bg-[#0c1220] border border-white/10 p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-lg font-sans font-semibold mb-2">{title}</h3>
            <p className="text-white/40 text-sm font-sans mb-6">{desc}</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-white/60 text-sm font-sans hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-sans hover:bg-red-500/30 transition-colors border border-red-500/20">
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { data, isGuest, user } = useAuth();
  const { color: accentColor, setColor: setAccentColor } = useAccent();
  const { muted, toggleMute, playSound } = useCelebration();

  // ── State ──
  const [ghostMode, setGhostMode] = useState(false);
  const [lang, setLang] = useState<LangCode>("en");
  const [font, setFont] = useState("default");
  const [textSize, setTextSize] = useState("md");
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [dailyGoalReminders, setDailyGoalReminders] = useState(true);
  const [comboIndicator, setComboIndicator] = useState(true);
  const [seasonalEffects, setSeasonalEffects] = useState(true);
  const [autoplayExplanations, setAutoplayExplanations] = useState(false);
  const [showXPToasts, setShowXPToasts] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [confirmCancelPro, setConfirmCancelPro] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Free learning settings ──
  const [defaultStartLevel, setDefaultStartLevel] = useState(1);
  const [focusMode, setFocusMode] = useState(false);
  const [dailyTopicGoal, setDailyTopicGoal] = useState(3);

  // ── Pro settings ──
  const [aiStyle, setAiStyle] = useState("default");
  const [explainLength, setExplainLength] = useState("normal");
  const [customContext, setCustomContext] = useState("");
  const [spacedRep, setSpacedRep] = useState("0");
  const [masteryThreshold, setMasteryThreshold] = useState(false);

  // Pro subscription state
  const [proStatus, setProStatus] = useState<{ active: boolean; daysRemaining: number; expiryDate: string | null }>({
    active: false, daysRemaining: 0, expiryDate: null,
  });

  // ── Load Pro status ──
  useEffect(() => {
    const active = isPro();
    const days = getProDaysRemaining();
    const expiryRaw = localStorage.getItem("tmi10_pro_expiry");
    let expiryDate: string | null = null;
    if (expiryRaw) {
      expiryDate = new Date(parseInt(expiryRaw, 10)).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });
    }
    setProStatus({ active, daysRemaining: days, expiryDate });
  }, []);

  function handleCancelPro() {
    localStorage.removeItem("tmi10_pro_expiry");
    localStorage.removeItem("tmi10_is_pro");
    setProStatus({ active: false, daysRemaining: 0, expiryDate: null });
    setConfirmCancelPro(false);
    showSavedToast();
  }

  // ── Load all settings ──
  useEffect(() => {
    setGhostMode(localStorage.getItem("tmi10_ghost_mode") === "true");
    setAnimationsEnabled(localStorage.getItem("tmi10_animations_disabled") !== "true");
    setStreakReminders(localStorage.getItem("tmi10_streak_reminders_off") !== "true");
    setDailyGoalReminders(localStorage.getItem("tmi10_goal_reminders_off") !== "true");
    setComboIndicator(localStorage.getItem("tmi10_combo_hidden") !== "true");
    setSeasonalEffects(localStorage.getItem("tmi10_seasonal_off") !== "true");
    setAutoplayExplanations(localStorage.getItem("tmi10_autoplay") === "true");
    setShowXPToasts(localStorage.getItem("tmi10_xp_toasts_off") !== "true");
    setFont(localStorage.getItem("tmi10_font") || "default");
    setTextSize(localStorage.getItem("tmi10_text_size") || "md");
    const savedLang = data.getLang() as LangCode;
    if (savedLang) setLang(savedLang);
    // Free learning settings
    setDefaultStartLevel(parseInt(localStorage.getItem("tmi10_default_level") || "1", 10));
    setFocusMode(localStorage.getItem("tmi10_focus_mode") === "true");
    setDailyTopicGoal(parseInt(localStorage.getItem("tmi10_daily_goal") || "3", 10));
    // Pro settings
    setAiStyle(localStorage.getItem("tmi10_pro_ai_style") || "default");
    setExplainLength(localStorage.getItem("tmi10_pro_explain_length") || "normal");
    setCustomContext(localStorage.getItem("tmi10_pro_context") || "");
    setSpacedRep(localStorage.getItem("tmi10_pro_spaced_rep") || "0");
    setMasteryThreshold(localStorage.getItem("tmi10_pro_mastery") === "true");
  }, [data]);

  // ── Apply font ──
  useEffect(() => {
    const opt = FONT_OPTIONS.find((f) => f.id === font);
    if (opt) {
      document.documentElement.style.setProperty("--reading-font", opt.family);
      localStorage.setItem("tmi10_font", font);
    }
  }, [font]);

  // ── Apply text size ──
  useEffect(() => {
    const opt = TEXT_SIZES.find((s) => s.id === textSize);
    if (opt) {
      document.documentElement.style.setProperty("--reading-scale", String(opt.scale));
      localStorage.setItem("tmi10_text_size", textSize);
    }
  }, [textSize]);

  // ── Apply animations toggle ──
  useEffect(() => {
    if (animationsEnabled) {
      document.documentElement.classList.remove("reduce-motion");
      localStorage.removeItem("tmi10_animations_disabled");
    } else {
      document.documentElement.classList.add("reduce-motion");
      localStorage.setItem("tmi10_animations_disabled", "true");
    }
  }, [animationsEnabled]);

  // ── Apply focus mode ──
  useEffect(() => {
    if (focusMode) {
      document.documentElement.classList.add("focus-mode");
      localStorage.setItem("tmi10_focus_mode", "true");
    } else {
      document.documentElement.classList.remove("focus-mode");
      localStorage.removeItem("tmi10_focus_mode");
    }
  }, [focusMode]);

  const showSavedToast = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  // ── Free learning setting handlers ──
  function handleDefaultLevel(lvl: number) {
    setDefaultStartLevel(lvl);
    localStorage.setItem("tmi10_default_level", String(lvl));
    showSavedToast();
  }

  function handleDailyGoal(n: number) {
    setDailyTopicGoal(n);
    localStorage.setItem("tmi10_daily_goal", String(n));
    showSavedToast();
  }

  // ── Pro setting handlers ──
  function handleAiStyle(id: string) {
    setAiStyle(id);
    localStorage.setItem("tmi10_pro_ai_style", id);
    showSavedToast();
  }

  function handleExplainLength(id: string) {
    setExplainLength(id);
    localStorage.setItem("tmi10_pro_explain_length", id);
    showSavedToast();
  }

  function handleCustomContext(val: string) {
    setCustomContext(val);
    localStorage.setItem("tmi10_pro_context", val);
  }

  function handleSpacedRep(id: string) {
    setSpacedRep(id);
    localStorage.setItem("tmi10_pro_spaced_rep", id);
    showSavedToast();
  }

  function toggleMastery() {
    const next = !masteryThreshold;
    setMasteryThreshold(next);
    if (next) localStorage.setItem("tmi10_pro_mastery", "true");
    else localStorage.removeItem("tmi10_pro_mastery");
    showSavedToast();
  }

  // ── Toggle handlers ──
  function toggleGhost() {
    const next = !ghostMode;
    setGhostMode(next);
    localStorage.setItem("tmi10_ghost_mode", String(next));
    showSavedToast();
  }

  function toggleStreakReminders() {
    const next = !streakReminders;
    setStreakReminders(next);
    if (next) localStorage.removeItem("tmi10_streak_reminders_off");
    else localStorage.setItem("tmi10_streak_reminders_off", "true");
    showSavedToast();
  }

  function toggleGoalReminders() {
    const next = !dailyGoalReminders;
    setDailyGoalReminders(next);
    if (next) localStorage.removeItem("tmi10_goal_reminders_off");
    else localStorage.setItem("tmi10_goal_reminders_off", "true");
    showSavedToast();
  }

  function toggleCombo() {
    const next = !comboIndicator;
    setComboIndicator(next);
    if (next) localStorage.removeItem("tmi10_combo_hidden");
    else localStorage.setItem("tmi10_combo_hidden", "true");
    showSavedToast();
  }

  function toggleSeasonal() {
    const next = !seasonalEffects;
    setSeasonalEffects(next);
    if (next) localStorage.removeItem("tmi10_seasonal_off");
    else localStorage.setItem("tmi10_seasonal_off", "true");
    showSavedToast();
  }

  function toggleAutoplay() {
    const next = !autoplayExplanations;
    setAutoplayExplanations(next);
    localStorage.setItem("tmi10_autoplay", String(next));
    showSavedToast();
  }

  function toggleXPToasts() {
    const next = !showXPToasts;
    setShowXPToasts(next);
    if (next) localStorage.removeItem("tmi10_xp_toasts_off");
    else localStorage.setItem("tmi10_xp_toasts_off", "true");
    showSavedToast();
  }

  function handleLangChange(code: LangCode) {
    setLang(code);
    data.setLang(code);
    showSavedToast();
  }

  function handleAccentChange(hex: string) {
    setAccentColor(hex);
    playSound("pop");
    showSavedToast();
  }

  function handleResetProgress() {
    // Clear all XP, streaks, badges, topics
    const keysToRemove = [
      "tmi10_xp", "tmi10_streak", "tmi10_freezes", "tmi10_badges",
      "tmi10_weekly_goal", "tmi10_weekly_goal_auth", "tmi10_study_stats",
      "tmi10_speedruns", "tmi10_explorations", "tmi10_wager_history",
      "tmi10_wop_stats", "tmi10_combo_session", "tmi10_active_title",
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    // Remove topic progress keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith("tmi10_topic_")) localStorage.removeItem(key);
    }
    setConfirmReset(false);
    showSavedToast();
  }

  function handleClearHistory() {
    const keysToRemove = [
      "tmi10_bookmarks", "tmi10_learning_time", "tmi10_journal_cache",
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    // Remove notes
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("tmi10_notes_") || key.startsWith("tmi10_tree_"))) {
        localStorage.removeItem(key);
      }
    }
    setConfirmClearHistory(false);
    showSavedToast();
  }

  function handleReplayOnboarding() {
    localStorage.removeItem("tmi10_onboarding_done");
    router.push("/");
    showSavedToast();
  }

  // ── Stats for display ──
  const [stats, setStats] = useState({ topics: 0, xp: 0, streak: 0, storage: "0 KB" });
  useEffect(() => {
    let topicCount = 0;
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("tmi10_")) {
        totalSize += (localStorage.getItem(key) || "").length * 2; // rough byte estimate
        if (key.startsWith("tmi10_topic_")) topicCount++;
      }
    }
    const xp = parseInt(localStorage.getItem("tmi10_xp") || "0");
    const streakData = localStorage.getItem("tmi10_streak");
    let streak = 0;
    if (streakData) {
      try { streak = JSON.parse(streakData).count || 0; } catch { /* */ }
    }
    const sizeStr = totalSize < 1024 ? `${totalSize} B` : totalSize < 1048576 ? `${(totalSize / 1024).toFixed(1)} KB` : `${(totalSize / 1048576).toFixed(1)} MB`;
    setStats({ topics: topicCount, xp, streak, storage: sizeStr });
  }, []);

  return (
    <PageTransition>
    <main className="min-h-screen px-4 pt-16 pb-24 sm:pb-8">
      <div className="max-w-lg mx-auto">
        {/* Back button */}
        <motion.button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-sm font-sans mb-6 transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </motion.button>

        {/* Header card */}
        <motion.div
          className="relative mb-8 rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(52,211,153,0.07) 0%, rgba(16,185,129,0.03) 100%)",
            border: "1px solid rgba(52,211,153,0.1)",
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Glow */}
          <div
            className="absolute top-0 left-0 w-48 h-48 pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)" }}
          />
          <div className="relative px-5 py-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-display text-white mb-0.5">Settings</h1>
                <p className="text-white/30 text-xs font-sans">
                  {isGuest ? "Guest account" : user?.email ?? "Signed in"}
                </p>
              </div>
              {proStatus.active && (
                <div
                  className="px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold tracking-wider"
                  style={{
                    background: "rgba(52,211,153,0.1)",
                    border: "1px solid rgba(52,211,153,0.2)",
                    color: "#34d399",
                  }}
                >
                  ✦ PRO
                </div>
              )}
            </div>
            {/* Stats strip */}
            <div className="flex gap-4">
              {[
                { label: "Topics", value: stats.topics },
                { label: "XP",     value: stats.xp.toLocaleString() },
                { label: "Streak", value: `${stats.streak}d` },
                { label: "Stored", value: stats.storage },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <span className="text-base font-sans font-semibold text-white">
                    {s.value}
                  </span>
                  <span className="text-[10px] font-sans text-white/25 uppercase tracking-widest">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Profile ── */}
        <Section title="Profile" icon="👤">
          <div className="py-3">
            <ProfileEditor />
          </div>
        </Section>

        {/* ── Subscription ── */}
        <Section title="Subscription" icon="✦">
          {proStatus.active ? (
            <>
              {/* Active Pro */}
              <div className="py-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-sans text-sm font-semibold">Pro Plan</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">ACTIVE</span>
                    </div>
                    <p className="text-white/35 text-xs font-sans">
                      {proStatus.daysRemaining === Infinity
                        ? "Lifetime access"
                        : `${proStatus.daysRemaining} day${proStatus.daysRemaining !== 1 ? "s" : ""} remaining`}
                    </p>
                    {proStatus.expiryDate && proStatus.daysRemaining !== Infinity && (
                      <p className="text-white/25 text-[11px] font-sans mt-0.5">Expires {proStatus.expiryDate}</p>
                    )}
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: "linear-gradient(135deg,rgba(52,211,153,0.15),rgba(16,185,129,0.1))", border: "1px solid rgba(52,211,153,0.2)" }}
                  >
                    ✦
                  </div>
                </div>

                {/* Days bar */}
                {proStatus.daysRemaining !== Infinity && proStatus.daysRemaining > 0 && (
                  <div className="mb-4">
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg,#34d399,#10b981)", width: `${Math.min(100, (proStatus.daysRemaining / 30) * 100)}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (proStatus.daysRemaining / 30) * 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-white/20 text-[10px] font-sans mt-1">Donate again on Ko-fi to extend</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push("/checkout")}
                    className="flex-1 py-2.5 rounded-xl text-xs font-sans font-semibold transition-all text-black"
                    style={{ background: "linear-gradient(135deg,#34d399,#10b981)" }}
                  >
                    Extend Plan
                  </button>
                  <a
                    href="https://ko-fi.com/lucapopescu24750"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 rounded-xl text-xs font-sans text-center text-white/50 hover:text-white transition-colors border border-white/[0.08] hover:border-white/[0.15]"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    Ko-fi Page ↗
                  </a>
                </div>
              </div>

              {/* Cancel */}
              <div className="py-3">
                <button
                  onClick={() => setConfirmCancelPro(true)}
                  className="flex items-center justify-between w-full group"
                >
                  <div>
                    <span className="text-red-400/60 text-sm font-sans group-hover:text-red-400 transition-colors">Cancel Subscription</span>
                    <p className="text-white/20 text-xs font-sans mt-0.5">Remove Pro access from this device</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(248,113,113,0.4)" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            /* Not Pro */
            <div className="py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-white/60 text-sm font-sans">Free Plan</span>
                  <p className="text-white/25 text-xs font-sans mt-0.5">10 topics per day · limited shop</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-sans bg-white/[0.05] text-white/30 border border-white/[0.07]">FREE</span>
              </div>
              <button
                onClick={() => router.push("/pro")}
                className="w-full py-3 rounded-xl text-sm font-sans font-semibold text-black transition-all"
                style={{ background: "linear-gradient(135deg,#34d399,#10b981)" }}
              >
                ✦ Upgrade to Pro
              </button>
            </div>
          )}
        </Section>

        {/* ── Streak Freezes ── */}
        <Section title="Streak Freezes" icon="❄️">
          <div className="py-3">
            <StreakFreezeShop />
          </div>
        </Section>

        {/* ── Appearance ── */}
        <Section title="Appearance" icon="🎨">
          {/* Accent Color */}
          <div className="py-3">
            <span className="text-white/80 text-sm font-sans block mb-2.5">Accent Color</span>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => handleAccentChange(c.hex)}
                  className="relative w-8 h-8 rounded-full transition-all duration-200 hover:scale-110"
                  style={{
                    backgroundColor: c.hex,
                    boxShadow: accentColor === c.hex ? `0 0 0 2px #0a0f1a, 0 0 0 4px ${c.hex}` : "none",
                  }}
                  title={c.name}
                >
                  {accentColor === c.hex && (
                    <motion.svg
                      className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Font */}
          <div className="py-3">
            <span className="text-white/80 text-sm font-sans block mb-2.5">Reading Font</span>
            <div className="flex flex-wrap gap-2">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setFont(f.id); showSavedToast(); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-sans transition-all"
                  style={{
                    fontFamily: f.family,
                    backgroundColor: font === f.id ? "var(--accent)" : "rgba(255,255,255,0.04)",
                    color: font === f.id ? "#000" : "rgba(255,255,255,0.5)",
                    border: `1px solid ${font === f.id ? "var(--accent)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Size */}
          <div className="py-3">
            <span className="text-white/80 text-sm font-sans block mb-2.5">Text Size</span>
            <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 w-fit">
              {TEXT_SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setTextSize(s.id); showSavedToast(); }}
                  className="px-4 py-1.5 rounded-lg text-sm font-sans transition-all"
                  style={{
                    backgroundColor: textSize === s.id ? "var(--accent)" : "transparent",
                    color: textSize === s.id ? "#000" : "rgba(255,255,255,0.4)",
                    fontWeight: textSize === s.id ? 600 : 400,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <Toggle enabled={animationsEnabled} onToggle={() => { setAnimationsEnabled(!animationsEnabled); showSavedToast(); }} label="Animations" desc="Motion effects throughout the app" />
        </Section>

        {/* ── Language ── */}
        <Section title="Language" icon="🌍">
          <div className="py-3">
            <span className="text-white/80 text-sm font-sans block mb-2.5">Explanation Language</span>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLangChange(l.code as LangCode)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-sans transition-all"
                  style={{
                    backgroundColor: lang === l.code ? "var(--accent)" : "rgba(255,255,255,0.03)",
                    color: lang === l.code ? "#000" : "rgba(255,255,255,0.5)",
                    border: `1px solid ${lang === l.code ? "var(--accent)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Sound & Feedback ── */}
        <Section title="Sound & Feedback" icon="🔊">
          <Toggle enabled={!muted} onToggle={() => { toggleMute(); showSavedToast(); }} label="Sound Effects" desc="Pops, chimes, and level-up sounds" />
          <Toggle enabled={showXPToasts} onToggle={toggleXPToasts} label="XP Notifications" desc="Floating +XP toasts when you earn points" />
          <div className="py-3">
            <span className="text-white/40 text-xs font-sans">Test sounds:</span>
            <div className="flex gap-2 mt-2">
              {(["pop", "chime", "levelUp", "whoosh", "complete"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => playSound(s)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 text-xs font-sans hover:bg-white/[0.08] hover:text-white/60 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Learning ── */}
        <Section title="Learning" icon="📚">
          <Toggle enabled={autoplayExplanations} onToggle={toggleAutoplay} label="Auto-scroll Explanations" desc="Automatically scroll as AI generates text" />
          <Toggle enabled={comboIndicator} onToggle={toggleCombo} label="Combo Indicator" desc="Show XP multiplier when learning multiple topics" />
          <Toggle enabled={seasonalEffects} onToggle={toggleSeasonal} label="Seasonal Events" desc="Holiday themes and special XP events" />

          {/* Focus mode */}
          <Toggle
            enabled={focusMode}
            onToggle={() => { setFocusMode((p) => !p); showSavedToast(); }}
            label="Focus Mode"
            desc="Hides the navbar and bottom nav while learning"
          />

          {/* Default start level */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <span className="text-white/80 text-sm font-sans">Default Start Level</span>
                <p className="text-white/25 text-xs font-sans mt-0.5">Skip to this depth when opening any topic</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const COLORS = ["#4ade80", "#facc15", "#fb923c", "#f472b6", "#a78bfa"];
                const active = defaultStartLevel === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => handleDefaultLevel(lvl)}
                    className="flex-1 py-2 rounded-xl text-xs font-sans font-medium transition-all duration-200"
                    style={{
                      background: active ? `${COLORS[lvl - 1]}20` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${active ? COLORS[lvl - 1] + "60" : "rgba(255,255,255,0.06)"}`,
                      color: active ? COLORS[lvl - 1] : "rgba(255,255,255,0.35)",
                    }}
                  >
                    L{lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily topic goal */}
          <div className="py-3">
            <div className="mb-2.5">
              <span className="text-white/80 text-sm font-sans">Daily Topic Goal</span>
              <p className="text-white/25 text-xs font-sans mt-0.5">How many topics count as a good day</p>
            </div>
            <div className="flex gap-1.5">
              {[1, 3, 5, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => handleDailyGoal(n)}
                  className="flex-1 py-2 rounded-xl text-xs font-sans font-medium transition-all duration-200"
                  style={{
                    background: dailyTopicGoal === n ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${dailyTopicGoal === n ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.06)"}`,
                    color: dailyTopicGoal === n ? "#34d399" : "rgba(255,255,255,0.35)",
                  }}
                >
                  {n}/day
                </button>
              ))}
            </div>
          </div>

          <div className="py-3">
            <button
              onClick={() => router.push("/progress")}
              className="flex items-center justify-between w-full group"
            >
              <div>
                <span className="text-white/80 text-sm font-sans group-hover:text-white transition-colors">Weekly Goals</span>
                <p className="text-white/25 text-xs font-sans mt-0.5">Set your learning targets</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </Section>

        {/* ── Pro Features ── */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Section header */}
          <h3 className="flex items-center gap-2 text-[10px] font-sans font-medium tracking-widest uppercase mb-2 px-1"
            style={{ color: "#34d399" }}
          >
            <span>✦</span> Pro Features
          </h3>

          <div className="rounded-2xl overflow-hidden relative"
            style={{ border: "1px solid rgba(52,211,153,0.12)", background: "rgba(52,211,153,0.02)" }}
          >
            {/* Lock overlay for free users */}
            {!proStatus.active && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl"
                style={{ background: "rgba(5,10,16,0.82)", backdropFilter: "blur(8px)" }}
              >
                <div className="text-2xl mb-3">🔒</div>
                <p className="text-white/60 text-sm font-sans font-medium mb-1">Pro only</p>
                <p className="text-white/25 text-xs font-sans mb-4">Upgrade to unlock AI customisation</p>
                <button
                  onClick={() => router.push("/pro")}
                  className="px-5 py-2 rounded-xl text-xs font-sans font-semibold text-black transition-all"
                  style={{ background: "linear-gradient(135deg,#34d399,#10b981)" }}
                >
                  ✦ Upgrade to Pro
                </button>
              </div>
            )}

            <div className="px-4 divide-y divide-white/[0.04]" style={{ opacity: proStatus.active ? 1 : 0.3 }}>

              {/* Explanation style */}
              <div className="py-4">
                <span className="text-white/80 text-sm font-sans block mb-1">Explanation Style</span>
                <p className="text-white/25 text-xs font-sans mb-3">How Claude writes every explanation</p>
                <div className="flex flex-col gap-2">
                  {AI_STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => proStatus.active && handleAiStyle(s.id)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-sans text-left transition-all duration-200"
                      style={{
                        background: aiStyle === s.id ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${aiStyle === s.id ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.05)"}`,
                      }}
                    >
                      <span className="text-base w-6 text-center">{s.emoji}</span>
                      <div className="flex-1">
                        <span className={`text-sm font-sans font-medium ${aiStyle === s.id ? "text-white" : "text-white/50"}`}>{s.label}</span>
                        <p className="text-white/25 text-xs font-sans">{s.desc}</p>
                      </div>
                      {aiStyle === s.id && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#34d399" }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Explanation length */}
              <div className="py-4">
                <span className="text-white/80 text-sm font-sans block mb-1">Explanation Length</span>
                <p className="text-white/25 text-xs font-sans mb-3">How much detail each level contains</p>
                <div className="flex gap-2">
                  {EXPLAIN_LENGTHS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => proStatus.active && handleExplainLength(l.id)}
                      className="flex-1 py-2.5 px-2 rounded-xl text-center transition-all duration-200"
                      style={{
                        background: explainLength === l.id ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${explainLength === l.id ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.05)"}`,
                      }}
                    >
                      <p className={`text-sm font-sans font-medium ${explainLength === l.id ? "text-white" : "text-white/50"}`}>{l.label}</p>
                      <p className="text-white/25 text-[10px] font-sans mt-0.5">{l.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom context */}
              <div className="py-4">
                <span className="text-white/80 text-sm font-sans block mb-1">Personal Context</span>
                <p className="text-white/25 text-xs font-sans mb-3">
                  Added to every explanation — "I'm a nurse", "use football analogies", etc.
                </p>
                <textarea
                  value={customContext}
                  onChange={(e) => proStatus.active && handleCustomContext(e.target.value)}
                  onBlur={showSavedToast}
                  placeholder="e.g. I'm a software engineer, assume technical knowledge..."
                  maxLength={300}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-sans text-white/70 placeholder:text-white/15 resize-none focus:outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(52,211,153,0.3)"; }}
                  onBlurCapture={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; }}
                />
                <p className="text-white/15 text-[10px] font-sans mt-1 text-right">{customContext.length}/300</p>
              </div>

              {/* Spaced repetition */}
              <div className="py-4">
                <span className="text-white/80 text-sm font-sans block mb-1">Spaced Repetition</span>
                <p className="text-white/25 text-xs font-sans mb-3">
                  Surface topics you haven&apos;t revisited at the top of home
                </p>
                <div className="flex gap-2">
                  {SPACED_REP_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => proStatus.active && handleSpacedRep(o.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-sans font-medium transition-all duration-200"
                      style={{
                        background: spacedRep === o.id ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${spacedRep === o.id ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.05)"}`,
                        color: spacedRep === o.id ? "#34d399" : "rgba(255,255,255,0.35)",
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mastery threshold */}
              <div className="py-1">
                <Toggle
                  enabled={masteryThreshold}
                  onToggle={() => proStatus.active && toggleMastery()}
                  label="Mastery Threshold"
                  desc="Only mark a topic mastered after scoring ≥ 80% on the quiz"
                />
              </div>

            </div>
          </div>
        </motion.div>

        {/* ── Notifications ── */}
        <Section title="Notifications" icon="🔔">
          <Toggle enabled={streakReminders} onToggle={toggleStreakReminders} label="Streak at Risk Warning" desc="Remind you after 10pm if your streak is in danger" />
          <Toggle enabled={dailyGoalReminders} onToggle={toggleGoalReminders} label="Daily Goal Reminders" desc="Nudge when you haven't met your daily target" />
        </Section>

        {/* ── Privacy ── */}
        <Section title="Privacy" icon="🔒">
          <Toggle enabled={ghostMode} onToggle={toggleGhost} label="Ghost Mode" desc="Hide yourself from leaderboards and public profiles" />
          <div className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white/80 text-sm font-sans">Account</span>
                <p className="text-white/25 text-xs font-sans mt-0.5">
                  {isGuest ? "Guest mode — data stored locally" : user?.email || "Signed in"}
                </p>
              </div>
              {isGuest ? (
                <button
                  onClick={() => router.push("/auth/login")}
                  className="px-3 py-1.5 rounded-lg text-xs font-sans transition-all"
                  style={{ backgroundColor: "var(--accent)", color: "#000" }}
                >
                  Sign in
                </button>
              ) : (
                <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-sans">
                  ✓ Synced
                </span>
              )}
            </div>
          </div>
        </Section>

        {/* ── Data & Storage ── */}
        <Section title="Data & Storage" icon="💾">
          {/* Stats */}
          <div className="py-3">
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <span className="text-white/70 text-lg font-mono block">{stats.topics}</span>
                <span className="text-white/20 text-[10px] font-sans">Topics</span>
              </div>
              <div className="text-center">
                <span className="text-white/70 text-lg font-mono block">{stats.xp.toLocaleString()}</span>
                <span className="text-white/20 text-[10px] font-sans">XP</span>
              </div>
              <div className="text-center">
                <span className="text-white/70 text-lg font-mono block">{stats.streak}</span>
                <span className="text-white/20 text-[10px] font-sans">Streak</span>
              </div>
              <div className="text-center">
                <span className="text-white/70 text-lg font-mono block">{stats.storage}</span>
                <span className="text-white/20 text-[10px] font-sans">Storage</span>
              </div>
            </div>
          </div>

          {/* Replay onboarding */}
          <div className="py-3">
            <button onClick={handleReplayOnboarding} className="flex items-center justify-between w-full group">
              <div>
                <span className="text-white/80 text-sm font-sans group-hover:text-white transition-colors">Replay Onboarding</span>
                <p className="text-white/25 text-xs font-sans mt-0.5">See the welcome tour again</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round">
                <path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
            </button>
          </div>

          {/* Export data */}
          <div className="py-3">
            <button
              onClick={() => {
                const exportData: Record<string, string | null> = {};
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key?.startsWith("tmi10_")) exportData[key] = localStorage.getItem(key);
                }
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `teachmelikeim10-backup-${new Date().toISOString().split("T")[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                showSavedToast();
              }}
              className="flex items-center justify-between w-full group"
            >
              <div>
                <span className="text-white/80 text-sm font-sans group-hover:text-white transition-colors">Export Data</span>
                <p className="text-white/25 text-xs font-sans mt-0.5">Download all your data as JSON</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
            </button>
          </div>

          {/* Import data */}
          <div className="py-3">
            <button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    try {
                      const imported = JSON.parse(ev.target?.result as string);
                      Object.entries(imported).forEach(([key, value]) => {
                        if (key.startsWith("tmi10_") && typeof value === "string") {
                          localStorage.setItem(key, value);
                        }
                      });
                      showSavedToast();
                      window.location.reload();
                    } catch {
                      alert("Invalid backup file");
                    }
                  };
                  reader.readAsText(file);
                };
                input.click();
              }}
              className="flex items-center justify-between w-full group"
            >
              <div>
                <span className="text-white/80 text-sm font-sans group-hover:text-white transition-colors">Import Data</span>
                <p className="text-white/25 text-xs font-sans mt-0.5">Restore from a backup file</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            </button>
          </div>

          {/* Danger zone */}
          <div className="py-3">
            <p className="text-red-400/40 text-[10px] font-sans tracking-widest uppercase mb-2">Danger Zone</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmClearHistory(true)}
                className="flex-1 py-2 rounded-xl bg-red-500/[0.06] border border-red-500/10 text-red-400/60 text-xs font-sans hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                Clear History
              </button>
              <button
                onClick={() => setConfirmReset(true)}
                className="flex-1 py-2 rounded-xl bg-red-500/[0.06] border border-red-500/10 text-red-400/60 text-xs font-sans hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                Reset All Progress
              </button>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="text-center mt-8 mb-4">
          <p className="text-white/10 text-xs font-sans">Teach Me Like I&apos;m 10 · v2.0</p>
        </div>
      </div>

      {/* Saved toast */}
      <AnimatePresence>
        {saved && (
          <motion.div
            className="fixed bottom-24 sm:bottom-8 left-1/2 z-[100] px-4 py-2 rounded-xl bg-[#0a1020]/90 backdrop-blur-lg border text-sm font-sans"
            style={{ borderColor: "var(--accent)", color: "var(--accent)", x: "-50%" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            ✓ Saved
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm modals */}
      <ConfirmModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleResetProgress}
        title="Reset All Progress?"
        desc="This will delete all your XP, streaks, badges, and topic progress. This cannot be undone."
      />
      <ConfirmModal
        open={confirmClearHistory}
        onClose={() => setConfirmClearHistory(false)}
        onConfirm={handleClearHistory}
        title="Clear History?"
        desc="This will delete your bookmarks, learning time data, notes, and journal entries."
      />
      <ConfirmModal
        open={confirmCancelPro}
        onClose={() => setConfirmCancelPro(false)}
        onConfirm={handleCancelPro}
        title="Cancel Pro?"
        desc="This removes Pro access from this device. If you donated on Ko-fi, you can re-activate anytime on the success page using your Ko-fi email."
      />
    </main>
      </PageTransition>
  );
}
