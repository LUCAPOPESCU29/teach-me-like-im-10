"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import PageTransition from "@/components/PageTransition";
import {
  getFlashUsageState,
  recordFlashUsage,
  getFlashTier,
  type FlashUsageState,
} from "@/lib/flash-limits";
import { saveFlashToHistory } from "@/lib/flash-history";

// ─── Flash modes (Pro/Exec unlock Science, History, Code) ────────────────────
type FlashMode = "flash" | "science" | "historymode" | "code";

const FLASH_MODES: { key: FlashMode; label: string; icon: string; color: string; proOnly: boolean }[] = [
  { key: "flash",       label: "General",  icon: "⚡", color: "#f59e0b", proOnly: false },
  { key: "science",     label: "Science",  icon: "🔬", color: "#34d399", proOnly: true  },
  { key: "historymode", label: "History",  icon: "📜", color: "#fb7185", proOnly: true  },
  { key: "code",        label: "Code",     icon: "💻", color: "#818cf8", proOnly: true  },
];

// ─── Section config ───────────────────────────────────────────────────────────
const SECTIONS = [
  { key: "hook",       num: "01", label: "The Hook",          sub: "The thing that reframes everything",   emoji: "⚡", color: "#f59e0b", rgb: "245,158,11",  style: "hero"    },
  { key: "eli10",      num: "02", label: "Like You're 10",    sub: "The core idea, made simple",           emoji: "🎯", color: "#34d399", rgb: "52,211,153",  style: "left"    },
  { key: "mechanism",  num: "03", label: "How It Works",      sub: "The actual mechanics",                 emoji: "⚙️", color: "#818cf8", rgb: "129,140,248", style: "right"   },
  { key: "whyMatters", num: "04", label: "Why It Matters",    sub: "The real-world impact",                emoji: "🌍", color: "#38bdf8", rgb: "56,189,248",  style: "left"    },
  { key: "wildFact",   num: "05", label: "Wild Fact",         sub: "Most people don't know this",          emoji: "🤯", color: "#fb7185", rgb: "251,113,133", style: "right"   },
  { key: "connected",  num: "06", label: "Surprise Link",     sub: "The unexpected connection",            emoji: "🔗", color: "#c084fc", rgb: "192,132,252", style: "left"    },
  { key: "remember",   num: "07", label: "Remember This",     sub: "The one sentence that sticks",         emoji: "✨", color: "#f59e0b", rgb: "245,158,11",  style: "hero"    },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];
type FlashData = Record<SectionKey, string>;

// ─── Example topics cycling in placeholder ────────────────────────────────────
const PLACEHOLDERS = [
  "quantum entanglement…",
  "compound interest…",
  "the placebo effect…",
  "CRISPR gene editing…",
  "game theory…",
  "black holes…",
  "the Krebs cycle…",
  "neural networks…",
];

// ─── Loading stages ───────────────────────────────────────────────────────────
const LOAD_STAGES = [
  "Analyzing the topic…",
  "Finding the clearest angle…",
  "Crafting the experience…",
];

