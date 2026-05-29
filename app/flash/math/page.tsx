"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import {
  getFlashUsageState,
  recordFlashUsage,
  type FlashUsageState,
} from "@/lib/flash-limits";
import { saveFlashToHistory } from "@/lib/flash-history";

// ─── Math sections ────────────────────────────────────────────────────────────
const MATH_SECTIONS = [
  { key: "hook",       num: "01", label: "Wild Fact",        sub: "The thing that changes how you see it", emoji: "🤯", color: "#f59e0b", rgb: "245,158,11",  style: "hero"     },
  { key: "concept",    num: "02", label: "The Core Idea",    sub: "Made simple, no jargon",                emoji: "🎯", color: "#34d399", rgb: "52,211,153",  style: "left"     },
  { key: "steps",      num: "03", label: "Step by Step",     sub: "The method, broken down",               emoji: "📋", color: "#818cf8", rgb: "129,140,248", style: "right"    },
  { key: "example",    num: "04", label: "Worked Example",   sub: "Real numbers, real work",               emoji: "✏️", color: "#38bdf8", rgb: "56,189,248",  style: "left"     },
  { key: "whyMatters", num: "05", label: "Why It Matters",   sub: "Where this shows up in real life",      emoji: "🌍", color: "#fb7185", rgb: "251,113,133", style: "right"    },
  { key: "practice",   num: "06", label: "Practice",         sub: "Try them in the notebook below",        emoji: "📝", color: "#c084fc", rgb: "192,132,252", style: "practice" },
  { key: "remember",   num: "07", label: "Remember This",    sub: "The key insight",                       emoji: "✨", color: "#f59e0b", rgb: "245,158,11",  style: "hero"     },
] as const;

type MathSectionKey = (typeof MATH_SECTIONS)[number]["key"];
type MathData = Record<Exclude<MathSectionKey, "practice">, string> & { practice: string[] };

const MATH_PLACEHOLDERS = [
  "Pythagorean theorem…", "derivatives…", "compound interest…",
  "prime numbers…", "Bayes' theorem…", "the Fibonacci sequence…",
  "logarithms…", "matrix multiplication…",
];

const LOAD_STAGES = ["Analyzing the math…", "Working through the steps…", "Building your notebook…"];

// ─── Cooldown ─────────────────────────────────────────────────────────────────
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
  return <span className="font-mono" style={{ color: "#818cf8" }}>{t}</span>;
}

// ─── Scroll progress ──────────────────────────────────────────────────────────
function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div className="fixed top-0 left-0 right-0 h-[2px] origin-left z-50"
      style={{ scaleX, background: "linear-gradient(90deg, #818cf8, #a78bfa, #818cf8)" }} />
  );
}

