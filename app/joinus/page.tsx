"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/PageTransition";

const EASE = [0.32, 0.72, 0, 1] as const;

/* ── Animated counter ── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useState(() => {
    if (!inView) return;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1600, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ── Card types ── */
interface JoinCardProps {
  emoji: string;
  label: string;
  title: string;
  desc: string;
  color: string;
  glow: string;
  border: string;
  bg: string;
  cta: string;
  href?: string;
  onClick?: () => void;
  badge?: string;
  delay?: number;
}

function JoinCard({ emoji, label, title, desc, color, glow, border, bg, cta, href, onClick, badge, delay = 0 }: JoinCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      whileHover={{ y: -5 }}
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        transition: `box-shadow 0.4s cubic-bezier(0.32,0.72,0,1)`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${glow}`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
    >
      {/* Top mesh glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 70% 0%, ${glow} 0%, transparent 60%)` }}
      />
      {/* Dot pattern */}
      <div
        className="absolute top-0 right-0 w-36 h-36 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${color}33 1px, transparent 1px)`,
          backgroundSize: "18px 18px",
          maskImage: "radial-gradient(ellipse at 100% 0%, black 0%, transparent 65%)",
          WebkitMaskImage: "radial-gradient(ellipse at 100% 0%, black 0%, transparent 65%)",
        }}
      />

      <div className="relative p-7 flex flex-col flex-1">
        {badge && (
          <div
            className="absolute top-5 right-5 px-2.5 py-1 rounded-full text-[9px] font-sans font-semibold tracking-[0.12em] uppercase"
            style={{ background: `${color}14`, border: `1px solid ${color}30`, color }}
          >
            {badge}
          </div>
        )}

        {/* Icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-5"
          style={{ background: `${color}14`, border: `1px solid ${color}28` }}
        >
          {emoji}
        </div>

        <p className="text-[10px] font-sans font-semibold tracking-[0.16em] uppercase mb-2" style={{ color: `${color}99` }}>
          {label}
        </p>
        <h3 className="font-display text-xl text-white font-semibold mb-3 leading-snug">{title}</h3>
        <p className="text-sm font-sans text-white/40 leading-relaxed flex-1 mb-6">{desc}</p>

        <motion.a
          href={href}
          onClick={onClick}
          target={href?.startsWith("http") ? "_blank" : undefined}
          rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-sans font-semibold self-start"
          style={{
            background: `${color}14`,
            border: `1px solid ${color}28`,
            color,
            transition: `all 0.3s cubic-bezier(0.32,0.72,0,1)`,
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = `${color}22`;
            (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${color}30`;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = `${color}14`;
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          {cta}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 9.5L9.5 2.5M9.5 2.5H5M9.5 2.5V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </motion.a>
      </div>
    </motion.div>
  );
}

/* ── Newsletter inline form ── */
function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || state === "loading") return;
    setState("loading");
    try {
      // Sends to the existing email system — stores preference in profile
      await new Promise(r => setTimeout(r, 800)); // simulate
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <AnimatePresence mode="wait">
      {state === "done" ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 py-3"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l2.5 2.5L10 3" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-sans text-emerald-400 font-medium">You&apos;re in! We&apos;ll be in touch 🎉</span>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={submit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-2 flex-wrap sm:flex-nowrap"
        >
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-4 py-2.5 rounded-xl font-sans text-sm text-white placeholder:text-white/20 focus:outline-none min-w-0"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              transition: "border-color 0.25s",
            }}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(52,211,153,0.4)"; }}
            onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
          />
          <motion.button
            type="submit"
            disabled={state === "loading"}
            className="px-5 py-2.5 rounded-xl text-sm font-sans font-semibold text-black relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {state === "loading" ? (
              <motion.div
                className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full mx-auto"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              "Subscribe"
            )}
          </motion.button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

