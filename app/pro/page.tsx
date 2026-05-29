"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
import { useRouter } from "next/navigation";
import { isPro, getProDaysRemaining } from "@/lib/limits";
import SparkyCanvas from "@/components/SparkyCanvas";

/* ── Character-split text component ── */
function SplitChars({ text, className, delay = 0, gradient }: {
  text: string; className?: string; delay?: number; gradient?: boolean;
}) {
  const gradStyle: React.CSSProperties = gradient ? {
    background: "linear-gradient(135deg,#34d399 0%,#6ee7b7 45%,#a7f3d0 75%,#34d399 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  } : {};

  return (
    <span className={className} aria-label={text}>
      {text.split("").map((ch, i) => (
        <motion.span
          key={i}
          style={{
            display: "inline-block",
            whiteSpace: ch === " " ? "pre" : undefined,
            ...gradStyle,
          }}
          initial={{ opacity: 0, y: 28, rotateX: 90, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.55, delay: delay + i * 0.038, ease: [0.32, 0.72, 0, 1] }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </span>
  );
}

// ── Floating orb background ──────────────────────────────────────────────────
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[#030609]" />
      <motion.div className="absolute rounded-full blur-[120px]"
        style={{ width: 600, height: 600, top: "-10%", left: "-10%", background: "radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)" }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute rounded-full blur-[150px]"
        style={{ width: 700, height: 700, top: "30%", right: "-15%", background: "radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)" }}
        animate={{ x: [0, -50, 0], y: [0, 40, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 4 }} />
      <motion.div className="absolute rounded-full blur-[100px]"
        style={{ width: 400, height: 400, bottom: "10%", left: "30%", background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)" }}
        animate={{ x: [0, 30, 0], y: [0, -30, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 8 }} />
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: `linear-gradient(rgba(52,211,153,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.8) 1px, transparent 1px)`, backgroundSize: "80px 80px" }} />
      <div className="absolute inset-0 opacity-[0.035]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "200px 200px" }} />
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
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ── Marquee strip ────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = ["Unlimited Topics","Audio Explanations","PDF Export","AI Follow-ups","Custom Paths","Private Study Rooms","Full XP Shop","Teach-Back AI Grading","Analytics Dashboard","Priority Support","Exclusive Perks","Early Access"];
function Marquee() {
  return (
    <div className="relative overflow-hidden py-4 border-y border-emerald-500/10">
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-[#030609] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-[#030609] to-transparent pointer-events-none" />
      <motion.div className="flex gap-8 whitespace-nowrap" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <span key={i} className="flex items-center gap-3 text-sm font-sans text-white/30">
            <span className="text-emerald-400">✦</span>{item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Feature comparison row ────────────────────────────────────────────────────
function Feat({ label, free, pro }: { label: string; free: boolean | string; pro: boolean | string }) {
  return (
    <div className="grid grid-cols-[1fr_100px_100px] items-center py-3.5 border-b border-white/[0.04] group hover:bg-white/[0.02] transition-colors rounded-lg px-3">
      <span className="text-sm font-sans text-white/60 group-hover:text-white/80 transition-colors">{label}</span>
      <div className="flex justify-center">
        {free === true ? <span className="text-emerald-400 text-base">✓</span> : free === false ? <span className="text-white/15 text-base">—</span> : <span className="text-white/40 text-xs font-sans">{free}</span>}
      </div>
      <div className="flex justify-center">
        {pro === true ? (
          <motion.span className="text-emerald-400 text-base" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 300 }}>✓</motion.span>
        ) : pro === false ? <span className="text-white/15 text-base">—</span> : <span className="text-emerald-400 text-xs font-sans font-medium">{pro}</span>}
      </div>
    </div>
  );
}

// ── Toggle pill ──────────────────────────────────────────────────────────────
function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="relative flex-shrink-0"
      style={{ width: 36, height: 20, borderRadius: 10, background: enabled ? "linear-gradient(135deg, #34d399, #10b981)" : "rgba(255,255,255,0.07)", border: enabled ? "none" : "1px solid rgba(255,255,255,0.11)", boxShadow: enabled ? "0 0 10px rgba(52,211,153,0.3)" : "none", transition: "all 0.3s cubic-bezier(0.32,0.72,0,1)" }}>
      <motion.div className="absolute top-0.5 rounded-full" style={{ width: 16, height: 16, background: enabled ? "#000" : "rgba(255,255,255,0.3)" }} animate={{ x: enabled ? 18 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE MOCKUP COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function MockupShell({ children, glow }: { children: React.ReactNode; glow?: string }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#070f0b]"
      style={{ boxShadow: glow ? `0 0 60px ${glow}20, 0 0 120px ${glow}08` : "none" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: glow ? `radial-gradient(ellipse at 60% 0%, ${glow}10 0%, transparent 55%)` : undefined }} />
      <div className="relative">{children}</div>
    </div>
  );
}

// 1. Unlimited topics mockup
function UnlimitedMockup() {
  const topics = ["Quantum Entanglement","Black Holes","CRISPR Gene Editing","String Theory","Neural Networks","The Roman Empire","Stoic Philosophy","Plate Tectonics","The Fermi Paradox","Compound Interest"];
  return (
    <MockupShell glow="#34d399">
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <span className="text-white/40 font-mono text-[10px] tracking-widest uppercase">Today&apos;s sessions</span>
          <span className="font-mono text-emerald-400 text-sm font-bold tracking-wider">∞ unlimited</span>
        </div>
        <div className="space-y-2">
          {topics.map((t, i) => (
            <motion.div key={t} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]"
              initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.06, ease: [0.23, 1, 0.32, 1] }}>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-white/70 font-sans text-xs flex-1">{t}</span>
              <span className="text-emerald-400/60 font-mono text-[10px]">✓</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between">
          <span className="text-white/20 font-sans text-xs">No cooldown. No cap.</span>
          <span className="text-emerald-400 font-mono text-xs">+{topics.length * 12} XP today</span>
        </div>
      </div>
    </MockupShell>
  );
}

// 2. Audio narration mockup
function AudioMockup() {
  const bars = Array.from({ length: 36 }, (_, i) => ({
    height: 20 + Math.random() * 60,
    active: i < 22,
    delay: i * 0.04,
  }));
  return (
    <MockupShell glow="#a855f7">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.25)" }}>🎧</div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-sans font-medium truncate">Quantum Entanglement</p>
            <p className="text-white/35 text-xs font-sans">Level 3 · High School · 4:51</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-white/40 text-[10px]">1:23</p>
            <p className="font-mono text-white/20 text-[10px]">4:51</p>
          </div>
        </div>

        {/* Waveform */}
        <div className="flex items-center gap-[2px] h-14 mb-5">
          {bars.map((b, i) => (
            <motion.div key={i} className="flex-1 rounded-full"
              style={{ backgroundColor: b.active ? "rgba(168,85,247,0.8)" : "rgba(255,255,255,0.08)" }}
              animate={b.active ? { scaleY: [0.4, b.height / 80 + 0.2, 0.4] } : {}}
              transition={{ duration: 1.2 + (i % 3) * 0.3, repeat: Infinity, delay: b.delay }} />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-3 items-center">
            {["⏮", "⏸", "⏭"].map((c, i) => (
              <button key={i} className="text-white/40 hover:text-white/80 transition-colors text-sm">{c}</button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {["1x", "1.5x", "2x"].map((s, i) => (
              <span key={s} className="px-2 py-0.5 rounded font-mono text-[10px]"
                style={i === 0 ? { background: "rgba(168,85,247,0.2)", color: "rgba(168,85,247,0.9)" } : { color: "rgba(255,255,255,0.25)" }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #a855f7, #c084fc)" }}
            initial={{ width: "28%" }} animate={{ width: "34%" }} transition={{ duration: 12, ease: "linear", repeat: Infinity, repeatType: "mirror" }} />
        </div>
      </div>
    </MockupShell>
  );
}

// 3. PDF export mockup
function PDFMockup() {
  return (
    <MockupShell glow="#fb923c">
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Doc preview */}
          <div className="w-28 flex-shrink-0 rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.02]">
            <div className="h-3 flex items-center gap-1 px-2 bg-white/[0.04] border-b border-white/[0.06]">
              {[1,2,3].map(i=><div key={i} className="w-1 h-1 rounded-full bg-white/20"/>)}
            </div>
            <div className="p-2 space-y-1.5">
              <div className="h-1.5 w-full rounded bg-white/10"/>
              <div className="h-1.5 w-4/5 rounded bg-white/10"/>
              <div className="h-1.5 w-full rounded bg-white/8"/>
              <div className="h-1.5 w-3/4 rounded bg-white/8"/>
              <div className="h-px bg-white/5 my-1"/>
              <div className="h-1.5 w-full rounded bg-white/10"/>
              <div className="h-1.5 w-4/5 rounded bg-white/10"/>
              <div className="h-1.5 w-full rounded bg-white/8"/>
              <div className="h-1.5 w-2/3 rounded bg-white/8"/>
            </div>
            <div className="flex items-center justify-center py-2">
              <span className="text-white/20 font-mono text-[8px]">PDF</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-sans font-medium mb-1">Black Holes — Complete</p>
            <p className="text-white/30 text-xs font-sans mb-3">All 5 levels · 14 pages · formatted</p>
            <div className="flex gap-1 flex-wrap mb-4">
              {[["ELI5","#4ade80"],["Middle","#facc15"],["High","#fb923c"],["College","#f472b6"],["PhD","#a78bfa"]].map(([l,c])=>(
                <span key={l} className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold" style={{ background: `${c}18`, color: c, border: `1px solid ${c}30` }}>{l}</span>
              ))}
            </div>
            <motion.button className="w-full py-2 rounded-xl font-mono text-xs font-bold tracking-wider"
              style={{ background: "linear-gradient(135deg, rgba(251,146,60,0.25), rgba(251,146,60,0.15))", border: "1px solid rgba(251,146,60,0.35)", color: "#fb923c" }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              ↓ Export PDF
            </motion.button>
          </div>
        </div>
      </div>
    </MockupShell>
  );
}

// 4. AI follow-up mockup
function FollowupMockup() {
  const [visible, setVisible] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const timers = [
      setTimeout(() => setVisible(1), 400),
      setTimeout(() => setVisible(2), 1400),
      setTimeout(() => setVisible(3), 2600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <MockupShell glow="#38bdf8">
      <div className="p-5 space-y-3" ref={ref}>
        {/* Context card */}
        <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <p className="text-white/30 font-mono text-[9px] tracking-wider uppercase mb-1">Level 3 — Just read</p>
          <p className="text-white/50 text-xs font-sans leading-relaxed line-clamp-2">
            ...quantum entanglement occurs when two particles become correlated in such a way that the quantum state of each particle cannot be described independently...
          </p>
        </div>

        {/* User question */}
        <AnimatePresence>
          {visible >= 1 && (
            <motion.div className="flex justify-end" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-br-sm text-xs font-sans text-white leading-relaxed"
                style={{ background: "rgba(56,189,248,0.2)", border: "1px solid rgba(56,189,248,0.25)" }}>
                But why does observing one particle instantly affect the other, even across the galaxy?
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI typing indicator */}
        {visible === 1 && (
          <div className="flex gap-1 px-3 py-2">
            {[0,1,2].map(i=><motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-sky-400/50"
              animate={{ y: [0,-4,0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i*0.15 }}/>)}
          </div>
        )}

        {/* AI response */}
        <AnimatePresence>
          {visible >= 2 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0 text-xs">✦</div>
                <div className="flex-1 px-3 py-2 rounded-2xl rounded-bl-sm bg-white/[0.04] border border-white/[0.07] text-xs font-sans text-white/75 leading-relaxed">
                  Great question — this is the &quot;spooky action&quot; Einstein was troubled by. It&apos;s not that information travels; rather, the particles share a single quantum state...
                  {visible < 3 && <motion.span animate={{ opacity: [1,0] }} transition={{ duration: 0.5, repeat: Infinity }}>▍</motion.span>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="flex gap-2 pt-1">
          <div className="flex-1 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white/20 text-xs font-sans">Ask a follow-up...</div>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.25)" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6h10M6 1l5 5-5 5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </div>
    </MockupShell>
  );
}

// 5. Study room mockup
function StudyRoomMockup() {
  const participants = [
    { name: "You", level: 3, color: "#34d399", host: false, isYou: true },
    { name: "Sofia", level: 4, color: "#f472b6", host: true, isYou: false },
    { name: "Marcus", level: 2, color: "#fb923c", host: false, isYou: false },
    { name: "Priya", level: 3, color: "#a78bfa", host: false, isYou: false },
  ];
  const LEVEL_COLORS = ["#4ade80","#facc15","#fb923c","#f472b6","#a78bfa"];
  return (
    <MockupShell glow="#f472b6">
      <div className="p-5">
        {/* Room header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white font-sans text-sm font-medium">Black Holes — Session</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400" animate={{ opacity: [0.4,1,0.4] }} transition={{ duration: 2, repeat: Infinity }} />
              <span className="font-mono text-[10px] text-white/30 tracking-wider">LIVE · R4XK2M</span>
            </div>
          </div>
          <button className="px-2.5 py-1 rounded-lg font-mono text-[9px] tracking-wider"
            style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}>
            COPY LINK
          </button>
        </div>

        {/* Participants */}
        <div className="space-y-2 mb-4">
          {participants.map((p, i) => (
            <motion.div key={p.name} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: p.color }}>
                {p.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-sans" style={{ color: p.isYou ? "#34d399" : "rgba(255,255,255,0.7)" }}>
                    {p.name}{p.isYou ? " (you)" : ""}
                  </span>
                  {p.host && <span className="text-[8px] font-mono px-1 rounded" style={{ background: "rgba(251,191,36,0.1)", color: "rgba(251,191,36,0.7)", border: "1px solid rgba(251,191,36,0.2)" }}>HOST</span>}
                </div>
                <div className="flex gap-1 mt-0.5">
                  {[1,2,3,4,5].map(l => (
                    <div key={l} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l <= p.level ? LEVEL_COLORS[l-1] : "rgba(255,255,255,0.08)" }} />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Activity feed */}
        <div className="space-y-1.5 px-2 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <p className="text-emerald-400/70 font-mono text-[10px]">Sofia reached Level 4! 🎉</p>
          <p className="text-white/30 font-mono text-[10px]">Marcus: this is mind-blowing 🤯</p>
          <p className="text-white/20 font-mono text-[10px]">Priya: agreed!! Level 3 hit different</p>
        </div>
      </div>
    </MockupShell>
  );
}

// 6. Teach-back grading mockup
function TeachBackMockup() {
  const [phase, setPhase] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [inView]);

  return (
    <MockupShell glow="#fbbf24">
      <div className="p-5" ref={ref}>
        <p className="text-white/40 font-mono text-[9px] tracking-widest uppercase mb-3">Teach It Back — Quantum Entanglement</p>

        {/* Recording / text */}
        <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] mb-4 min-h-[80px]">
          {phase === 0 && (
            <div className="flex items-center gap-3">
              <motion.div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}
                animate={{ boxShadow: ["0 0 0 0 rgba(251,191,36,0.3)", "0 0 0 8px rgba(251,191,36,0)"] }}
                transition={{ duration: 1.2, repeat: Infinity }}>
                🎤
              </motion.div>
              <div>
                <p className="text-amber-400 font-mono text-xs">Recording...</p>
                <p className="text-white/25 font-sans text-[11px]">Speak your explanation</p>
              </div>
            </div>
          )}
          {phase >= 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-white/60 font-sans text-xs leading-relaxed">
                &quot;Quantum entanglement is when two particles become linked together. When you measure one, the other instantly takes the opposite state — even if it&apos;s light-years away. It&apos;s like they share information faster than light, which is why Einstein called it spooky action at a distance...&quot;
              </p>
            </motion.div>
          )}
        </div>

        {/* Grade result */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.05))", border: "1px solid rgba(251,191,36,0.25)" }}>
                <div>
                  <p className="text-amber-400 font-mono text-xs tracking-wider uppercase">AI Grade</p>
                  <p className="text-white/50 font-sans text-[11px] mt-0.5">Good core understanding!</p>
                </div>
                <span className="font-display text-3xl text-amber-400 font-bold">B+</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { ok: true,  text: "Correct: correlations + Einstein quote" },
                  { ok: true,  text: "Correct: both particles described" },
                  { ok: false, text: "Missing: no faster-than-light signaling" },
                  { ok: false, text: "Missing: Bell inequality experiment" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{ background: item.ok ? "rgba(52,211,153,0.06)" : "rgba(255,255,255,0.03)" }}>
                    <span className="text-xs">{item.ok ? "✓" : "→"}</span>
                    <span className="text-xs font-sans" style={{ color: item.ok ? "rgba(52,211,153,0.8)" : "rgba(255,255,255,0.35)" }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MockupShell>
  );
}

// 7. Custom learning paths mockup
function PathsMockup() {
  const nodes = [
    { label: "Quantum Basics", done: true, x: 0 },
    { label: "Wave Functions", done: true, x: 1 },
    { label: "Entanglement", done: false, x: 2, active: true },
    { label: "Bell's Theorem", done: false, x: 3 },
  ];
  return (
    <MockupShell glow="#6ee7b7">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white font-sans text-sm font-medium">Quantum Mastery Path</p>
          <span className="font-mono text-emerald-400 text-xs">2 / 4 complete</span>
        </div>
        {/* Path visualization */}
        <div className="relative mb-6">
          <div className="absolute top-5 left-6 right-6 h-0.5 bg-white/[0.06]" />
          <div className="absolute top-5 left-6 h-0.5 bg-emerald-500/40" style={{ width: "calc(50% - 0px)" }} />
          <div className="flex justify-between relative">
            {nodes.map((n, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center z-10"
                  style={{
                    background: n.done ? "rgba(52,211,153,0.2)" : n.active ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.05)",
                    border: n.done ? "2px solid rgba(52,211,153,0.5)" : n.active ? "2px solid rgba(52,211,153,0.3)" : "1px solid rgba(255,255,255,0.1)",
                  }}>
                  {n.done ? <span className="text-emerald-400 text-sm">✓</span> : n.active ? <motion.div className="w-2 h-2 rounded-full bg-emerald-400" animate={{ opacity: [0.4,1,0.4] }} transition={{ duration: 1.5, repeat: Infinity }} /> : <div className="w-2 h-2 rounded-full bg-white/15"/>}
                </div>
                <span className="text-[9px] font-sans text-center w-14 leading-tight" style={{ color: n.done ? "rgba(255,255,255,0.7)" : n.active ? "#34d399" : "rgba(255,255,255,0.25)" }}>{n.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Current topic */}
        <div className="px-3 py-3 rounded-xl mb-3" style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <div className="flex items-center gap-2 mb-1">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400" animate={{ opacity: [0.4,1,0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <p className="text-emerald-400 font-mono text-[10px] tracking-wider uppercase">Current</p>
          </div>
          <p className="text-white text-sm font-sans font-medium">Quantum Entanglement</p>
          <p className="text-white/40 text-xs font-sans mt-0.5">Levels 1–5 · Estimated 20 min</p>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {["Add topic", "Reorder", "Share path"].map((label) => (
            <button key={label} className="py-2 rounded-lg font-sans text-[11px] text-white/40 hover:text-white/70 transition-colors" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>{label}</button>
          ))}
        </div>
      </div>
    </MockupShell>
  );
}

// ── Feature section wrapper ───────────────────────────────────────────────────
interface FeatureDef {
  icon: string; badge: string; color: string;
  title: string; desc: string; detail: string;
  Mockup: () => React.JSX.Element; flip: boolean;
}

const FEATURES: FeatureDef[] = [
  {
    icon: "♾️", badge: "Unlimited Topics", color: "#34d399", flip: false,
    title: "No daily cap. Ever.",
    desc: "Free users hit a 2-topic limit every 45 minutes. Pro removes it entirely — ask about anything, any time, as many times as you want.",
    detail: "Perfect for deep study sessions, exam prep, or those 2am rabbit holes you can't stop following.",
    Mockup: UnlimitedMockup,
  },
  {
    icon: "🎧", badge: "Audio Narration", color: "#a855f7", flip: true,
    title: "Every explanation, in your ears.",
    desc: "Hit play on any level and hear a clear, natural voice walk you through it. Commuting, cooking, working out — learning doesn't stop.",
    detail: "Speed controls (1x, 1.5x, 2x), per-level playback, and a waveform that shows you where you are.",
    Mockup: AudioMockup,
  },
  {
    icon: "📄", badge: "PDF Export", color: "#fb923c", flip: false,
    title: "Take your knowledge offline.",
    desc: "Export any topic as a clean, formatted PDF — all five levels, fully organized. Save it, share it, annotate it, or print it.",
    detail: "One click. Yours forever. No watermarks, no paywalled content — your notes, your way.",
    Mockup: PDFMockup,
  },
  {
    icon: "💬", badge: "AI Follow-ups", color: "#38bdf8", flip: true,
    title: "Ask the follow-up you're thinking.",
    desc: "Something didn't land? Type a follow-up and the AI responds with full context from everything you just read — no starting over.",
    detail: "The AI remembers the level, the topic, and your current depth. It answers where you are, not from scratch.",
    Mockup: FollowupMockup,
  },
  {
    icon: "🏠", badge: "Private Study Rooms", color: "#f472b6", flip: false,
    title: "Study together in real time.",
    desc: "Create a private room, pick a topic, share the code. Watch your friends advance through levels live. Chat, react with emojis, stay in sync.",
    detail: "Built-in chat, level progress dots, emoji reactions on each level, and host controls to pace the group.",
    Mockup: StudyRoomMockup,
  },
  {
    icon: "🎤", badge: "Teach-Back", color: "#fbbf24", flip: true,
    title: "Prove you actually understood it.",
    desc: "The Feynman technique says the best test of understanding is teaching it. Record yourself explaining a topic — our AI grades it and shows you gaps.",
    detail: "Get a letter grade, a breakdown of what you nailed, and exactly what concepts you missed.",
    Mockup: TeachBackMockup,
  },
  {
    icon: "🛤️", badge: "Custom Learning Paths", color: "#6ee7b7", flip: false,
    title: "Design your own curriculum.",
    desc: "Chain topics into a learning path and work through them in order. Build a course on anything — quantum physics, personal finance, history of Rome.",
    detail: "Track your progress across the path, share it with others, and pick up right where you left off.",
    Mockup: PathsMockup,
  },
];

function FeatureSection({ f, i }: { f: FeatureDef; i: number }) {
  return (
    <motion.div
      className={`grid md:grid-cols-2 gap-12 lg:gap-20 items-center py-20 border-b border-white/[0.04] last:border-0`}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.85, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Text side */}
      <div className={f.flip ? "md:order-2" : ""}>
        <div className="flex items-center gap-2 mb-5">
          <span className="text-2xl">{f.icon}</span>
          <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold tracking-wider uppercase"
            style={{ background: `${f.color}15`, color: f.color, border: `1px solid ${f.color}30` }}>
            {f.badge}
          </span>
        </div>
        <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white mb-4 leading-tight">{f.title}</h3>
        <p className="text-white/50 font-sans text-lg leading-relaxed mb-4">{f.desc}</p>
        <p className="text-white/30 font-sans text-sm leading-relaxed">{f.detail}</p>
      </div>

      {/* Mockup side */}
      <div className={f.flip ? "md:order-1" : ""}>
        <motion.div
          whileInView={{ opacity: 1, scale: 1 }}
          initial={{ opacity: 0.5, scale: 0.96 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}
        >
          <f.Mockup />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ProPage() {
  const router = useRouter();
  const [annual, setAnnual] = useState(true);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  // Subtle parallax only — no fade-out
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  const proPrice = annual ? 40 : 60;
  const proMonthly = annual ? "3.33" : "5";

  // ── Pro subscription state ──
  const [isProUser, setIsProUser] = useState(false);
  const [proExpiry, setProExpiry] = useState<number | null>(null);
  const [proLegacy, setProLegacy] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);
  const [prefs, setPrefs] = useState({ emailDigest: true, autoAudio: false, streakReminder: true, newFeatures: true });

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
      if (typeof window !== "undefined") localStorage.setItem("tmi10_sub_prefs", JSON.stringify(next));
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

  const daysLeft = proExpiry ? Math.max(0, Math.ceil((proExpiry - Date.now()) / 86400000)) : (proLegacy ? Infinity : 0);
  const expiryDate = proExpiry ? new Date(proExpiry).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      <FloatingOrbs />

      <AnimatePresence>
        {cancelDone ? (
          <motion.section key="cancelled" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative min-h-screen flex items-center justify-center px-4">
            <div className="text-center max-w-md">
              <div className="text-4xl mb-4">✓</div>
              <h1 className="font-display text-3xl text-white mb-3">Subscription cancelled</h1>
              <p className="text-white/40 font-sans text-sm leading-relaxed">
                {expiryDate ? `You keep Pro access until ${expiryDate}.` : "Your Pro access has been removed. XP and streak are safe."}
              </p>
              <p className="text-white/20 text-xs font-sans mt-6">Redirecting home…</p>
            </div>
          </motion.section>

        ) : isProUser ? (
          // ── Active subscription dashboard (kept from original) ──────────────
          <motion.section key="sub-dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="relative px-4 pt-28 pb-20 max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-sans font-semibold tracking-[0.14em] uppercase"
                  style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "rgba(52,211,153,0.8)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px rgba(52,211,153,0.9)" }} />
                  Active subscription
                </div>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">
                Your Pro{" "}
                <span style={{ background: "linear-gradient(135deg, #34d399, #6ee7b7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  subscription
                </span>
              </h1>
              {proLegacy ? (
                <p className="text-white/35 font-sans text-sm mt-2">Lifetime Pro access · Never expires</p>
              ) : expiryDate ? (
                <p className="text-white/35 font-sans text-sm mt-2">
                  Expires {expiryDate}
                  {daysLeft <= 14 && daysLeft > 0 && <span className="ml-2 text-amber-400/70">· {daysLeft} days left</span>}
                  {daysLeft > 14 && <span className="ml-2 text-white/20">· {daysLeft} days remaining</span>}
                </p>
              ) : null}
            </motion.div>

            {/* Preferences */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 mb-4">
              <h3 className="font-display text-lg text-white mb-5">Preferences</h3>
              <div className="space-y-4">
                {[
                  { key: "emailDigest" as const, label: "Weekly digest", desc: "Summary of your learning week" },
                  { key: "autoAudio" as const, label: "Auto-play audio", desc: "Start narration automatically" },
                  { key: "streakReminder" as const, label: "Streak reminders", desc: "Don't lose your streak" },
                  { key: "newFeatures" as const, label: "New features", desc: "Be first to know" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-sans font-medium">{label}</p>
                      <p className="text-white/30 text-xs font-sans">{desc}</p>
                    </div>
                    <Toggle enabled={prefs[key]} onToggle={() => togglePref(key)} />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Extend / Cancel */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid sm:grid-cols-2 gap-4">
              <button onClick={() => router.push("/checkout?plan=annual")}
                className="py-3.5 rounded-xl font-sans text-sm font-medium"
                style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)", color: "rgba(52,211,153,0.8)" }}>
                Extend Pro →
              </button>
              {!proLegacy && (
                <button onClick={() => setShowCancelConfirm(true)}
                  className="py-3.5 rounded-xl font-sans text-sm text-white/25 hover:text-red-400/60 border border-white/[0.06] hover:border-red-500/20 transition-all">
                  Cancel subscription
                </button>
              )}
            </motion.div>

            <AnimatePresence>
              {showCancelConfirm && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-4 p-5 rounded-2xl border border-red-500/20 bg-red-500/[0.04]">
                  <p className="text-white/60 text-sm font-sans mb-4">
                    Are you sure? You&apos;ll keep Pro access until {expiryDate ?? "expiry"}, then drop to free. Your XP, streak, and history are never deleted.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={handleCancelSubscription} className="px-5 py-2 rounded-xl text-sm font-sans text-red-400/70 border border-red-500/25 hover:bg-red-500/10 transition-all">
                      Yes, cancel
                    </button>
                    <button onClick={() => setShowCancelConfirm(false)} className="px-5 py-2 rounded-xl text-sm font-sans text-white/40 border border-white/[0.08] hover:border-white/15 transition-all">
                      Keep Pro
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Flash Plans (also shown to Pro subscribers) ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-white/[0.05]" />
                <span className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-white/25">Flash add-ons</span>
                <div className="h-px flex-1 bg-white/[0.05]" />
              </div>
              <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(245,158,11,0.12)", backgroundColor: "rgba(245,158,11,0.03)" }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                      style={{ backgroundColor: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}>⚡</div>
                    <div>
                      <p className="text-sm font-sans font-bold text-white">Flash Plans</p>
                      <p className="text-[11px] font-sans text-white/35">Separate from TM10 Pro · power up Flash specifically</p>
                    </div>
                  </div>
                </div>
                {[
                  { label: "Flash Pro", limit: "25 / day", price: "$3.50/mo", color: "#f59e0b", rgb: "245,158,11", features: ["Science, History & Code Flash", "Flash history saved", "No hourly caps"] },
                  { label: "Flash Executive", limit: "190 / 12h", price: "$12/mo", color: "#818cf8", rgb: "129,140,248", features: ["Everything in Flash Pro", "Extreme volume access", "Power-user tier"] },
                ].map((tier, i) => (
                  <div key={tier.label} className={i > 0 ? "border-t" : ""} style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <div className="px-5 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-sans font-bold" style={{ color: tier.color }}>{tier.label}</span>
                          <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `rgba(${tier.rgb},0.12)`, color: tier.color, border: `1px solid rgba(${tier.rgb},0.2)` }}>
                            {tier.limit}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          {tier.features.map(f => (
                            <span key={f} className="text-[11px] font-sans text-white/35">· {f}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-sans font-bold" style={{ color: tier.color }}>{tier.price}</span>
                        <button onClick={() => { window.location.href = "/flash/upgrade"; }}
                          className="px-3.5 py-1.5 rounded-lg text-[11px] font-sans font-bold transition-all duration-200 hover:scale-105"
                          style={{ backgroundColor: `rgba(${tier.rgb},0.12)`, color: tier.color, border: `1px solid rgba(${tier.rgb},0.2)` }}>
                          Get →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="px-5 py-3 flex items-center gap-2"
                  style={{ backgroundColor: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-[11px] font-sans text-white/25">Independent of TM10 Pro · cancel anytime · 7-day refund</span>
                </div>
              </div>
            </motion.div>
          </motion.section>

        ) : (
          // ── Marketing page ─────────────────────────────────────────────────
          <>
          {/* ── HERO ── */}
          <section ref={heroRef} className="relative min-h-screen flex items-center px-4 overflow-hidden">
            {/* Background glow — scales on scroll */}
            <motion.div className="absolute inset-0 pointer-events-none" style={{ scale: bgScale }}>
              <div style={{ background: "radial-gradient(ellipse 70% 55% at 55% 50%, rgba(52,211,153,0.1) 0%, transparent 65%)", position: "absolute", inset: 0 }} />
            </motion.div>

            {/* Slow orbit rings */}
            <motion.div className="absolute pointer-events-none rounded-full" style={{ width: 560, height: 560, top: "50%", left: "52%", x: "-50%", y: "-50%", border: "1px solid rgba(52,211,153,0.05)" }} animate={{ rotate: 360 }} transition={{ duration: 34, repeat: Infinity, ease: "linear" }} />
            <motion.div className="absolute pointer-events-none rounded-full" style={{ width: 800, height: 800, top: "50%", left: "52%", x: "-50%", y: "-50%", border: "1px solid rgba(52,211,153,0.025)" }} animate={{ rotate: -360 }} transition={{ duration: 56, repeat: Infinity, ease: "linear" }} />

            {/* Two-column layout */}
            <motion.div style={{ y: heroY }} className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-0">

              {/* ── LEFT: text ── */}
              <div className="flex-1 text-left max-w-xl lg:pr-8">

                {/* Badge */}
                <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-7"
                  style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.18)" }}
                  initial={{ opacity: 0, y: -16, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span className="text-emerald-400 text-xs font-sans font-medium tracking-wide">Now available — Pro Plan</span>
                </motion.div>

                {/* Headline — char-split with 3D rotateX + blur */}
                <h1 className="font-display text-6xl sm:text-7xl lg:text-[80px] mb-5 leading-[0.92] tracking-tight" style={{ perspective: "600px" }}>
                  <div className="block text-white overflow-hidden">
                    <SplitChars text="Learn without" delay={0.1} />
                  </div>
                  <div className="block overflow-hidden">
                    <SplitChars text="limits." delay={0.38} gradient />
                  </div>
                </h1>

                {/* Subhead — word-by-word */}
                <motion.p className="text-lg text-white/35 font-sans leading-relaxed mb-8 max-w-md"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.85, ease: [0.32, 0.72, 0, 1] }}>
                  Everything you love about TMI10 — fully unlocked. Unlimited depth, audio, exports, study rooms, and tools that turn curiosity into mastery.
                </motion.p>

                {/* Stats strip */}
                <motion.div className="flex flex-wrap gap-5 mb-9 text-sm">
                  {[["7 Pro features","unlocked"],["∞ topics","per day"],["$3.33","per month"],["0 data","ever deleted"]].map(([val, label], i) => (
                    <motion.div key={val} className="text-left"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.9 + i * 0.07, ease: [0.32, 0.72, 0, 1] }}>
                      <p className="font-display text-lg text-white">{val}</p>
                      <p className="text-white/22 font-sans text-[11px]">{label}</p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTAs */}
                <motion.div className="flex flex-col sm:flex-row gap-3"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.1, ease: [0.32, 0.72, 0, 1] }}>
                  <motion.button onClick={() => router.push("/checkout?plan=annual")}
                    className="group relative px-8 py-4 rounded-xl font-sans font-semibold text-sm overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.16 }}>
                    <span className="relative z-10 text-black">Get Pro — from $3.33/mo</span>
                    <motion.div className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)" }}
                      animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2.2, repeat: Infinity, ease: "linear", repeatDelay: 2 }} />
                  </motion.button>
                  <motion.button onClick={() => router.push("/")}
                    className="px-8 py-4 rounded-xl border border-white/10 text-white/45 hover:text-white/75 hover:border-white/20 font-sans text-sm transition-all"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    Keep Free Plan
                  </motion.button>
                </motion.div>
              </div>

              {/* ── RIGHT: Sparky 3D figurine ── */}
              <motion.div
                className="relative flex-shrink-0 w-[300px] h-[380px] sm:w-[340px] sm:h-[420px] lg:w-[380px] lg:h-[480px]"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
              >
                {/* Glow behind figurine */}
                <div className="absolute inset-0 pointer-events-none rounded-full"
                  style={{ background: "radial-gradient(ellipse 70% 60% at 50% 55%, rgba(52,211,153,0.18) 0%, transparent 70%)" }} />
                <SparkyCanvas className="w-full h-full" />
              </motion.div>
            </motion.div>

            {/* Scroll cue */}
            <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2" animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <div className="w-5 h-8 rounded-full border border-white/12 flex items-start justify-center pt-1.5">
                <div className="w-1 h-2 rounded-full bg-white/25" />
              </div>
            </motion.div>
          </section>

          {/* ── MARQUEE ── */}
          <Marquee />

          {/* ── FEATURE SHOWCASE ── */}
          <section className="py-16 px-4">
            <div className="max-w-5xl mx-auto">
              <motion.div className="text-center mb-20"
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                <p className="font-mono text-[10px] tracking-[0.3em] text-emerald-400/60 uppercase mb-4">Pro Features</p>
                <h2 className="font-display text-4xl sm:text-6xl text-white mb-5 leading-tight">
                  Every feature,<br />
                  <span style={{ background: "linear-gradient(135deg, #34d399, #6ee7b7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    up close.
                  </span>
                </h2>
                <p className="text-white/35 font-sans text-lg max-w-lg mx-auto">
                  Here&apos;s exactly what unlocks the moment you go Pro — no vague promises, just the real thing.
                </p>
              </motion.div>

              {FEATURES.map((f, i) => (
                <FeatureSection key={f.badge} f={f} i={i} />
              ))}
            </div>
          </section>

          {/* ── PRICING ── */}
          <section id="pricing" className="py-24 px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div className="text-center mb-14"
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="font-display text-4xl sm:text-5xl text-white mb-4">Simple, honest pricing</h2>
                <p className="text-white/40 font-sans text-lg mb-8">No dark patterns. No hidden fees. Cancel anytime.</p>
                <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.07]">
                  {[["Monthly", false],["Annual", true]].map(([label, val]) => (
                    <button key={label as string} onClick={() => setAnnual(val as boolean)}
                      className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-sans font-medium"
                      style={{ background: annual === val ? "rgba(255,255,255,0.1)" : "transparent", color: annual === val ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.38)", transition: "all 0.35s cubic-bezier(0.23,1,0.32,1)" }}>
                      {label}
                      {val && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }}>−33%</span>}
                    </button>
                  ))}
                </div>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
                {/* Free */}
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ease: [0.23, 1, 0.32, 1] }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 flex flex-col">
                  <p className="text-white/30 text-xs font-sans uppercase tracking-[0.16em] mb-4">Free</p>
                  <div className="flex items-end gap-1 mb-2"><span className="font-display text-5xl text-white">$0</span></div>
                  <p className="text-white/25 text-sm font-sans mb-8">Forever. No card required.</p>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {["2 topics per 45 min","All 5 explanation levels","Streak & XP system","40+ languages","Quiz battles & games","Daily challenges"].map(f => (
                      <li key={f} className="flex items-center gap-3 text-sm font-sans text-white/55">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                          <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5l1.8 1.8L6 1.5" stroke="#34d399" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => router.push("/")} className="w-full py-3 rounded-xl border border-white/[0.1] text-white/40 font-sans text-sm hover:text-white/70 hover:border-white/20 transition-all">
                    Start free
                  </button>
                </motion.div>

                {/* Pro */}
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
                  className="relative rounded-2xl flex flex-col overflow-hidden"
                  style={{ padding: "1.5px", background: "linear-gradient(140deg, rgba(52,211,153,0.5) 0%, rgba(52,211,153,0.08) 50%, rgba(52,211,153,0.35) 100%)" }}>
                  <div className="rounded-[15px] h-full p-8 flex flex-col" style={{ background: "#040d09" }}>
                    <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-30"
                      style={{ backgroundImage: "radial-gradient(rgba(52,211,153,0.4) 1px, transparent 1px)", backgroundSize: "16px 16px", maskImage: "radial-gradient(ellipse at 100% 0%, black 0%, transparent 65%)" }} />
                    <p className="text-emerald-400/60 text-xs font-sans uppercase tracking-[0.16em] mb-4">Pro</p>
                    <div className="flex items-end gap-1 mb-1">
                      <AnimatePresence mode="wait">
                        <motion.span key={proMonthly} className="font-display text-5xl text-white"
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                          ${proMonthly}
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-white/35 text-sm font-sans mb-1.5">/mo</span>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.p key={annual ? "annual" : "monthly"} className="text-white/35 text-sm font-sans mb-8"
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                        {annual ? `Billed $${proPrice}/year` : "Billed monthly"}
                      </motion.p>
                    </AnimatePresence>
                    <ul className="space-y-2.5 mb-8 flex-1">
                      {["Everything in Free","Unlimited topics daily","🎧 Audio narration","📄 PDF export","💬 AI follow-up questions","🛤️ Custom learning paths","🎤 Teach-back AI grading","🔒 Private study rooms","Full XP shop","Analytics dashboard"].map((f, i) => (
                        <motion.li key={f} className="flex items-center gap-3 text-sm font-sans text-white/72"
                          initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                          transition={{ delay: 0.25 + i * 0.038, ease: [0.23, 1, 0.32, 1] }}>
                          <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.28)" }}>
                            <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5l1.8 1.8L6 1.5" stroke="#34d399" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                          {f}
                        </motion.li>
                      ))}
                    </ul>
                    <motion.button onClick={() => router.push(`/checkout?plan=${annual ? "annual" : "monthly"}`)}
                      className="relative w-full py-3.5 rounded-xl font-sans font-semibold text-sm overflow-hidden text-black"
                      style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}>
                      <motion.div className="absolute inset-0 pointer-events-none"
                        style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)" }}
                        animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }} />
                      <span className="relative z-10">Get Pro</span>
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── FEATURE COMPARISON ── */}
          <section className="py-16 px-4">
            <div className="max-w-3xl mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
                <h2 className="font-display text-3xl sm:text-4xl text-white mb-3">Compare plans</h2>
                <p className="text-white/35 font-sans">Every detail, side by side.</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <div className="grid grid-cols-[1fr_100px_100px] px-3 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                  <span className="text-xs font-sans text-white/30 uppercase tracking-widest">Feature</span>
                  <span className="text-xs font-sans text-white/30 uppercase tracking-widest text-center">Free</span>
                  <span className="text-xs font-sans text-emerald-400 uppercase tracking-widest text-center">Pro</span>
                </div>
                <div className="px-2 py-2 space-y-0.5">
                  <p className="text-[10px] font-sans text-white/20 uppercase tracking-widest px-3 pt-4 pb-2">Core Learning</p>
                  <Feat label="Topics per 45 min" free="2 topics" pro="Unlimited" />
                  <Feat label="All 5 explanation levels" free pro />
                  <Feat label="40+ language support" free pro />
                  <Feat label="Audio explanations" free={false} pro />
                  <Feat label="PDF export" free={false} pro />
                  <Feat label="AI follow-up questions" free={false} pro />
                  <Feat label="Teach-back AI grading" free={false} pro />
                  <p className="text-[10px] font-sans text-white/20 uppercase tracking-widest px-3 pt-6 pb-2">Modes & Games</p>
                  <Feat label="Quiz Battle, Speed Run, Spot Errors" free pro />
                  <Feat label="Debate & Time Machine" free pro />
                  <Feat label="Blackjack (XP betting)" free pro />
                  <Feat label="Custom Learning Paths" free={false} pro />
                  <Feat label="Private Study Rooms" free={false} pro />
                  <p className="text-[10px] font-sans text-white/20 uppercase tracking-widest px-3 pt-6 pb-2">XP & Gamification</p>
                  <Feat label="XP & streak system" free pro />
                  <Feat label="Basic XP shop" free pro />
                  <Feat label="Full shop — all perks" free={false} pro />
                  <Feat label="Global leaderboard" free pro />
                  <p className="text-[10px] font-sans text-white/20 uppercase tracking-widest px-3 pt-6 pb-2">Profile & Analytics</p>
                  <Feat label="Progress solar system" free pro />
                  <Feat label="Full analytics dashboard" free={false} pro />
                  <Feat label="Priority support" free={false} pro />
                </div>
              </motion.div>
            </div>
          </section>

          {/* ── TESTIMONIALS ── */}
          <section className="py-16 px-4">
            <div className="max-w-5xl mx-auto">
              <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="font-display text-3xl sm:text-4xl text-white text-center mb-14">
                Built for the relentlessly curious
              </motion.h2>
              <div className="grid sm:grid-cols-3 gap-5">
                {[
                  { quote: "I learned more about quantum physics in one evening than I did in a semester. The 5-level system is genius.", name: "Alex M.", role: "Software engineer" },
                  { quote: "My students actually want to use it. The streak system keeps them coming back without me having to chase them.", name: "Sarah K.", role: "High school teacher" },
                  { quote: "I use it to prep for meetings on topics I know nothing about. Level 3 is my sweet spot — fast and actually useful.", name: "James L.", role: "Product manager" },
                ].map((t, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-emerald-500/20 hover:bg-emerald-500/[0.03] transition-all duration-300">
                    <p className="text-emerald-400 text-xl mb-4">&ldquo;</p>
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
          <section className="py-16 px-4">
            <div className="max-w-2xl mx-auto">
              <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="font-display text-3xl sm:text-4xl text-white text-center mb-12">Questions</motion.h2>
              <FAQList />
            </div>
          </section>

          {/* ── FINAL CTA ── */}
          <section className="py-28 px-4">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center relative">
              <div className="absolute inset-0 blur-[80px] bg-emerald-500/10 rounded-full pointer-events-none" />
              <p className="text-emerald-400 text-xs font-sans uppercase tracking-widest mb-5">Ready?</p>
              <h2 className="font-display text-4xl sm:text-6xl text-white mb-6 leading-tight">
                Start learning<br />without limits.
              </h2>
              <p className="text-white/35 font-sans mb-10 text-lg">Join thousands of learners going deeper every day.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => router.push("/checkout?plan=annual")}
                  className="group relative px-8 py-4 rounded-xl font-sans font-semibold text-sm overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }}>
                  <span className="relative z-10 text-black">Get Pro — from $3.33/mo</span>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button onClick={() => router.push("/")}
                  className="px-8 py-4 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 font-sans text-sm transition-all">
                  Try it free first
                </button>
              </div>
            </motion.div>
          </section>

          <div className="h-24" />

          {/* ── Flash Plans section ── */}
          <section className="max-w-2xl mx-auto px-4 pb-20">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-white/[0.05]" />
                <span className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-white/25">Also available</span>
                <div className="h-px flex-1 bg-white/[0.05]" />
              </div>

              <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(245,158,11,0.12)", backgroundColor: "rgba(245,158,11,0.03)" }}>
                {/* Header */}
                <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                      style={{ backgroundColor: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}>⚡</div>
                    <div>
                      <p className="text-sm font-sans font-bold text-white">Flash Plans</p>
                      <p className="text-[11px] font-sans text-white/35">Separate from TM10 Pro — power up Flash specifically</p>
                    </div>
                  </div>
                </div>

                {/* Two tier rows */}
                {[
                  { label: "Flash Pro", limit: "25 / day", price: "$3.50/mo", color: "#f59e0b", rgb: "245,158,11", features: ["Science, History & Code Flash", "Flash history saved", "No hourly caps"] },
                  { label: "Flash Executive", limit: "190 / 12h", price: "$12/mo", color: "#818cf8", rgb: "129,140,248", features: ["Everything in Pro", "Extreme volume access", "Power-user tier"] },
                ].map((tier, i) => (
                  <div key={tier.label} className={i > 0 ? "border-t" : ""} style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <div className="px-5 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-sans font-bold" style={{ color: tier.color }}>{tier.label}</span>
                          <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `rgba(${tier.rgb},0.12)`, color: tier.color, border: `1px solid rgba(${tier.rgb},0.2)` }}>
                            {tier.limit}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          {tier.features.map(f => (
                            <span key={f} className="text-[11px] font-sans text-white/35">· {f}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-sans font-bold" style={{ color: tier.color }}>{tier.price}</span>
                        <button onClick={() => window.location.href = "/flash/upgrade"}
                          className="px-3.5 py-1.5 rounded-lg text-[11px] font-sans font-bold transition-all duration-200 hover:scale-105"
                          style={{ backgroundColor: `rgba(${tier.rgb},0.12)`, color: tier.color, border: `1px solid rgba(${tier.rgb},0.2)` }}>
                          Get →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Footer */}
                <div className="px-5 py-3 flex items-center gap-2"
                  style={{ backgroundColor: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-[11px] font-sans text-white/25">Independent of TM10 Pro · cancel anytime · 7-day refund</span>
                </div>
              </div>
            </motion.div>
          </section>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── FAQ accordion ─────────────────────────────────────────────────────────────
const FAQS = [
  { q: "Will the free plan get worse over time?", a: "No. The free plan is free forever and won't be downgraded. Pro is for people who want more — not a tax on what you already have." },
  { q: "What happens to my XP and progress if I upgrade?", a: "Everything carries over. Your streak, XP, shop purchases, topic history — all intact. Pro just unlocks more on top." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from your Pro settings. You keep Pro access until the end of your billing period, then drop to the free plan with no data loss." },
  { q: "Is there a student discount?", a: "Yes — reach out with a student email and we'll set you up with 50% off Pro." },
  { q: "Do you offer refunds?", a: "Yes, within 7 days of purchase, no questions asked." },
];

function FAQList() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {FAQS.map(({ q, a }, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
          className="rounded-xl border border-white/[0.06] overflow-hidden">
          <button onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors">
            <span className="text-sm font-sans font-medium text-white/80">{q}</span>
            <motion.span animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.2 }} className="text-white/30 text-xl leading-none shrink-0 ml-4">+</motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
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
