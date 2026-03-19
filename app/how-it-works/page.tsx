"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Safari } from "@/components/ui/safari";
import Aurora from "@/components/Aurora";

const STEPS = [
  {
    id: 1,
    title: "Pick any topic",
    description: "Type whatever you're curious about — black holes, how WiFi works, the stock market, anything.",
    color: "#4ade80",
    screen: (
      <div className="w-full h-full bg-[#070b14] flex flex-col items-center justify-center px-8 py-10">
        <div className="flex items-center gap-1.5 mb-6">
          {["#4ade80", "#fbbf24", "#f97316", "#f43f5e", "#a855f7"].map((c) => (
            <div key={c} className="w-2 h-2 rounded-full" style={{ backgroundColor: c, opacity: 0.6 }} />
          ))}
        </div>
        <h2 className="text-white text-3xl font-serif mb-2 text-center">Teach Me</h2>
        <h2 className="text-3xl font-serif mb-8 text-center" style={{ color: "#4ade80" }}>Like I&apos;m 10</h2>
        <div className="w-full max-w-md flex items-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <span className="text-white/30 text-sm flex-1">What do you want to understand?</span>
          <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm">
            Explore
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
    description: "Every topic has 5 levels — from \"explain like I'm 10\" all the way to expert. You choose how deep to go.",
    color: "#fbbf24",
    screen: (
      <div className="w-full h-full bg-[#070b14] px-8 py-8">
        <div className="text-white/30 text-xs mb-2 font-mono">← Back</div>
        <h3 className="text-white text-xl font-serif mb-6">Black Holes</h3>
        <div className="space-y-3">
          {[
            { level: 1, label: "ELI10 — The Basics", color: "#4ade80", done: true },
            { level: 2, label: "Curious Teen", color: "#fbbf24", done: true },
            { level: 3, label: "College Intro", color: "#f97316", active: true },
            { level: 4, label: "Advanced", color: "#f43f5e" },
            { level: 5, label: "Expert / PhD", color: "#a855f7" },
          ].map((l) => (
            <div
              key={l.level}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border"
              style={{
                borderColor: l.active ? l.color + "40" : "rgba(255,255,255,0.06)",
                backgroundColor: l.active ? l.color + "08" : "rgba(255,255,255,0.02)",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold"
                style={{
                  backgroundColor: l.done || l.active ? l.color + "20" : "rgba(255,255,255,0.05)",
                  color: l.done || l.active ? l.color : "rgba(255,255,255,0.3)",
                }}
              >
                {l.done ? "\u2713" : l.level}
              </div>
              <div className="flex-1">
                <div className="text-sm" style={{ color: l.active ? l.color : l.done ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)" }}>
                  Level {l.level}: {l.label}
                </div>
              </div>
              {l.active && (
                <div className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: l.color + "20", color: l.color }}>
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
    title: "Test yourself with quizzes",
    description: "After each level, take a quiz to earn XP. Score well and unlock badges, streaks, and leaderboard ranks.",
    color: "#f97316",
    screen: (
      <div className="w-full h-full bg-[#070b14] px-8 py-8">
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
                  borderColor: o.correct ? "#4ade8040" : o.wrong ? "#f43f5e40" : "rgba(255,255,255,0.06)",
                  backgroundColor: o.correct ? "#4ade8010" : o.wrong ? "#f43f5e10" : "rgba(255,255,255,0.02)",
                  color: o.correct ? "#4ade80" : o.wrong ? "#f43f5e" : "rgba(255,255,255,0.5)",
                }}
              >
                {o.correct && "\u2713 "}{o.wrong && "\u2717 "}{o.text}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-emerald-400 text-sm font-mono">+25 XP</div>
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
    description: "See your streak, XP, badges, and a solar system of all the topics you've explored. Watch it grow!",
    color: "#f43f5e",
    screen: (
      <div className="w-full h-full bg-[#070b14] px-8 py-8">
        <h3 className="text-white text-xl font-serif mb-5">My Progress</h3>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { val: "1,730", label: "Total XP", color: "#4ade80" },
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
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: "86%" }} />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["First Steps", "Quiz Ace", "Deep Diver", "Bookworm", "On Fire", "Polyglot"].map((b) => (
            <div key={b} className="px-2.5 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-400/60 text-[10px]">
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
    description: "Create a quiz battle, share the code, and compete in real-time. See who really knows their stuff!",
    color: "#a855f7",
    screen: (
      <div className="w-full h-full bg-[#070b14] flex flex-col items-center justify-center px-8 py-8">
        <div className="text-4xl mb-3">&#x2694;&#xFE0F;</div>
        <h3 className="text-white text-2xl font-serif mb-2">Quiz Battle</h3>
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
  const [activeStep, setActiveStep] = useState(0);
  const step = STEPS[activeStep];

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-16 relative overflow-hidden">
      <Aurora />

      {/* Back button */}
      <motion.button
        onClick={() => router.push("/")}
        className="fixed top-4 left-4 z-50 text-sm text-white/30 hover:text-white/60 transition-colors font-sans"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        &#8592; Home
      </motion.button>

      {/* Header */}
      <motion.div
        className="text-center mb-10 sm:mb-16 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-display text-4xl sm:text-5xl text-white mb-4">How It Works</h1>
        <p className="text-white/35 text-lg max-w-lg mx-auto font-serif">
          Learn anything in 5 minutes. Here&apos;s how.
        </p>
      </motion.div>

      {/* Step tabs */}
      <motion.div
        className="flex items-center gap-2 sm:gap-3 mb-8 sm:mb-12 relative z-10 flex-wrap justify-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveStep(i)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border text-sm font-sans transition-all duration-300"
            style={{
              borderColor: activeStep === i ? s.color + "40" : "rgba(255,255,255,0.06)",
              backgroundColor: activeStep === i ? s.color + "10" : "rgba(255,255,255,0.02)",
              color: activeStep === i ? s.color : "rgba(255,255,255,0.35)",
            }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold"
              style={{
                backgroundColor: activeStep === i ? s.color + "25" : "rgba(255,255,255,0.05)",
                color: activeStep === i ? s.color : "rgba(255,255,255,0.3)",
              }}
            >
              {s.id}
            </span>
            <span className="hidden sm:inline">{s.title}</span>
          </button>
        ))}
      </motion.div>

      {/* Safari browser with step content */}
      <motion.div
        className="w-full max-w-4xl relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <Safari
              url="teachmelikeim10.xyz"
              mode="default"
              className="rounded-xl shadow-2xl shadow-black/40"
            >
              {step.screen}
            </Safari>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Description below */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          className="text-center mt-8 sm:mt-12 max-w-lg relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-white text-xl sm:text-2xl font-display mb-3" style={{ color: step.color }}>
            {step.title}
          </h2>
          <p className="text-white/40 font-sans leading-relaxed">
            {step.description}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <div className="flex items-center gap-4 mt-8 relative z-10">
        <button
          onClick={() => setActiveStep((p) => Math.max(0, p - 1))}
          disabled={activeStep === 0}
          className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.03] text-white/40 hover:text-white/70 hover:bg-white/[0.06] disabled:opacity-20 transition-all flex items-center justify-center"
        >
          &#8592;
        </button>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all duration-300 cursor-pointer"
              style={{
                backgroundColor: activeStep === i ? s.color : "rgba(255,255,255,0.1)",
                transform: activeStep === i ? "scale(1.3)" : "scale(1)",
              }}
              onClick={() => setActiveStep(i)}
            />
          ))}
        </div>
        <button
          onClick={() => setActiveStep((p) => Math.min(STEPS.length - 1, p + 1))}
          disabled={activeStep === STEPS.length - 1}
          className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.03] text-white/40 hover:text-white/70 hover:bg-white/[0.06] disabled:opacity-20 transition-all flex items-center justify-center"
        >
          &#8594;
        </button>
      </div>

      {/* CTA */}
      <motion.button
        onClick={() => router.push("/")}
        className="mt-10 px-8 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-sans text-sm hover:bg-emerald-500/25 transition-all relative z-10"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Start Learning Now
      </motion.button>
    </main>
  );
}