// ─── Cooldown timer ───────────────────────────────────────────────────────────
function CooldownBadge({ resetMs }: { resetMs: number }) {
  const [t, setT] = useState("");
  useEffect(() => {
    const deadline = Date.now() + resetMs;
    const tick = () => {
      const ms = deadline - Date.now();
      if (ms <= 0) { setT("0:00"); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setT(h > 0 ? `${h}h ${m}m` : `${m}:${String(s).padStart(2, "0")}`);
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [resetMs]);
  return <span className="font-mono" style={{ color: "#f59e0b" }}>{t}</span>;
}

// ─── Animated scroll progress bar ────────────────────────────────────────────
function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div className="fixed top-0 left-0 right-0 h-[2px] origin-left z-50"
      style={{ scaleX, background: "linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)" }} />
  );
}

// ─── Section nav dots (desktop right sidebar) ─────────────────────────────────
function SectionNav({ active }: { active: string }) {
  return (
    <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-3 z-40">
      {SECTIONS.map((s) => (
        <button
          key={s.key}
          onClick={() => document.getElementById(`section-${s.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
          title={s.label}
          className="group flex items-center gap-2 justify-end"
        >
          <AnimatePresence>
            {active === s.key && (
              <motion.span
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                className="text-[10px] font-sans font-semibold uppercase tracking-wider"
                style={{ color: s.color }}
              >
                {s.label}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.div
            animate={{
              width: active === s.key ? 20 : 6,
              opacity: active === s.key ? 1 : 0.3,
              backgroundColor: active === s.key ? s.color : "#ffffff",
            }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-[6px] rounded-full"
          />
        </button>
      ))}
    </div>
  );
}

// ─── Hero card (Hook + Remember This) ────────────────────────────────────────
function HeroCard({ section, data, index }: { section: typeof SECTIONS[number]; data: string; index: number }) {
  return (
    <motion.div
      id={`section-${section.key}`}
      initial={{ opacity: 0, scale: 0.96, y: 32, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl px-8 py-10 sm:px-12 sm:py-14"
      style={{
        background: `radial-gradient(ellipse 80% 60% at 20% 40%, rgba(${section.rgb},0.1) 0%, transparent 60%), rgba(${section.rgb},0.04)`,
        border: `1px solid rgba(${section.rgb},0.18)`,
      }}
    >
      {/* Big decorative number */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="absolute top-6 right-8 font-sans font-black select-none pointer-events-none"
        style={{ fontSize: "clamp(60px, 10vw, 100px)", color: `rgba(${section.rgb},0.07)`, lineHeight: 1, letterSpacing: "-0.04em" }}
      >
        {section.num}
      </motion.div>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex items-center gap-2 mb-6"
      >
        <span className="text-xl">{section.emoji}</span>
        <span className="text-xs font-sans font-bold uppercase tracking-[0.18em]" style={{ color: section.color }}>
          {section.num} · {section.label}
        </span>
      </motion.div>

      {/* Quote mark */}
      <div className="font-sans font-black leading-none mb-3 select-none" style={{ fontSize: 64, color: `rgba(${section.rgb},0.2)`, lineHeight: 0.8 }}>
        "
      </div>

      {/* Content */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="font-sans font-bold text-2xl sm:text-3xl leading-[1.35] text-white/90"
      >
        {data}
      </motion.p>

      {/* Animated bottom line */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 h-px origin-left"
        style={{ background: `linear-gradient(90deg, rgba(${section.rgb},0.5), transparent)` }}
      />
    </motion.div>
  );
}

// ─── Regular card ─────────────────────────────────────────────────────────────
function RegularCard({ section, data, index }: { section: typeof SECTIONS[number]; data: string; index: number }) {
  const fromLeft = section.style === "left";
  return (
    <motion.div
      id={`section-${section.key}`}
      initial={{ opacity: 0, x: fromLeft ? -28 : 28, y: 28, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex gap-0 rounded-2xl overflow-hidden"
      style={{ border: `1px solid rgba(${section.rgb},0.12)`, backgroundColor: `rgba(${section.rgb},0.04)` }}
    >
      {/* Animated left border */}
      <motion.div
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-1 shrink-0 origin-top rounded-l-2xl"
        style={{ background: `linear-gradient(180deg, ${section.color}, rgba(${section.rgb},0.3))` }}
      />

      <div className="flex-1 px-6 py-6 sm:px-8 sm:py-7">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Icon with spring pop */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 20 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ backgroundColor: `rgba(${section.rgb},0.12)`, border: `1px solid rgba(${section.rgb},0.22)` }}
            >
              {section.emoji}
            </motion.div>
            <div>
              <p className="text-xs font-sans font-bold uppercase tracking-[0.16em]" style={{ color: section.color }}>
                {section.label}
              </p>
              <p className="text-[11px] text-white/30 font-sans mt-0.5">{section.sub}</p>
            </div>
          </div>

          {/* Section number (top right) */}
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="font-sans font-black text-4xl shrink-0 leading-none select-none"
            style={{ color: `rgba(${section.rgb},0.1)`, letterSpacing: "-0.04em" }}
          >
            {section.num}
          </motion.span>
        </div>

        {/* Content */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-[15px] sm:text-base leading-[1.75] text-white/75 font-sans"
        >
          {data}
        </motion.p>
      </div>
    </motion.div>
  );
}

// ─── Loading screen ───────────────────────────────────────────────────────────
function LoadingScreen({ topic }: { topic: string }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1000);
    const t2 = setTimeout(() => setStage(2), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[50vh] px-4"
    >
      {/* Pulsing icon */}
      <div className="relative mb-10">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{ border: `1px solid rgba(245,158,11,${0.25 / i})` }}
            animate={{ scale: [1, 1 + i * 0.35], opacity: [0.6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35, ease: "easeOut" }}
          />
        ))}
        <div
          className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl z-10"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", boxShadow: "0 0 40px rgba(245,158,11,0.15)" }}
        >
          ⚡
        </div>
      </div>

      <p className="text-white/40 text-sm font-sans mb-1">Distilling</p>
      <p className="font-sans font-black text-xl text-white text-center mb-10">"{topic}"</p>

      {/* Stage indicators */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {LOAD_STAGES.map((label, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: stage >= i ? 1 : 0.25, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <motion.div
              animate={{
                backgroundColor: stage > i ? "#f59e0b" : stage === i ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.06)",
                scale: stage === i ? [1, 1.15, 1] : 1,
              }}
              transition={{ duration: 0.4, repeat: stage === i ? Infinity : 0, repeatDelay: 0.8 }}
              className="w-2 h-2 rounded-full shrink-0"
            />
            <span className={`text-sm font-sans transition-colors duration-300 ${stage >= i ? "text-white/70" : "text-white/20"}`}>
              {label}
            </span>
            {stage > i && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }} className="text-xs" style={{ color: "#f59e0b" }}>
                ✓
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FlashPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ topic: string; sections: FlashData } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usageState, setUsageState] = useState<FlashUsageState>({ tier: "free", remaining: 3, used: 0, total: 3, windowLabel: "per hour", windowResetMs: null, isPaid: false });
  const [flashMode, setFlashMode] = useState<FlashMode>("flash");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const [activeSection, setActiveSection] = useState("hook");
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load usage state & tier
  useEffect(() => { setUsageState(getFlashUsageState()); }, []);

  // Cycling placeholder
  useEffect(() => {
    if (result) return;
    const t = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
        setPlaceholderVisible(true);
      }, 300);
    }, 3200);
    return () => clearInterval(t);
  }, [result]);

  // Section observer
  useEffect(() => {
    if (!result) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.id.replace("section-", "");
            setActiveSection(id);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(`section-${s.key}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [result]);

  const handleSubmit = useCallback(async () => {
    const t = topic.trim();
    if (!t || loading) return;
    const us = getFlashUsageState();
    setUsageState(us);
    if (us.remaining === 0) { setError("Limit reached — upgrade Flash or wait for your window to reset."); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const endpoint = flashMode === "flash" ? "/api/flash"
        : flashMode === "science" ? "/api/flash/science"
        : flashMode === "historymode" ? "/api/flash/historymode"
        : "/api/flash/code";
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: t }) });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || "Something went wrong"); return; }
      recordFlashUsage();
      setUsageState(getFlashUsageState());
      setResult(data);
      // Auto-save to history for Pro/Exec
      saveFlashToHistory(t, flashMode === "historymode" ? "history" : flashMode, data.sections);
      setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch { setError("Network error — please try again"); }
    finally { setLoading(false); }
  }, [topic, loading, flashMode]);

  const reset = () => { setResult(null); setError(null); setTopic(""); setTimeout(() => inputRef.current?.focus(), 50); };

  return (
    <PageTransition>
      {result && <ScrollBar />}
      {result && <SectionNav active={activeSection} />}

      <div className="min-h-screen bg-[#050505]">

        {/* ── Tier badge + upgrade nudge ── */}
        {!result && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}
            className="flex justify-center pt-5 px-4">
            {usageState.isPaid ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-sans font-semibold"
                style={{ backgroundColor: usageState.tier === "exec" ? "rgba(129,140,248,0.1)" : "rgba(245,158,11,0.1)", color: usageState.tier === "exec" ? "#818cf8" : "#f59e0b", border: `1px solid ${usageState.tier === "exec" ? "rgba(129,140,248,0.2)" : "rgba(245,158,11,0.2)"}` }}>
                ✦ {usageState.tier === "exec" ? "Flash Executive" : "Flash Pro"} · {usageState.remaining === Infinity ? "∞" : `${usageState.remaining}/${usageState.total}`} {usageState.windowLabel}
              </div>
            ) : (
              <button onClick={() => router.push("/flash/upgrade")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-sans font-semibold transition-all duration-200 hover:scale-105 hover:border-amber-500/30"
                style={{ backgroundColor: "rgba(245,158,11,0.06)", color: "rgba(245,158,11,0.6)", border: "1px solid rgba(245,158,11,0.14)" }}>
                ⚡ Free · {usageState.remaining}/{usageState.total} {usageState.windowLabel}
                <span className="opacity-70">· Upgrade to Pro $3.50/mo →</span>
              </button>
            )}
          </motion.div>
        )}

        {/* ── Hero ── */}
        <div className={`relative flex flex-col items-center px-4 pt-12 pb-10 sm:pt-16 sm:pb-16 transition-all duration-700 ${result ? "pt-16 pb-8 sm:pt-20 sm:pb-10" : ""}`}>

          {/* Animated dot grid */}
          {!result && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: "radial-gradient(circle, rgba(245,158,11,0.18) 1px, transparent 1px)",
                backgroundSize: "36px 36px",
                mask: "radial-gradient(ellipse 70% 60% at 50% 40%, black 0%, transparent 75%)",
                WebkitMask: "radial-gradient(ellipse 70% 60% at 50% 40%, black 0%, transparent 75%)",
              }} />
              <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse 55% 45% at 50% 30%, rgba(245,158,11,0.08) 0%, transparent 70%)",
              }} />
            </div>
          )}

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: -16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4 mb-10"
          >
            {/* Icon with pulse rings */}
            <div className="relative">
              {!result && [1, 2].map((i) => (
                <motion.div key={i} className="absolute inset-0 rounded-2xl"
                  style={{ border: `1px solid rgba(245,158,11,${0.15 / i})`, scale: 1 + i * 0.22 }}
                  animate={{ opacity: [0.7, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
                />
              ))}
              <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", boxShadow: "0 0 48px rgba(245,158,11,0.14)" }}>
                ⚡
              </div>
            </div>

            {!result && (
              <div className="text-center">
                <p className="font-sans font-bold text-[11px] tracking-[0.28em] uppercase mb-2 opacity-60" style={{ color: "#f59e0b" }}>TM10</p>
                <motion.h1 className="font-sans font-black leading-none mb-4"
                  style={{ fontSize: "clamp(44px, 8vw, 72px)", letterSpacing: "-0.04em", WebkitTextFillColor: "transparent", background: "linear-gradient(160deg, #fbbf24 0%, #f59e0b 60%, #d97706 100%)", WebkitBackgroundClip: "text", backgroundClip: "text" }}>
                  FLASH
                </motion.h1>
                <motion.p className="text-white/40 text-sm font-sans leading-relaxed"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  Any topic · fully understood · under 10 minutes
                </motion.p>
              </div>
            )}

            {result && (
              <div className="text-center">
                <p className="text-xs font-sans font-bold uppercase tracking-widest mb-1" style={{ color: "#f59e0b" }}>TM10 Flash</p>
                <h2 className="font-sans font-black text-white text-xl sm:text-2xl" style={{ letterSpacing: "-0.02em" }}>{result.topic}</h2>
              </div>
            )}
          </motion.div>

          {/* ── Input box ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg"
          >
            {/* Input */}
            <div className="relative mb-3">
              <div className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300"
                style={{ boxShadow: topic ? "0 0 0 3px rgba(245,158,11,0.12), 0 0 40px rgba(245,158,11,0.06)" : "none" }} />
              <div className="flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-300"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderColor: topic ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.09)",
                }}>
                <motion.span animate={{ color: topic ? "#f59e0b" : "rgba(255,255,255,0.25)" }} transition={{ duration: 0.2 }} className="text-base shrink-0">
                  ⚡
                </motion.span>
                <div className="flex-1 relative overflow-hidden">
                  <input
                    ref={inputRef}
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    disabled={loading}
                    autoFocus
                    className="w-full bg-transparent text-white text-sm font-sans outline-none"
                    placeholder=""
                  />
                  {/* Animated placeholder */}
                  {!topic && (
                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={placeholderIdx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: placeholderVisible ? 1 : 0, y: placeholderVisible ? 0 : -6 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.25 }}
                          className="text-sm font-sans text-white/22 whitespace-nowrap"
                        >
                          Try: {PLACEHOLDERS[placeholderIdx]}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                {topic && (
                  <button onClick={() => setTopic("")} className="text-white/20 hover:text-white/50 transition-colors text-sm shrink-0">✕</button>
                )}
              </div>
            </div>

            {/* Mode selector — Pro/Exec unlocks Science, History, Code */}
            {!result && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="flex gap-1.5 mb-3 p-1 rounded-xl overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {FLASH_MODES.map((m) => {
                  const isPaid = !m.proOnly || usageState.isPaid;
                  const active = flashMode === m.key;
                  return (
                    <button key={m.key}
                      onClick={() => isPaid ? setFlashMode(m.key) : router.push("/flash/upgrade")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-sans font-semibold transition-all duration-200"
                      style={{
                        backgroundColor: active ? `rgba(${m.key === "flash" ? "245,158,11" : m.key === "science" ? "52,211,153" : m.key === "historymode" ? "251,113,133" : "129,140,248"},0.15)` : "transparent",
                        color: active ? m.color : isPaid ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)",
                        border: active ? `1px solid ${m.color}33` : "1px solid transparent",
                      }}>
                      <span>{m.icon}</span>
                      <span className="hidden sm:inline">{m.label}</span>
                      {!isPaid && <span className="text-[8px] opacity-60">PRO</span>}
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              onClick={handleSubmit}
              disabled={!topic.trim() || loading || usageState.remaining === 0}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-xl py-3.5 text-sm font-sans font-bold transition-all duration-300 disabled:cursor-not-allowed relative overflow-hidden"
              style={{
                background: (!topic.trim() || loading || usageState.remaining === 0)
                  ? "rgba(245,158,11,0.12)"
                  : "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
                color: (!topic.trim() || loading || usageState.remaining === 0) ? "rgba(245,158,11,0.5)" : "#050505",
                boxShadow: topic.trim() && !loading && usageState.remaining > 0
                  ? "0 4px 24px rgba(245,158,11,0.25), 0 1px 0 rgba(255,255,255,0.15) inset"
                  : "none",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-500 rounded-full animate-spin" />
                  Distilling knowledge…
                </span>
              ) : usageState.remaining === 0 ? (
                <span className="flex items-center justify-center gap-2">
                  🔒 {usageState.tier === "free" ? "3/hour limit" : `${usageState.total}/${usageState.windowLabel} limit`} reached
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  ⚡ Flash Learn
                  <span className="opacity-60 font-normal text-xs">
                    · {usageState.remaining === Infinity ? "∞" : usageState.remaining}/{usageState.total === Infinity ? "∞" : usageState.total} {usageState.windowLabel}
                  </span>
                </span>
              )}
            </motion.button>

            {/* Rate limit wall — upgrade CTA */}
            {usageState.remaining === 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-xl p-4 flex flex-col items-center gap-2 text-center"
                style={{ backgroundColor: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <p className="text-sm font-sans font-bold text-white/70">
                  {usageState.tier === "free" ? "3 free flashes/hour used" : `${usageState.total} flashes/${usageState.windowLabel} reached`}
                </p>
                {usageState.windowResetMs && (
                  <p className="text-xs font-sans text-white/35">
                    Resets in <CooldownBadge resetMs={usageState.windowResetMs} />
                  </p>
                )}
                {usageState.tier === "free" && (
                  <button onClick={() => router.push("/flash/upgrade")}
                    className="mt-1 px-5 py-2 rounded-lg text-sm font-sans font-bold transition-all duration-200 hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#000" }}>
                    Unlock Flash Pro — $3.50/mo →
                  </button>
                )}
              </motion.div>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-2.5 text-center text-xs font-sans text-red-400">{error}</motion.p>
              )}
            </AnimatePresence>

            {/* Topic suggestions */}
            {!result && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="mt-5 flex flex-wrap justify-center gap-2">
                {["Black holes", "Compound interest", "CRISPR", "Game theory", "The placebo effect", "Blockchain"].map((s) => (
                  <motion.button
                    key={s} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setTopic(s); inputRef.current?.focus(); }}
                    className="px-3.5 py-1.5 rounded-full text-xs font-sans text-white/35 hover:text-white/65 transition-colors duration-200"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    {s}
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Math Flash link */}
            {!result && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                className="mt-4 flex justify-center">
                <button
                  onClick={() => router.push("/flash/math")}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-semibold transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)", color: "#818cf8" }}>
                  📐 Try Math Flash
                  <span className="opacity-50">— with practice notebook</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M6.5 3.5L9 6l-2.5 2.5" stroke="#818cf8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </motion.div>
            )}

            {/* Stat strip + tier badge */}
            {!result && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="mt-6 flex items-center justify-center gap-6">
                {[["7", "insights"], ["5 min", "read time"], ["100%", "signal"]].map(([val, lab]) => (
                  <div key={lab} className="text-center">
                    <div className="text-sm font-sans font-black" style={{ color: "#f59e0b" }}>{val}</div>
                    <div className="text-[10px] font-sans text-white/25 uppercase tracking-wider">{lab}</div>
                  </div>
                ))}
                <div className="h-6 w-px bg-white/[0.07]" />
                {usageState.isPaid ? (
                  <button onClick={() => router.push("/flash/history")}
                    className="flex items-center gap-1 text-[10px] font-sans font-semibold uppercase tracking-wider transition-opacity hover:opacity-80"
                    style={{ color: "#f59e0b" }}>
                    📋 History
                  </button>
                ) : (
                  <button onClick={() => router.push("/flash/upgrade")}
                    className="text-[10px] font-sans font-semibold uppercase tracking-wider transition-opacity hover:opacity-80"
                    style={{ color: "rgba(245,158,11,0.5)" }}>
                    ✦ Upgrade
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* ── Content ── */}
        <AnimatePresence mode="wait">
          {loading && !result && (
            <LoadingScreen key="loading" topic={topic} />
          )}

          {result && (
            <motion.div
              key="result"
              ref={contentRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto px-4 pb-32 lg:pr-24"
            >
              {/* Section cards */}
              <div className="flex flex-col gap-5">
                {SECTIONS.map((section, i) => (
                  section.style === "hero"
                    ? <HeroCard key={section.key} section={section} data={result.sections[section.key as SectionKey]} index={i} />
                    : <RegularCard key={section.key} section={section} data={result.sections[section.key as SectionKey]} index={i} />
                ))}
              </div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mt-14 flex flex-col sm:flex-row items-center gap-3"
              >
                <button onClick={reset} disabled={usageState.remaining === 0}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-sans font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08))", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.22)" }}>
                  ⚡ Flash Another{usageState.remaining === 0 ? " (limit reached)" : usageState.remaining === Infinity ? "" : ` · ${usageState.remaining} left`}
                </button>
                <button
                  onClick={() => router.push("/flash/math")}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-sans font-semibold transition-all duration-200 hover:scale-[1.02]"
                  style={{ backgroundColor: "rgba(129,140,248,0.1)", color: "#818cf8", border: "1px solid rgba(129,140,248,0.2)" }}>
                  📐 Math Flash
                </button>
                <button
                  onClick={() => navigator.share?.({ title: `Flash: ${result.topic}`, text: result.sections.remember, url: window.location.href })}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-sans text-white/40 hover:text-white/65 transition-colors duration-200"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  Share Key Insight
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!result && !loading && <div className="h-16" />}
      </div>
    </PageTransition>
  );
}
