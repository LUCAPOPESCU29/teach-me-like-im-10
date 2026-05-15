"use client";

import { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionValueEvent,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { Safari } from "@/components/ui/safari";
import { Iphone } from "@/components/ui/iphone";

const STEPS = [
  {
    id: 1,
    title: "Pick any topic",
    description:
      "Type whatever you're curious about — black holes, how WiFi works, the stock market, anything.",
    color: "#34d399",
    icon: "✦",
    screen: (
      <div className="w-full h-full bg-[#030609] flex flex-col items-center justify-center px-8 py-10">
        <div className="flex items-center gap-1.5 mb-6">
          {["#34d399", "#6ee7b7", "#a7f3d0"].map((c) => (
            <div key={c} className="w-2 h-2 rounded-full" style={{ backgroundColor: c, opacity: 0.6 }} />
          ))}
        </div>
        <h2 className="text-white text-3xl font-bold mb-2 text-center" style={{ fontFamily: "Syne, sans-serif" }}>
          Teach Me
        </h2>
        <h2
          className="text-3xl font-bold mb-8 text-center"
          style={{
            fontFamily: "Syne, sans-serif",
            background: "linear-gradient(135deg,#34d399,#6ee7b7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Like I&apos;m 10
        </h2>
        <div className="w-full max-w-md flex items-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <span className="text-white/30 text-sm flex-1">What do you want to understand?</span>
          <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
            Explore →
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {["Quantum Physics", "Black Holes", "Neural Networks"].map((t) => (
            <div key={t} className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/40 text-xs">
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Start simple, go deeper",
    description:
      "Every topic has 5 levels — from \"explain like I'm 10\" all the way to expert. You choose how deep to go.",
    color: "#fbbf24",
    icon: "📊",
    screen: (
      <div className="w-full h-full bg-[#030609] px-8 py-8">
        <div className="text-white/30 text-xs mb-2 font-mono">← Back</div>
        <h3 className="text-white text-xl font-bold mb-6" style={{ fontFamily: "Syne, sans-serif" }}>
          Black Holes
        </h3>
        <div className="space-y-3">
          {[
            { level: 1, label: "ELI10 — The Basics", color: "#34d399", done: true },
            { level: 2, label: "Curious Teen", color: "#6ee7b7", done: true },
            { level: 3, label: "College Intro", color: "#fbbf24", active: true },
            { level: 4, label: "Advanced", color: "#f97316" },
            { level: 5, label: "Expert / PhD", color: "#a855f7" },
          ].map((l) => (
            <div
              key={l.level}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
              style={{
                borderColor: l.active ? l.color + "50" : "rgba(255,255,255,0.06)",
                backgroundColor: l.active ? l.color + "0a" : "rgba(255,255,255,0.02)",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold"
                style={{
                  backgroundColor: l.done || l.active ? l.color + "25" : "rgba(255,255,255,0.05)",
                  color: l.done || l.active ? l.color : "rgba(255,255,255,0.3)",
                }}
              >
                {l.done ? "✓" : l.level}
              </div>
              <div className="flex-1">
                <div
                  className="text-sm"
                  style={{
                    color: l.active ? l.color : l.done ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
                  }}
                >
                  Level {l.level}: {l.label}
                </div>
              </div>
              {l.active && (
                <div
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: l.color + "20", color: l.color }}
                >
                  READING
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Test yourself",
    description:
      "After each level, take a quiz to earn XP. Score well and unlock badges, streaks, and leaderboard ranks.",
    color: "#f97316",
    icon: "⚡",
    screen: (
      <div className="w-full h-full bg-[#030609] px-8 py-8">
        <div className="text-white/30 text-xs font-mono mb-4">QUIZ — Black Holes</div>
        <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] mb-4">
          <p className="text-white/80 text-sm mb-5">What happens to time near a black hole?</p>
          <div className="space-y-2">
            {[
              { text: "It speeds up", wrong: true },
              { text: "It slows down", correct: true },
              { text: "It stops completely" },
              { text: "It reverses" },
            ].map((o, i) => (
              <div
                key={i}
                className="px-4 py-3 rounded-xl border text-sm"
                style={{
                  borderColor: o.correct ? "#34d39940" : o.wrong ? "#f43f5e40" : "rgba(255,255,255,0.06)",
                  backgroundColor: o.correct ? "#34d39910" : o.wrong ? "#f43f5e10" : "rgba(255,255,255,0.02)",
                  color: o.correct ? "#34d399" : o.wrong ? "#f87171" : "rgba(255,255,255,0.5)",
                }}
              >
                {o.correct && "✓ "}{o.wrong && "✗ "}{o.text}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-emerald-400 text-sm font-mono font-bold">+25 XP</div>
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
          </div>
          <div className="text-white/30 text-xs">3/4</div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Track your progress",
    description:
      "See your streak, XP, badges, and a solar system of all the topics you've explored. Watch it grow!",
    color: "#a855f7",
    icon: "🧬",
    screen: (
      <div className="w-full h-full bg-[#030609] px-8 py-8">
        <h3 className="text-white text-xl font-bold mb-5" style={{ fontFamily: "Syne, sans-serif" }}>
          My Progress
        </h3>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { val: "1,730", label: "Total XP", color: "#34d399" },
            { val: "4", label: "Day Streak", color: "#f97316" },
            { val: "12", label: "Topics", color: "#3b82f6" },
            { val: "6/10", label: "Badges", color: "#a855f7" },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
              <div className="text-lg font-mono font-bold" style={{ color: s.color }}>{s.val}</div>
              <div className="text-[10px] text-white/30 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm">Level 8 — Polymath</span>
            <span className="text-white/30 text-[10px] font-mono">1,730 / 2,000 XP</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              style={{ width: "86%" }}
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["First Steps", "Quiz Ace", "Deep Diver", "Bookworm", "On Fire", "Polyglot"].map((b) => (
            <div key={b} className="px-2.5 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400/60 text-[10px]">
              {b}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: "Battle your friends",
    description:
      "Create a quiz battle, share the code, and compete in real-time. See who really knows their stuff!",
    color: "#f43f5e",
    icon: "⚔️",
    screen: (
      <div className="w-full h-full bg-[#030609] flex flex-col items-center justify-center px-8 py-8">
        <div className="text-4xl mb-3">⚔️</div>
        <h3 className="text-white text-2xl font-bold mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
          Quiz Battle
        </h3>
        <p className="text-white/30 text-sm mb-8">Challenge your friends to a real-time quiz</p>
        <div className="w-full max-w-sm space-y-3">
          <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/[0.03]">
            <div className="text-rose-400/60 text-[10px] font-mono tracking-wider mb-3">CREATE A BATTLE</div>
            <div className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/30 text-sm mb-2">Your name</div>
            <div className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/30 text-sm mb-3">Pick a topic</div>
            <div className="w-full px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm text-center font-mono">
              CREATE BATTLE
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function HowItWorksPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeStepRef = useRef(0);
  const [activeStep, setActiveStep] = useState(0);
  const step = STEPS[activeStep];

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Persistent subtle 3D rotation driven by scroll position
  const rotateXRaw = useTransform(scrollYProgress, [0, 1], [6, -6]);
  const rotateX = useSpring(rotateXRaw, { stiffness: 40, damping: 18 });

  const rotateYMV = useMotionValue(0);
  const rotateY = useSpring(rotateYMV, { stiffness: 60, damping: 22 });

  const scaleMV = useMotionValue(1);
  const scale = useSpring(scaleMV, { stiffness: 120, damping: 20 });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const rawStep = v * STEPS.length;
    const newStep = Math.min(Math.floor(rawStep), STEPS.length - 1);
    const localProgress = rawStep % 1; // 0→1 within each step

    // Gentle Y rock within each step
    rotateYMV.set((localProgress - 0.5) * 7);

    if (newStep !== activeStepRef.current) {
      // Brief scale-down on transition
      scaleMV.set(0.96);
      setTimeout(() => scaleMV.set(1), 300);
      activeStepRef.current = newStep;
      setActiveStep(newStep);
    }
  });

  function scrollToStep(i: number) {
    const el = containerRef.current;
    if (!el) return;
    const top = el.offsetTop + (i / STEPS.length) * el.offsetHeight;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <main className="bg-[#030609] min-h-screen">
      {/* ─── Intro hero (scrolls away) ─── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        {/* Grid bg */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(52,211,153,1) 1px,transparent 1px),linear-gradient(90deg,rgba(52,211,153,1) 1px,transparent 1px)",
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

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] mb-7">
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              style={{ boxShadow: "0 0 8px rgba(52,211,153,0.9)" }}
            />
            <span className="text-emerald-400/80 text-[10px] font-sans font-semibold tracking-[0.16em] uppercase">
              5-step process
            </span>
          </div>

          <h1
            className="mb-5 text-white/92"
            style={{
              fontFamily: "Syne, sans-serif",
              fontSize: "clamp(52px,7vw,96px)",
              fontWeight: 800,
              lineHeight: 0.96,
              letterSpacing: "-0.035em",
            }}
          >
            How It{" "}
            <span
              style={{
                background: "linear-gradient(135deg,#34d399 0%,#6ee7b7 50%,#a7f3d0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Works
            </span>
          </h1>

          <p className="text-white/38 text-lg max-w-md mx-auto font-sans leading-[1.72] mb-12">
            Learn anything in minutes. Scroll through each step.
          </p>

          {/* Scroll hint */}
          <motion.div
            className="flex flex-col items-center gap-3"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-white/25 text-xs font-sans tracking-[0.2em] uppercase">Scroll</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M5 11l5 5 5-5" stroke="rgba(52,211,153,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Pinned scroll section ─── */}
      <div ref={containerRef} style={{ height: `${STEPS.length * 100}vh` }}>
        <div
          style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}
          className="flex items-center justify-center"
        >
          {/* Faint step background glow */}
          <motion.div
            className="pointer-events-none absolute inset-0 transition-all duration-700"
            style={{
              background: `radial-gradient(ellipse 60% 60% at 65% 50%, ${step.color}0d 0%, transparent 70%)`,
            }}
          />

          <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 h-full flex items-center">
            {/* ── Desktop: left text + right 3D window ── */}
            <div className="hidden lg:grid grid-cols-5 gap-16 items-center w-full">
              {/* Left: step info */}
              <div className="col-span-2 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, x: -40, filter: "blur(6px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: 40, filter: "blur(6px)" }}
                    transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                  >
                    {/* Step counter */}
                    <div
                      className="text-[80px] font-mono font-bold leading-none mb-4 select-none"
                      style={{
                        color: step.color + "18",
                        letterSpacing: "-0.05em",
                      }}
                    >
                      0{step.id}
                    </div>

                    {/* Eyebrow tag */}
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-sans font-semibold tracking-[0.14em] uppercase border mb-4"
                      style={{
                        borderColor: step.color + "30",
                        backgroundColor: step.color + "0a",
                        color: step.color,
                      }}
                    >
                      <span>{step.icon}</span>
                      Step {step.id} of {STEPS.length}
                    </div>

                    <h2
                      className="text-white text-4xl xl:text-[3rem] font-extrabold mb-5 leading-[1.05]"
                      style={{ fontFamily: "Syne, sans-serif", letterSpacing: "-0.03em" }}
                    >
                      {step.title}
                    </h2>
                    <p className="text-white/42 text-lg font-sans leading-[1.75] mb-8 max-w-sm">
                      {step.description}
                    </p>

                    {/* Progress dots */}
                    <div className="flex items-center gap-2.5">
                      {STEPS.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => scrollToStep(i)}
                          className="transition-all duration-500"
                          style={{
                            width: activeStep === i ? "24px" : "6px",
                            height: "6px",
                            borderRadius: "3px",
                            backgroundColor: activeStep === i ? step.color : "rgba(255,255,255,0.15)",
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right: 3D Mac window */}
              <div className="col-span-3 flex items-center justify-center">
                <div style={{ perspective: "1400px", width: "100%" }}>
                  <motion.div
                    style={{
                      rotateX,
                      rotateY,
                      scale,
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {/* Glow behind window */}
                    <div
                      className="absolute -inset-8 rounded-3xl pointer-events-none blur-2xl opacity-20 transition-all duration-700"
                      style={{ background: `radial-gradient(ellipse at 50% 50%, ${step.color} 0%, transparent 70%)` }}
                    />

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeStep}
                        initial={{ opacity: 0, rotateY: 12, scale: 0.97 }}
                        animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                        exit={{ opacity: 0, rotateY: -12, scale: 0.97 }}
                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <Safari
                          url="teachmelikeim10.xyz"
                          mode="default"
                          className="rounded-xl shadow-[0_40px_80px_rgba(0,0,0,0.7)]"
                        >
                          {step.screen}
                        </Safari>
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* ── Mobile: stacked layout ── */}
            <div className="lg:hidden flex flex-col items-center w-full gap-6">
              {/* Step selector pills */}
              <div className="flex gap-1.5 flex-wrap justify-center">
                {STEPS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToStep(i)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-sans transition-all duration-300"
                    style={{
                      borderColor: activeStep === i ? s.color + "50" : "rgba(255,255,255,0.08)",
                      backgroundColor: activeStep === i ? s.color + "12" : "rgba(255,255,255,0.02)",
                      color: activeStep === i ? s.color : "rgba(255,255,255,0.35)",
                    }}
                  >
                    <span className="text-[10px]">{s.icon}</span>
                    {s.id}
                  </button>
                ))}
              </div>

              {/* 3D iPhone */}
              <div style={{ perspective: "900px", width: "240px" }}>
                <motion.div style={{ rotateX, rotateY, scale, transformStyle: "preserve-3d" }}>
                  <div
                    className="absolute -inset-8 rounded-3xl blur-2xl opacity-30 pointer-events-none transition-all duration-700"
                    style={{ background: `radial-gradient(ellipse, ${step.color} 0%, transparent 70%)` }}
                  />
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, rotateY: 10 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      exit={{ opacity: 0, rotateY: -10 }}
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <Iphone className="shadow-[0_30px_60px_rgba(0,0,0,0.7)]">
                        {step.screen}
                      </Iphone>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Description */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  className="text-center max-w-xs px-4"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                >
                  <h2 className="text-white text-xl font-bold mb-2" style={{ fontFamily: "Syne, sans-serif", color: step.color }}>
                    {step.title}
                  </h2>
                  <p className="text-white/40 text-sm font-sans leading-relaxed">{step.description}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right-side step indicator (desktop) */}
          <div className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col gap-3">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => scrollToStep(i)}
                className="group flex items-center gap-2 transition-all duration-400"
              >
                <span
                  className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity text-white/40"
                >
                  0{s.id}
                </span>
                <div
                  className="rounded-full transition-all duration-400"
                  style={{
                    width: activeStep === i ? "20px" : "6px",
                    height: "6px",
                    backgroundColor: activeStep === i ? s.color : "rgba(255,255,255,0.15)",
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CTA section ─── */}
      <section className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 relative">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(52,211,153,0.06) 0%, transparent 70%)",
          }}
        />
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px rgba(52,211,153,0.9)" }} />
            <span className="text-emerald-400/80 text-[10px] font-sans font-semibold tracking-[0.16em] uppercase">
              Ready to start?
            </span>
          </div>

          <h2
            className="text-white mb-5"
            style={{
              fontFamily: "Syne, sans-serif",
              fontSize: "clamp(36px,5vw,64px)",
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
            }}
          >
            Start learning{" "}
            <span
              style={{
                background: "linear-gradient(135deg,#34d399,#6ee7b7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              now.
            </span>
          </h2>
          <p className="text-white/38 text-lg font-sans mb-10 max-w-sm mx-auto leading-relaxed">
            Free forever. No credit card. Just curiosity.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <motion.button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full font-sans text-sm font-bold"
              style={{
                background: "linear-gradient(135deg,#34d399,#10b981)",
                color: "#000",
                boxShadow: "0 4px 24px rgba(52,211,153,0.3)",
              }}
              whileHover={{ scale: 1.04, boxShadow: "0 8px 32px rgba(52,211,153,0.45)" }}
              whileTap={{ scale: 0.97 }}
            >
              Start Learning Free
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.15)" }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 8L8 2M8 2H3.5M8 2V6.5" stroke="#000" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
            </motion.button>
            <motion.button
              onClick={() => router.push("/pro")}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-sans text-sm border border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white/80 hover:border-white/[0.16]"
              style={{ transition: "all 0.35s cubic-bezier(0.23,1,0.32,1)" }}
              whileTap={{ scale: 0.97 }}
            >
              See Pro plans ✦
            </motion.button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