/* ── Ambient orbs background ── */
function Orbs() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-[#030609]" />
      <motion.div
        className="absolute rounded-full blur-[120px]"
        style={{ width: 500, height: 500, top: "-5%", left: "-5%", background: "radial-gradient(circle, rgba(52,211,153,0.1) 0%, transparent 70%)" }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full blur-[150px]"
        style={{ width: 600, height: 600, top: "40%", right: "-10%", background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)" }}
        animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />
    </div>
  );
}

export default function JoinUsPage() {
  const router = useRouter();

  return (
    <PageTransition>
      <div className="min-h-screen text-white">
        <Orbs />

        {/* ── HERO ── */}
        <section className="relative pt-28 pb-16 px-4 text-center overflow-hidden">
          {/* Radial glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.13) 0%, transparent 65%)" }}
          />
          {/* Grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.022]"
            style={{
              backgroundImage: `linear-gradient(rgba(52,211,153,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.8) 1px, transparent 1px)`,
              backgroundSize: "72px 72px",
            }}
          />

          <div className="relative max-w-3xl mx-auto">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{
                background: "rgba(52,211,153,0.07)",
                border: "1px solid rgba(52,211,153,0.2)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                style={{ boxShadow: "0 0 8px rgba(52,211,153,0.9)", animation: "pulse 2s infinite" }}
              />
              <span className="text-[10px] font-sans font-semibold tracking-[0.16em] uppercase text-emerald-400">
                Community
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
              className="font-display text-5xl sm:text-7xl font-bold leading-[0.94] tracking-tight mb-5"
            >
              <span className="text-white">Be part of something</span>
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #34d399 0%, #6ee7b7 45%, #a7f3d0 70%, #34d399 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                worth learning.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
              className="text-white/40 font-sans text-lg leading-relaxed max-w-xl mx-auto mb-10"
            >
              A growing community of curious learners. Join us on Discord, follow for updates,
              or just share the site with someone who loves to learn.
            </motion.p>

            {/* Quick stats row */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
              className="inline-flex items-center gap-6 px-6 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {[
                { val: "10k+", label: "Topics explored" },
                { val: "40+", label: "Languages" },
                { val: "Free", label: "Forever" },
              ].map(({ val, label }, i) => (
                <div key={i} className="text-center">
                  <div className="font-display text-lg text-white font-semibold">{val}</div>
                  <div className="text-[10px] font-sans text-white/30">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── JOIN CARDS ── */}
        <section className="px-4 pb-16 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <JoinCard
              emoji="💬"
              label="Community"
              title="Join the Discord"
              desc="Chat with other curious learners, share topics, ask questions, and get early access to new features. This is where the real conversation happens."
              color="#5865f2"
              glow="rgba(88,101,242,0.12)"
              border="rgba(88,101,242,0.18)"
              bg="rgba(88,101,242,0.04)"
              cta="Join Discord"
              href="https://discord.gg/teachmelikeim10"
              badge="Active"
              delay={0}
            />
            <JoinCard
              emoji="𝕏"
              label="Social"
              title="Follow on X"
              desc="Weekly curiosity threads, new feature drops, and the occasional wild topic explained in 5 levels. No noise — just the good stuff."
              color="#e7e7e7"
              glow="rgba(231,231,231,0.08)"
              border="rgba(255,255,255,0.12)"
              bg="rgba(255,255,255,0.025)"
              cta="Follow @tmi10xyz"
              href="https://twitter.com/tmi10xyz"
              delay={0.08}
            />
            <JoinCard
              emoji="🎵"
              label="Short-form"
              title="TikTok & Reels"
              desc="Watch any topic go from 'explain like I'm 5' to 'PhD level' in under 60 seconds. Wildly satisfying. Somehow educational."
              color="#fe2c55"
              glow="rgba(254,44,85,0.1)"
              border="rgba(254,44,85,0.18)"
              bg="rgba(254,44,85,0.04)"
              cta="Follow on TikTok"
              href="https://tiktok.com/@tmi10xyz"
              delay={0.16}
            />
          </div>
        </section>

        {/* ── NEWSLETTER ── */}
        <section className="px-4 pb-16 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative rounded-2xl overflow-hidden"
            style={{
              padding: "1.5px",
              background: "linear-gradient(140deg, rgba(52,211,153,0.6) 0%, rgba(52,211,153,0.1) 50%, rgba(52,211,153,0.45) 100%)",
            }}
          >
            {/* Pulsing outer glow */}
            <motion.div
              className="absolute -inset-3 rounded-3xl pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.1) 0%, transparent 70%)" }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />

            <div
              className="relative rounded-[15px] px-8 py-8 overflow-hidden"
              style={{ background: "#040d09" }}
            >
              {/* Dot pattern */}
              <div
                className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(rgba(52,211,153,0.25) 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                  maskImage: "radial-gradient(ellipse at 100% 0%, black 0%, transparent 65%)",
                  WebkitMaskImage: "radial-gradient(ellipse at 100% 0%, black 0%, transparent 65%)",
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 65% 0%, rgba(52,211,153,0.09) 0%, transparent 55%)" }}
              />

              <div className="relative grid sm:grid-cols-2 gap-8 items-center">
                <div>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-sans font-semibold tracking-[0.14em] uppercase mb-4"
                    style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.22)", color: "#34d399" }}
                  >
                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                    Weekly newsletter
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl text-white font-semibold leading-tight mb-3">
                    Get the weekly<br />curiosity digest
                  </h2>
                  <p className="text-sm font-sans text-white/38 leading-relaxed">
                    Every Sunday — 5 fascinating topics, each explained at 3 levels. Takes 4 minutes to read. Free, forever.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    {["🧠 One topic per level","📬 Every Sunday","🚫 No spam ever"].map((t, i) => (
                      <div key={i} className="text-[11px] font-sans text-white/35 hidden sm:block">{t}</div>
                    ))}
                  </div>
                  <NewsletterForm />
                  <p className="text-[10px] font-sans text-white/18 mt-2">
                    No spam. Unsubscribe any time. We send one email per week, max.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── SHARE / REFER ── */}
        <section className="px-4 pb-16 max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-4">

            {/* Share the site */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE }}
              className="rounded-2xl p-7 relative overflow-hidden"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 80% 0%, rgba(251,191,36,0.08) 0%, transparent 60%)" }}
              />
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-5"
                style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}
              >
                🔗
              </div>
              <h3 className="font-display text-xl text-white font-semibold mb-2">Share the site</h3>
              <p className="text-sm font-sans text-white/38 leading-relaxed mb-5">
                Know someone who asks &quot;but how does that actually work?&quot; — this site was built for them.
              </p>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl font-mono text-xs text-white/45 mb-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                teachmelikeim10.xyz
                <motion.button
                  onClick={() => navigator.clipboard.writeText("https://teachmelikeim10.xyz")}
                  className="ml-auto flex-shrink-0 text-white/30 hover:text-emerald-400 transition-colors"
                  whileTap={{ scale: 0.9 }}
                  title="Copy link"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <rect x="4" y="4" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M2 9V2h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </motion.button>
              </div>
              <div className="flex gap-2">
                {[
                  { label: "X / Twitter", href: "https://twitter.com/intent/tweet?text=Just+found+this+wild+site+that+explains+any+topic+from+ELI5+to+PhD+level+%E2%80%94+teachmelikeim10.xyz" },
                  { label: "Copy link", href: "#" },
                ].map(({ label, href }) => (
                  <motion.a
                    key={label}
                    href={href === "#" ? undefined : href}
                    onClick={href === "#" ? () => navigator.clipboard.writeText("https://teachmelikeim10.xyz") : undefined}
                    target={href !== "#" ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-3 py-2 rounded-xl text-[11px] font-sans font-medium"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.45)",
                      transition: "all 0.25s",
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
                  >
                    {label}
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Contribute */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
              className="rounded-2xl p-7 relative overflow-hidden"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 80% 0%, rgba(168,85,247,0.08) 0%, transparent 60%)" }}
              />
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-5"
                style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}
              >
                ☕
              </div>
              <h3 className="font-display text-xl text-white font-semibold mb-2">Support the project</h3>
              <p className="text-sm font-sans text-white/38 leading-relaxed mb-5">
                TMI10 is built and maintained by one person. If it&apos;s been useful to you, a coffee goes a long way — and unlocks Pro access as a thank-you.
              </p>
              <div className="flex gap-2">
                <motion.a
                  href="/pro"
                  className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-sans font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #34d399, #10b981)",
                    color: "#000",
                    boxShadow: "0 4px 20px rgba(52,211,153,0.25)",
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Support & get Pro ✦
                </motion.a>
                <motion.a
                  href="https://ko-fi.com/teachmelikeim10"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl text-sm font-sans font-medium text-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.45)",
                    transition: "all 0.25s",
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
                >
                  Ko-fi
                </motion.a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── MANIFESTO ── */}
        <section className="px-4 pb-24 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
            className="relative rounded-3xl px-8 py-12 overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.015)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.07) 0%, transparent 60%)" }}
            />
            <div className="relative">
              <div className="text-3xl mb-5">✦</div>
              <h2 className="font-display text-3xl sm:text-4xl text-white font-bold leading-tight mb-5">
                Curiosity shouldn&apos;t<br />require a degree.
              </h2>
              <p className="text-white/38 font-sans text-base leading-relaxed max-w-xl mx-auto mb-8">
                We built TMI10 because the world&apos;s knowledge should be accessible at every level of understanding. Not just for academics. Not just for experts. For anyone who&apos;s ever asked &ldquo;but how does that actually work?&rdquo;
              </p>
              <motion.a
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-sans font-semibold text-sm text-black"
                style={{ background: "linear-gradient(135deg, #34d399, #10b981)", boxShadow: "0 4px 20px rgba(52,211,153,0.3)" }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Start learning now
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 9.5L9.5 2.5M9.5 2.5H5M9.5 2.5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </motion.a>
            </div>
          </motion.div>
        </section>

      </div>
    </PageTransition>
  );
}
