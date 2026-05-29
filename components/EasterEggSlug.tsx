"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASTER_EGG_SLUGS, markEggDiscovered } from "@/lib/easter-eggs";
import type { EasterEggId } from "@/lib/easter-eggs";

interface EasterEggSlugProps {
  slug: string;
  onComplete: () => void;
}

export default function EasterEggSlug({ slug, onComplete }: EasterEggSlugProps) {
  const eggId = EASTER_EGG_SLUGS[slug] as EasterEggId | undefined;
  const [show, setShow] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!eggId) return;
    markEggDiscovered(eggId);
    setShow(true);

    // Auto-dismiss after a delay
    const timeout = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        setShow(false);
        setTimeout(onComplete, 500);
      }
    }, eggId === "rickroll" ? 8000 : 5000);

    return () => clearTimeout(timeout);
  }, [eggId, onComplete]);

  function handleDismiss() {
    if (completedRef.current) return;
    completedRef.current = true;
    setShow(false);
    setTimeout(onComplete, 500);
  }

  if (!eggId) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/95 backdrop-blur-sm cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={handleDismiss}
        >
          {eggId === "meaning_of_life" && <MeaningOfLife />}
          {eggId === "rickroll" && <Rickroll />}
          {eggId === "hello_world" && <HelloWorld />}
          {eggId === "meta_self_reference" && <MetaSelfReference />}

          <motion.p
            className="absolute bottom-8 text-white/20 font-mono text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            click anywhere to continue
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Meaning of Life: big animated "42" ─── */
function MeaningOfLife() {
  return (
    <div className="text-center">
      <motion.div
        className="text-[12rem] sm:text-[16rem] font-mono font-black leading-none"
        initial={{ scale: 0, opacity: 0, rotate: -180 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 12, duration: 1 }}
      >
        <span className="bg-gradient-to-b from-emerald-300 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
          42
        </span>
      </motion.div>

      <motion.p
        className="text-white/50 font-serif text-lg sm:text-xl max-w-md mx-auto mt-4 italic leading-relaxed px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        &ldquo;The answer to the ultimate question of life, the universe, and
        everything.&rdquo;
      </motion.p>

      <motion.p
        className="text-white/25 font-sans text-sm mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        &mdash; Douglas Adams, The Hitchhiker&apos;s Guide to the Galaxy
      </motion.p>

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-emerald-400/40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Rickroll ─── */
function Rickroll() {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowVideo(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="text-center" onClick={(e) => e.stopPropagation()}>
      <motion.p
        className="text-5xl sm:text-7xl font-display text-white mb-6"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Never Gonna Give You Up
      </motion.p>

      <AnimatePresence>
        {showVideo && (
          <motion.div
            className="relative w-[90vw] max-w-xl aspect-video mx-auto rounded-2xl overflow-hidden border border-white/10"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
          >
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&start=0"
              title="Rickroll"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full h-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.p
        className="text-white/30 font-mono text-sm mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        You just got rickrolled. You&apos;re welcome.
      </motion.p>
    </div>
  );
}

/* ─── Hello World: retro terminal animation ─── */
function HelloWorld() {
  const [lines, setLines] = useState<string[]>([]);
  const terminalLines = [
    "$ gcc hello.c -o hello",
    "$ ./hello",
    "",
    "  _   _      _ _        __        __         _     _ _",
    " | | | | ___| | | ___   \\ \\      / /__  _ __| | __| | |",
    " | |_| |/ _ \\ | |/ _ \\   \\ \\ /\\ / / _ \\| '__| |/ _` | |",
    " |  _  |  __/ | | (_) |   \\ V  V / (_) | |  | | (_| |_|",
    " |_| |_|\\___|_|_|\\___/     \\_/\\_/ \\___/|_|  |_|\\__,_(_)",
    "",
    "// Every programmer's first program.",
    "// Welcome, fellow coder. 🖥️",
  ];

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      if (current < terminalLines.length) {
        setLines((prev) => [...prev, terminalLines[current]]);
        current++;
      } else {
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="w-[90vw] max-w-2xl"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Terminal window chrome */}
      <div className="rounded-t-xl bg-[#2d2d2d] px-4 py-2 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-white/30 text-xs font-mono">terminal</span>
      </div>

      {/* Terminal body */}
      <div className="rounded-b-xl bg-[#1a1a2e] p-6 font-mono text-sm min-h-[300px] overflow-hidden">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className={`whitespace-pre ${
              line.startsWith("$")
                ? "text-emerald-400"
                : line.startsWith("//")
                ? "text-white/30"
                : "text-green-300"
            }`}
          >
            {line}
          </motion.div>
        ))}

        {/* Blinking cursor */}
        <motion.span
          className="inline-block w-2 h-4 bg-emerald-400 mt-1"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Meta Self-Reference: "teach me like im 10" ─── */
function MetaSelfReference() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2000);
    const t3 = setTimeout(() => setPhase(3), 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="text-center px-6 max-w-lg">
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.p
            key="p0"
            className="text-white/60 font-mono text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Searching for &ldquo;Teach Me Like I&apos;m 10&rdquo;...
          </motion.p>
        )}

        {phase === 1 && (
          <motion.div
            key="p1"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <p className="text-6xl sm:text-8xl">🤯</p>
            <p className="text-white font-display text-3xl sm:text-4xl">
              Wait a minute...
            </p>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div
            key="p2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <p className="text-6xl sm:text-8xl">🪞</p>
            <p className="text-white font-display text-3xl sm:text-4xl">
              You&apos;re already here!
            </p>
            <p className="text-white/40 font-sans text-base">
              You asked the app to teach you about... itself.
            </p>
          </motion.div>
        )}

        {phase >= 3 && (
          <motion.div
            key="p3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <motion.div
              className="inline-block px-6 py-4 rounded-2xl bg-white/5 border border-white/10"
              animate={{
                borderColor: [
                  "rgba(255,255,255,0.1)",
                  "rgba(52,211,153,0.3)",
                  "rgba(168,85,247,0.3)",
                  "rgba(255,255,255,0.1)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <p className="text-white font-display text-2xl sm:text-3xl mb-2">
                Inception achieved.
              </p>
              <p className="text-white/40 font-sans text-sm">
                Achievement unlocked: <span className="text-purple-400">Meta Learner</span>
              </p>
            </motion.div>

            <p className="text-white/20 font-mono text-xs">
              this is the app. you are in the app. the app is you. 🧘
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