// ─── Section nav dots ─────────────────────────────────────────────────────────
function SectionNav({ active }: { active: string }) {
  return (
    <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-3 z-40">
      {MATH_SECTIONS.map((s) => (
        <button key={s.key}
          onClick={() => document.getElementById(`msec-${s.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
          className="group flex items-center gap-2 justify-end">
          <AnimatePresence>
            {active === s.key && (
              <motion.span initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 4 }}
                className="text-[10px] font-sans font-semibold uppercase tracking-wider" style={{ color: s.color }}>
                {s.label}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.div animate={{ width: active === s.key ? 20 : 6, opacity: active === s.key ? 1 : 0.3, backgroundColor: active === s.key ? s.color : "#ffffff" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="h-[6px] rounded-full" />
        </button>
      ))}
    </div>
  );
}

// ─── Hero card ────────────────────────────────────────────────────────────────
function HeroCard({ section, data }: { section: typeof MATH_SECTIONS[number]; data: string }) {
  return (
    <motion.div id={`msec-${section.key}`}
      initial={{ opacity: 0, scale: 0.96, y: 32, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl px-8 py-10 sm:px-12 sm:py-14"
      style={{ background: `radial-gradient(ellipse 80% 60% at 20% 40%, rgba(${section.rgb},0.1) 0%, transparent 60%), rgba(${section.rgb},0.04)`, border: `1px solid rgba(${section.rgb},0.18)` }}>

      <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="absolute top-6 right-8 font-sans font-black select-none pointer-events-none"
        style={{ fontSize: "clamp(60px,10vw,100px)", color: `rgba(${section.rgb},0.07)`, lineHeight: 1, letterSpacing: "-0.04em" }}>
        {section.num}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.5 }} className="flex items-center gap-2 mb-6">
        <span className="text-xl">{section.emoji}</span>
        <span className="text-xs font-sans font-bold uppercase tracking-[0.18em]" style={{ color: section.color }}>
          {section.num} · {section.label}
        </span>
      </motion.div>

      <div className="font-sans font-black leading-none mb-3 select-none" style={{ fontSize: 64, color: `rgba(${section.rgb},0.2)`, lineHeight: 0.8 }}>"</div>

      <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="font-sans font-bold text-2xl sm:text-3xl leading-[1.35] text-white/90">
        {data}
      </motion.p>

      <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 h-px origin-left"
        style={{ background: `linear-gradient(90deg, rgba(${section.rgb},0.5), transparent)` }} />
    </motion.div>
  );
}

// ─── Regular card ─────────────────────────────────────────────────────────────
function RegularCard({ section, data }: { section: typeof MATH_SECTIONS[number]; data: string }) {
  const fromLeft = section.style === "left";
  // Format example with → arrows and line breaks
  const formattedData = section.key === "example"
    ? data.replace(/\s*->\s*/g, "\n  → ")
    : data;

  return (
    <motion.div id={`msec-${section.key}`}
      initial={{ opacity: 0, x: fromLeft ? -28 : 28, y: 28, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex gap-0 rounded-2xl overflow-hidden"
      style={{ border: `1px solid rgba(${section.rgb},0.12)`, backgroundColor: `rgba(${section.rgb},0.04)` }}>

      <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-1 shrink-0 origin-top rounded-l-2xl"
        style={{ background: `linear-gradient(180deg, ${section.color}, rgba(${section.rgb},0.3))` }} />

      <div className="flex-1 px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div initial={{ scale: 0, rotate: -10 }} whileInView={{ scale: 1, rotate: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 20 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ backgroundColor: `rgba(${section.rgb},0.12)`, border: `1px solid rgba(${section.rgb},0.22)` }}>
              {section.emoji}
            </motion.div>
            <div>
              <p className="text-xs font-sans font-bold uppercase tracking-[0.16em]" style={{ color: section.color }}>{section.label}</p>
              <p className="text-[11px] text-white/30 font-sans mt-0.5">{section.sub}</p>
            </div>
          </div>
          <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="font-sans font-black text-4xl shrink-0 leading-none select-none"
            style={{ color: `rgba(${section.rgb},0.1)`, letterSpacing: "-0.04em" }}>
            {section.num}
          </motion.span>
        </div>

        <motion.pre initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-[15px] sm:text-base leading-[1.8] text-white/75 font-sans whitespace-pre-wrap break-words">
          {formattedData}
        </motion.pre>
      </div>
    </motion.div>
  );
}

// ─── Practice card ────────────────────────────────────────────────────────────
function PracticeCard({ section, problems }: { section: typeof MATH_SECTIONS[number]; problems: string[] }) {
  return (
    <motion.div id={`msec-${section.key}`}
      initial={{ opacity: 0, y: 32, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl overflow-hidden"
      style={{ border: `1px solid rgba(${section.rgb},0.18)`, backgroundColor: `rgba(${section.rgb},0.05)` }}>

      {/* Header */}
      <div className="px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b" style={{ borderColor: `rgba(${section.rgb},0.12)` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
              transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 20 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ backgroundColor: `rgba(${section.rgb},0.15)`, border: `1px solid rgba(${section.rgb},0.25)` }}>
              📝
            </motion.div>
            <div>
              <p className="text-xs font-sans font-bold uppercase tracking-[0.16em]" style={{ color: section.color }}>06 · Practice Problems</p>
              <p className="text-[11px] text-white/30 font-sans mt-0.5">Use the notebook below ↓</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider"
            style={{ backgroundColor: "rgba(192,132,252,0.12)", color: "#c084fc", border: "1px solid rgba(192,132,252,0.2)" }}>
            3 problems
          </span>
        </div>
      </div>

      {/* Problems */}
      <div className="px-6 sm:px-8 py-5 flex flex-col gap-4">
        {problems.map((problem, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-sans font-black"
              style={{ backgroundColor: `rgba(${section.rgb},0.15)`, color: section.color }}>
              {i + 1}
            </div>
            <p className="text-[15px] font-sans text-white/80 leading-relaxed pt-0.5">{problem}</p>
          </motion.div>
        ))}
      </div>

      {/* Notebook hint */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="mx-6 sm:mx-8 mb-5 px-4 py-2.5 rounded-xl flex items-center gap-2"
        style={{ backgroundColor: "rgba(192,132,252,0.07)", border: "1px dashed rgba(192,132,252,0.2)" }}>
        <span className="text-sm">✏️</span>
        <p className="text-[11px] font-sans text-white/35">Scroll down to solve these in your practice notebook</p>
      </motion.div>
    </motion.div>
  );
}

// ─── Canvas Notebook ──────────────────────────────────────────────────────────
const PEN_COLORS = [
  { color: "rgba(255,255,255,0.9)", label: "White" },
  { color: "#f59e0b",              label: "Amber"  },
  { color: "#818cf8",              label: "Indigo" },
];
const PEN_SIZES = [2, 4, 7];

function FlashNotebook() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [penColor, setPenColor] = useState(PEN_COLORS[0].color);
  const [penSize, setPenSize] = useState(1); // index into PEN_SIZES
  const [isDrawing, setIsDrawing] = useState(false);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const pts = useRef<{ x: number; y: number }[]>([]);
  const dpr = useRef(1);

  // Draw lined-paper background onto canvas
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = "#0c0e14";
    ctx.fillRect(0, 0, w, h);

    // Horizontal rules every 32px
    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    ctx.lineWidth = 1;
    for (let y = 48; y < h; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Red margin line
    ctx.strokeStyle = "rgba(251,113,133,0.18)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(54, 0); ctx.lineTo(54, h); ctx.stroke();

    // Header line
    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(w, 40); ctx.stroke();
  }, []);

  // Init canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    dpr.current = window.devicePixelRatio || 1;
    const { width, height } = container.getBoundingClientRect();
    canvas.width = width * dpr.current;
    canvas.height = height * dpr.current;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr.current, dpr.current);
    drawBackground(ctx, width, height);
  }, [drawBackground]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack((prev) => [...prev.slice(-9), img]);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    saveState();
    setIsDrawing(true);
    pts.current = [getPos(e)];
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const newPt = getPos(e);
    pts.current.push(newPt);
    const p = pts.current;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = PEN_SIZES[penSize];
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (p.length === 2) {
      ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y); ctx.lineTo(p[1].x, p[1].y); ctx.stroke();
    } else if (p.length > 2) {
      const i = p.length - 1;
      const mid1x = (p[i - 2].x + p[i - 1].x) / 2;
      const mid1y = (p[i - 2].y + p[i - 1].y) / 2;
      const mid2x = (p[i - 1].x + p[i].x) / 2;
      const mid2y = (p[i - 1].y + p[i].y) / 2;
      ctx.beginPath(); ctx.moveTo(mid1x, mid1y);
      ctx.quadraticCurveTo(p[i - 1].x, p[i - 1].y, mid2x, mid2y);
      ctx.stroke();
    }
  };

  const onPointerUp = () => { setIsDrawing(false); pts.current = []; };

  const undo = () => {
    if (!undoStack.length) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const last = undoStack[undoStack.length - 1];
    ctx.putImageData(last, 0, 0);
    setUndoStack((prev) => prev.slice(0, -1));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(ctx, width, height);
    setUndoStack([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl overflow-hidden"
      style={{ border: "1px solid rgba(129,140,248,0.2)", boxShadow: "0 0 60px rgba(129,140,248,0.06)" }}>

      {/* Notebook toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ backgroundColor: "rgba(12,14,20,0.9)", borderColor: "rgba(255,255,255,0.06)" }}>

        {/* Left: branding */}
        <div className="flex items-center gap-3">
          <span className="text-sm">📒</span>
          <div>
            <p className="text-xs font-sans font-bold text-white/70">Practice Notebook</p>
            <p className="text-[10px] font-sans text-white/25">Pen · smooth drawing · Flash exclusive</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-sans font-black uppercase tracking-wider"
            style={{ backgroundColor: "rgba(129,140,248,0.12)", color: "#818cf8", border: "1px solid rgba(129,140,248,0.2)" }}>
            ⚡ Flash Exclusive
          </span>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-3">
          {/* Pen size */}
          <div className="flex items-center gap-1.5">
            {PEN_SIZES.map((_, i) => (
              <button key={i} onClick={() => setPenSize(i)}
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-150"
                style={{ backgroundColor: penSize === i ? "rgba(255,255,255,0.1)" : "transparent" }}>
                <div className="rounded-full bg-white/70"
                  style={{ width: 4 + i * 3, height: 4 + i * 3, opacity: penSize === i ? 1 : 0.35 }} />
              </button>
            ))}
          </div>

          {/* Pen color */}
          <div className="flex items-center gap-1.5">
            {PEN_COLORS.map(({ color }) => (
              <button key={color} onClick={() => setPenColor(color)}
                className="w-5 h-5 rounded-full transition-all duration-150"
                style={{
                  backgroundColor: color,
                  outline: penColor === color ? `2px solid ${color}` : "none",
                  outlineOffset: 2,
                  opacity: penColor === color ? 1 : 0.4,
                }} />
            ))}
          </div>

          {/* Undo */}
          <button onClick={undo} disabled={!undoStack.length}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-sans text-white/40 hover:text-white/70 transition-colors disabled:opacity-20">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M2 5.5C2 3.57 3.57 2 5.5 2c1.2 0 2.26.6 2.9 1.5M2 5.5H4M2 5.5V3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Undo
          </button>

          {/* Clear */}
          <button onClick={clear}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-sans transition-colors"
            style={{ backgroundColor: "rgba(251,113,133,0.08)", color: "rgba(251,113,133,0.6)", border: "1px solid rgba(251,113,133,0.15)" }}>
            Clear
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="relative w-full" style={{ height: "420px" }}
        onContextMenu={(e) => e.preventDefault()}>
        <canvas ref={canvasRef}
          className="absolute inset-0 touch-none"
          style={{ cursor: "crosshair", width: "100%", height: "100%" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />

        {/* Placeholder hint (disappears on first draw) */}
        {undoStack.length === 0 && !isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-[13px] font-sans text-white/15">✏️  Start writing to solve the problems above</p>
              <p className="text-[11px] font-sans text-white/10 mt-1">Use a stylus, trackpad, or mouse</p>
            </div>
          </div>
        )}
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
    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <div className="relative mb-10">
        {[1, 2, 3].map((i) => (
          <motion.div key={i} className="absolute inset-0 rounded-2xl"
            style={{ border: `1px solid rgba(129,140,248,${0.25 / i})`, scale: 1 + i * 0.35 }}
            animate={{ opacity: [0.7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35, ease: "easeOut" }} />
        ))}
        <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl z-10"
          style={{ background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.3)", boxShadow: "0 0 40px rgba(129,140,248,0.15)" }}>
          📐
        </div>
      </div>
      <p className="text-white/40 text-sm font-sans mb-1">Solving</p>
      <p className="font-sans font-black text-xl text-white text-center mb-10" style={{ letterSpacing: "-0.02em" }}>"{topic}"</p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {LOAD_STAGES.map((label, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: stage >= i ? 1 : 0.25, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }} className="flex items-center gap-3">
            <motion.div animate={{ backgroundColor: stage > i ? "#818cf8" : stage === i ? "rgba(129,140,248,0.3)" : "rgba(255,255,255,0.06)", scale: stage === i ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.4, repeat: stage === i ? Infinity : 0, repeatDelay: 0.8 }}
              className="w-2 h-2 rounded-full shrink-0" />
            <span className={`text-sm font-sans transition-colors duration-300 ${stage >= i ? "text-white/70" : "text-white/20"}`}>{label}</span>
            {stage > i && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }} className="text-xs" style={{ color: "#818cf8" }}>✓</motion.span>}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MathFlashPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ topic: string; sections: MathData } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usageState, setUsageState] = useState<FlashUsageState>({ tier: "free", remaining: 3, used: 0, total: 3, windowLabel: "per hour", windowResetMs: null, isPaid: false });
  const [phIdx, setPhIdx] = useState(0);
  const [phVisible, setPhVisible] = useState(true);
  const [activeSection, setActiveSection] = useState("hook");
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setUsageState(getFlashUsageState()); }, []);

  useEffect(() => {
    if (result) return;
    const t = setInterval(() => {
      setPhVisible(false);
      setTimeout(() => { setPhIdx((i) => (i + 1) % MATH_PLACEHOLDERS.length); setPhVisible(true); }, 300);
    }, 3200);
    return () => clearInterval(t);
  }, [result]);

  useEffect(() => {
    if (!result) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id.replace("msec-", "")); }),
      { rootMargin: "-40% 0px -40% 0px" }
    );
    MATH_SECTIONS.forEach((s) => { const el = document.getElementById(`msec-${s.key}`); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [result]);

  const handleSubmit = useCallback(async () => {
    const t = topic.trim();
    if (!t || loading) return;
    const us = getFlashUsageState(); setUsageState(us);
    if (us.remaining === 0) { setError("Limit reached — upgrade Flash or wait for your window to reset."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/flash/math", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: t }) });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || "Something went wrong"); return; }
      recordFlashUsage(); setUsageState(getFlashUsageState()); setResult(data);
      saveFlashToHistory(t, "math", data.sections);
      setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch { setError("Network error — please try again"); }
    finally { setLoading(false); }
  }, [topic, loading]);

  const reset = () => { setResult(null); setError(null); setTopic(""); setTimeout(() => inputRef.current?.focus(), 50); };

  return (
    <PageTransition>
      {result && <ScrollBar />}
      {result && <SectionNav active={activeSection} />}

      <div className="min-h-screen bg-[#050505]">

        {/* ── Tier badge + upgrade nudge ── */}
        {!result && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex justify-center pt-5 px-4">
            {usageState.isPaid ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-sans font-semibold"
                style={{ backgroundColor: "rgba(129,140,248,0.08)", color: "#818cf8", border: "1px solid rgba(129,140,248,0.18)" }}>
                ✦ {usageState.tier === "exec" ? "Flash Executive" : "Flash Pro"} · {usageState.remaining === Infinity ? "∞" : `${usageState.remaining}/${usageState.total}`} {usageState.windowLabel}
              </div>
            ) : (
              <button onClick={() => router.push("/flash/upgrade")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-sans font-semibold transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: "rgba(129,140,248,0.05)", color: "rgba(129,140,248,0.55)", border: "1px solid rgba(129,140,248,0.12)" }}>
                ⚡ Free · {usageState.remaining}/{usageState.total} {usageState.windowLabel}
                <span className="opacity-70">· Upgrade to Pro $3.50/mo →</span>
              </button>
            )}
          </motion.div>
        )}

        {/* ── Hero ── */}
        <div className={`relative flex flex-col items-center px-4 pt-20 pb-10 sm:pt-28 sm:pb-16 ${result ? "pt-16 sm:pt-20" : ""}`}>

          {!result && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: "radial-gradient(circle, rgba(129,140,248,0.18) 1px, transparent 1px)",
                backgroundSize: "36px 36px",
                mask: "radial-gradient(ellipse 70% 60% at 50% 40%, black 0%, transparent 75%)",
                WebkitMask: "radial-gradient(ellipse 70% 60% at 50% 40%, black 0%, transparent 75%)",
              }} />
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 55% 45% at 50% 30%, rgba(129,140,248,0.07) 0%, transparent 70%)" }} />
            </div>
          )}

          {/* Back to Flash */}
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            onClick={() => router.push("/flash")}
            className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-sans text-white/30 hover:text-white/60 transition-colors">
            ← Flash
          </motion.button>

          {/* Brand */}
          <motion.div initial={{ opacity: 0, y: -16, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4 mb-10">

            <div className="relative">
              {!result && [1, 2].map((i) => (
                <motion.div key={i} className="absolute inset-0 rounded-2xl"
                  style={{ border: `1px solid rgba(129,140,248,${0.15 / i})`, scale: 1 + i * 0.22 }}
                  animate={{ opacity: [0.7, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }} />
              ))}
              <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.25)", boxShadow: "0 0 48px rgba(129,140,248,0.14)" }}>
                📐
              </div>
            </div>

            {!result && (
              <div className="text-center">
                <p className="font-sans font-bold text-[11px] tracking-[0.28em] uppercase mb-2 opacity-60" style={{ color: "#818cf8" }}>TM10</p>
                <h1 className="font-sans font-black leading-none mb-4"
                  style={{ fontSize: "clamp(44px,8vw,72px)", letterSpacing: "-0.04em", WebkitTextFillColor: "transparent", background: "linear-gradient(160deg, #a78bfa 0%, #818cf8 60%, #6366f1 100%)", WebkitBackgroundClip: "text", backgroundClip: "text" }}>
                  MATH FLASH
                </h1>
                <motion.p className="text-white/40 text-sm font-sans leading-relaxed"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  Any math topic · worked examples · practice notebook
                </motion.p>
              </div>
            )}

            {result && (
              <div className="text-center">
                <p className="text-xs font-sans font-bold uppercase tracking-widest mb-1" style={{ color: "#818cf8" }}>Math Flash</p>
                <h2 className="font-sans font-black text-white text-xl sm:text-2xl" style={{ letterSpacing: "-0.02em" }}>{result.topic}</h2>
              </div>
            )}
          </motion.div>

          {/* Input */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg">

            <div className="relative mb-3">
              <div className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300"
                style={{ boxShadow: topic ? "0 0 0 3px rgba(129,140,248,0.12), 0 0 40px rgba(129,140,248,0.06)" : "none" }} />
              <div className="flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-300"
                style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: topic ? "rgba(129,140,248,0.4)" : "rgba(255,255,255,0.09)" }}>
                <motion.span animate={{ color: topic ? "#818cf8" : "rgba(255,255,255,0.25)" }} transition={{ duration: 0.2 }} className="text-base shrink-0">
                  📐
                </motion.span>
                <div className="flex-1 relative overflow-hidden">
                  <input ref={inputRef} type="text" value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    disabled={loading} autoFocus className="w-full bg-transparent text-white text-sm font-sans outline-none" placeholder="" />
                  {!topic && (
                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                      <AnimatePresence mode="wait">
                        <motion.span key={phIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: phVisible ? 1 : 0, y: phVisible ? 0 : -6 }}
                          exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}
                          className="text-sm font-sans text-white/22 whitespace-nowrap">
                          Try: {MATH_PLACEHOLDERS[phIdx]}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                {topic && <button onClick={() => setTopic("")} className="text-white/20 hover:text-white/50 transition-colors text-sm shrink-0">✕</button>}
              </div>
            </div>

            <motion.button onClick={handleSubmit} disabled={!topic.trim() || loading || usageState.remaining === 0}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-xl py-3.5 text-sm font-sans font-bold transition-all duration-300 disabled:cursor-not-allowed"
              style={{
                background: (!topic.trim() || loading || usageState.remaining === 0) ? "rgba(129,140,248,0.12)" : "linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)",
                color: (!topic.trim() || loading || usageState.remaining === 0) ? "rgba(129,140,248,0.5)" : "#ffffff",
                boxShadow: topic.trim() && !loading && usageState.remaining > 0 ? "0 4px 24px rgba(129,140,248,0.25)" : "none",
              }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" />
                  Working through the math…
                </span>
              ) : usageState.remaining === 0 ? (
                <span className="flex items-center justify-center gap-2">
                  🔒 {usageState.tier === "free" ? "3/hour" : `${usageState.total}/${usageState.windowLabel}`} limit reached
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  📐 Flash Math
                  <span className="opacity-50 font-normal text-xs">· {usageState.remaining === Infinity ? "∞" : usageState.remaining}/{usageState.total === Infinity ? "∞" : usageState.total} {usageState.windowLabel}</span>
                </span>
              )}
            </motion.button>

            {/* Rate limit wall */}
            {usageState.remaining === 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-xl p-4 flex flex-col items-center gap-2 text-center"
                style={{ backgroundColor: "rgba(129,140,248,0.05)", border: "1px solid rgba(129,140,248,0.15)" }}>
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
                    style={{ background: "linear-gradient(135deg, #818cf8, #a78bfa)", color: "#fff" }}>
                    Unlock Flash Pro — $3.50/mo →
                  </button>
                )}
              </motion.div>
            )}

            <AnimatePresence>
              {error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-2.5 text-center text-xs font-sans text-red-400">{error}</motion.p>}
            </AnimatePresence>

            {!result && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="mt-5 flex flex-wrap justify-center gap-2">
                {["Pythagorean theorem", "Derivatives", "Compound interest", "Prime numbers", "Logarithms", "Bayes' theorem"].map((s) => (
                  <motion.button key={s} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setTopic(s); inputRef.current?.focus(); }}
                    className="px-3.5 py-1.5 rounded-full text-xs font-sans text-white/35 hover:text-white/65 transition-colors duration-200"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {s}
                  </motion.button>
                ))}
              </motion.div>
            )}

            {!result && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="mt-6 flex items-center justify-center gap-6">
                {[["7", "sections"], ["✏️", "notebook"], ["3", "problems"]].map(([val, lab]) => (
                  <div key={lab} className="text-center">
                    <div className="text-sm font-sans font-black" style={{ color: "#818cf8" }}>{val}</div>
                    <div className="text-[10px] font-sans text-white/25 uppercase tracking-wider">{lab}</div>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* ── Content ── */}
        <AnimatePresence mode="wait">
          {loading && !result && <LoadingScreen key="loading" topic={topic} />}

          {result && (
            <motion.div key="result" ref={contentRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto px-4 pb-32 lg:pr-24">

              <div className="flex flex-col gap-5">
                {MATH_SECTIONS.map((section) => {
                  if (section.style === "hero") {
                    const val = result.sections[section.key as Exclude<MathSectionKey, "practice">];
                    return <HeroCard key={section.key} section={section} data={typeof val === "string" ? val : ""} />;
                  }
                  if (section.style === "practice") {
                    return <PracticeCard key={section.key} section={section} problems={result.sections.practice} />;
                  }
                  const val = result.sections[section.key as Exclude<MathSectionKey, "practice">];
                  return <RegularCard key={section.key} section={section} data={typeof val === "string" ? val : ""} />;
                })}
              </div>

              {/* Notebook */}
              <div className="mt-10">
                <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.5 }} className="mb-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/[0.05]" />
                  <span className="text-[11px] font-sans font-bold uppercase tracking-[0.18em] text-white/30">Practice Notebook</span>
                  <div className="h-px flex-1 bg-white/[0.05]" />
                </motion.div>
                <FlashNotebook />
              </div>

              {/* Footer actions */}
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5 }} className="mt-10 flex flex-col sm:flex-row items-center gap-3">
                <button onClick={reset} disabled={usageState.remaining === 0}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-sans font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, rgba(129,140,248,0.15), rgba(129,140,248,0.08))", color: "#818cf8", border: "1px solid rgba(129,140,248,0.22)" }}>
                  📐 New Math Topic{usageState.remaining === 0 ? " (limit reached)" : usageState.remaining === Infinity ? "" : ` · ${usageState.remaining} left`}
                </button>
                <button onClick={() => router.push("/flash")}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-sans text-white/40 hover:text-white/65 transition-colors duration-200"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  ⚡ General Flash
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
