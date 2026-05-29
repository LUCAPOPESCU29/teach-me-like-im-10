"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useInView,
} from "framer-motion";
import Script from "next/script";
import PageTransition from "@/components/PageTransition";
import {
  getFlashTier,
  getFlashTierDaysRemaining,
  activateFlashTier,
  type FlashTier,
} from "@/lib/flash-limits";

/* eslint-disable @typescript-eslint/no-explicit-any */

const EASE = [0.23, 1, 0.32, 1] as const;

// ─── Plan metadata ────────────────────────────────────────────────────────────
const TIER_META = {
  free: {
    id: "free" as const,
    label: "Free",
    limit: "3",
    limitSuffix: "/ hour",
    color: "#34d399",
    rgb: "52,211,153",
    price: null,
    priceLabel: "Always free",
    badge: null,
    features: [
      "General Flash",
      "Math Flash",
      "7 animated insight cards",
      "3 flashes per hour",
    ],
    planKey: null,
  },
  pro: {
    id: "pro" as const,
    label: "Flash Pro",
    limit: "25",
    limitSuffix: "/ day",
    color: "#f59e0b",
    rgb: "245,158,11",
    price: "$3.50",
    priceLabel: "per month",
    badge: null,
    features: [
      "Everything in Free",
      "25 flashes per day",
      "Science Flash",
      "History Flash",
      "Code Flash",
      "Flash history (last 20)",
      "No hourly limits",
    ],
    planKey: "flash-pro" as const,
  },
  exec: {
    id: "exec" as const,
    label: "Flash Executive",
    limit: "190",
    limitSuffix: "/ 12h",
    color: "#818cf8",
    rgb: "129,140,248",
    price: "$12",
    priceLabel: "per month",
    badge: "MOST POWER",
    features: [
      "Everything in Pro",
      "190 flashes per 12 hours",
      "Priority for power users",
      "Unlimited history",
    ],
    planKey: "flash-exec" as const,
  },
} as const;

type PlanKey = "flash-pro" | "flash-exec";

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1800;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ─── Scroll progress bar ──────────────────────────────────────────────────────
function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-50 pointer-events-none"
      style={{ scaleX, background: "linear-gradient(90deg,#f59e0b,#fb923c,#818cf8)" }}
    />
  );
}

// ─── Feature comparison row ───────────────────────────────────────────────────
function CompareRow({ label, free, pro, exec, i }: {
  label: string; free: boolean | string; pro: boolean | string; exec: boolean | string; i: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const check = (c: string) => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 6.5l3.2 3.2L11 3.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -12 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.45, delay: i * 0.04, ease: EASE }}
      className="grid grid-cols-[1fr_80px_80px_80px] items-center py-3 border-b border-white/[0.04] group hover:bg-white/[0.02] transition-colors px-3 rounded-lg"
    >
      <span className="text-sm font-sans text-white/50 group-hover:text-white/75 transition-colors">{label}</span>
      <div className="flex justify-center">
        {free === true ? check("#34d399") : free === false ? <span className="text-white/12 text-base leading-none">—</span> : <span className="text-white/40 text-xs font-sans">{free}</span>}
      </div>
      <div className="flex justify-center">
        {pro === true ? check("#f59e0b") : pro === false ? <span className="text-white/12 text-base leading-none">—</span> : <span className="text-amber-400 text-xs font-sans font-medium">{pro}</span>}
      </div>
      <div className="flex justify-center">
        {exec === true ? check("#818cf8") : exec === false ? <span className="text-white/12 text-base leading-none">—</span> : <span className="text-indigo-400 text-xs font-sans font-medium">{exec}</span>}
      </div>
    </motion.div>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────
function SuccessCard({ tierLabel, planKey, router }: {
  tierLabel: string; planKey: PlanKey; router: ReturnType<typeof useRouter>;
}) {
  const isExec = planKey === "flash-exec";
  const color = isExec ? "#818cf8" : "#f59e0b";
  const rgb = isExec ? "129,140,248" : "245,158,11";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex flex-col items-center justify-center min-h-screen px-4 text-center"
    >
      <div className="relative mb-10">
        {[1, 2, 3].map((i) => (
          <motion.div key={i} className="absolute inset-0 rounded-full"
            style={{ border: `1px solid rgba(${rgb},${0.35 / i})`, scale: 1 + i * 0.38 }}
            animate={{ opacity: [0.8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.45, ease: "easeOut" }} />
        ))}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 16 }}
          className="relative w-24 h-24 rounded-[24px] flex items-center justify-center text-4xl z-10"
          style={{ background: `radial-gradient(ellipse at 40% 30%, rgba(${rgb},0.2) 0%, rgba(${rgb},0.06) 100%)`, border: `1px solid rgba(${rgb},0.35)`, boxShadow: `0 0 80px rgba(${rgb},0.25), 0 0 160px rgba(${rgb},0.08)` }}
        >
          ✅
        </motion.div>
      </div>
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="text-[11px] font-sans font-bold uppercase tracking-[0.24em] mb-4" style={{ color }}>
        Payment confirmed
      </motion.p>
      <motion.h2 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
        className="font-sans font-black text-4xl sm:text-5xl text-white mb-4" style={{ letterSpacing: "-0.035em" }}>
        You&apos;re on{" "}
        <span style={{ background: `linear-gradient(135deg,${color},rgba(${rgb},0.7))`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{tierLabel}</span>
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
        className="text-white/40 font-sans text-base mb-12">
        {isExec ? "190 flashes every 12 hours" : "25 flashes every day"} — starts immediately.
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        onClick={() => router.push("/flash")}
        className="group relative px-10 py-4 rounded-2xl font-sans font-bold text-sm overflow-hidden"
        style={{ background: `linear-gradient(135deg,${color},rgba(${rgb},0.75))`, color: "#050505", boxShadow: `0 4px 32px rgba(${rgb},0.35)` }}>
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.22) 50%,transparent 70%)" }}
          animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }} />
        <span className="relative z-10 flex items-center gap-2">
          Start Flashing
          <motion.span className="inline-block" animate={{ x: [0, 3, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>→</motion.span>
        </span>
      </motion.button>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function FlashUpgradePage() {
  const router = useRouter();
  const [currentTier, setCurrentTier] = useState<FlashTier>("free");
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [error, setError] = useState("");
  const [succeeded, setSucceeded] = useState(false);
  const [activatedTier, setActivatedTier] = useState("");
  const [activatedPlanKey, setActivatedPlanKey] = useState<PlanKey>("flash-pro");
  const buttonsRendered = useRef(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(heroScroll, [0, 1], ["0%", "28%"]);
  const heroOpacity = useTransform(heroScroll, [0, 0.55], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 1], [1, 0.92]);

  useEffect(() => {
    setCurrentTier(getFlashTier());
    setDaysRemaining(getFlashTierDaysRemaining());
  }, []);

  useEffect(() => {
    if (!sdkLoaded || !window.paypal || buttonsRendered.current) return;
    buttonsRendered.current = true;

    const renderFor = async (planKey: PlanKey, containerId: string) => {
      const container = document.getElementById(containerId);
      if (!container || !window.paypal) return;
      container.innerHTML = "";
      const buttons = window.paypal.Buttons({
        style: { layout: "horizontal", color: "gold", shape: "rect", label: "pay", height: 48, tagline: false },
        createOrder: async () => {
          setError("");
          const res = await fetch("/api/flash/checkout", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan: planKey }),
          });
          const data = await res.json();
          if (!res.ok || data.error) { setError(data.error || "Failed to create order"); throw new Error(); }
          return data.orderId;
        },
        onApprove: async (data: { orderID: string }) => {
          setError("");
          try {
            const res = await fetch("/api/flash/capture", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: data.orderID, plan: planKey }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) { setError(result.error || "Payment capture failed"); return; }
            activateFlashTier(result.tier, result.expiresAt);
            setActivatedTier(result.tier === "pro" ? "Flash Pro" : "Flash Executive");
            setActivatedPlanKey(planKey);
            setSucceeded(true);
          } catch { setError("Something went wrong. Please contact support."); }
        },
        onError: () => setError("PayPal encountered an error. Please try again."),
      });
      if (buttons.isEligible && !buttons.isEligible()) return;
      await buttons.render(`#${containerId}`);
    };

    Promise.all([
      renderFor("flash-pro", "paypal-pro-container"),
      renderFor("flash-exec", "paypal-exec-container"),
    ]);
  }, [sdkLoaded]);

  if (succeeded) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-[#050505]">
          <SuccessCard tierLabel={activatedTier} planKey={activatedPlanKey} router={router} />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <ScrollBar />

      {/* PayPal SDK */}
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&components=buttons&intent=capture&currency=USD`}
        onLoad={() => setSdkLoaded(true)}
        strategy="afterInteractive"
      />

      <div className="min-h-screen bg-[#050505] relative overflow-x-hidden">

        {/* ── Fixed ambient background ── */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          {/* Orbs */}
          <motion.div className="absolute rounded-full"
            style={{ width: 700, height: 700, top: "-15%", left: "-10%", background: "radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 65%)", filter: "blur(80px)" }}
            animate={{ x: [0, 40, 0], y: [0, 30, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div className="absolute rounded-full"
            style={{ width: 600, height: 600, top: "30%", right: "-12%", background: "radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 65%)", filter: "blur(100px)" }}
            animate={{ x: [0, -35, 0], y: [0, 40, 0] }} transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 5 }} />
          <motion.div className="absolute rounded-full"
            style={{ width: 500, height: 500, bottom: "5%", left: "30%", background: "radial-gradient(circle, rgba(251,146,60,0.05) 0%, transparent 65%)", filter: "blur(90px)" }}
            animate={{ x: [0, 25, 0], y: [0, -20, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 10 }} />

          {/* Dot grid */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "radial-gradient(circle, rgba(245,158,11,0.12) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
            mask: "radial-gradient(ellipse 80% 70% at 50% 20%, black 0%, transparent 80%)",
            WebkitMask: "radial-gradient(ellipse 80% 70% at 50% 20%, black 0%, transparent 80%)",
          }} />

          {/* Noise grain */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`, backgroundSize: "180px 180px" }} />
        </div>

        {/* ── Back nav ── */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          onClick={() => router.push("/flash")}
          className="fixed top-6 left-6 z-40 flex items-center gap-1.5 text-xs font-sans text-white/30 hover:text-white/65 transition-colors duration-200">
          ← Flash
        </motion.button>

        {/* ════════════════════════════════════════
            HERO — full-screen parallax
        ════════════════════════════════════════ */}
        <section ref={heroRef} className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 overflow-hidden">
          <motion.div
            style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
            className="flex flex-col items-center text-center"
          >
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: -14, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
              style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
              </span>
              <span className="text-amber-400 text-[10px] font-sans font-semibold tracking-[0.2em] uppercase">Flash Suite · Upgrade</span>
            </motion.div>

            {/* Main headline */}
            <h1 className="relative mb-6 leading-none select-none" style={{ perspective: "800px" }}>
              {"FLASH PRO".split("").map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 40, rotateX: 80, filter: "blur(12px)" }}
                  animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.65, delay: 0.1 + i * 0.045, ease: EASE }}
                  style={{
                    display: "inline-block",
                    whiteSpace: ch === " " ? "pre" : undefined,
                    fontFamily: "inherit",
                    fontSize: "clamp(64px, 13vw, 140px)",
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    background: ch === " "
                      ? undefined
                      : "linear-gradient(160deg, #fde68a 0%, #f59e0b 40%, #d97706 70%, #fbbf24 100%)",
                    WebkitBackgroundClip: ch === " " ? undefined : "text",
                    WebkitTextFillColor: ch === " " ? undefined : "transparent",
                    backgroundClip: ch === " " ? undefined : "text",
                  }}
                >
                  {ch}
                </motion.span>
              ))}
            </h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65, ease: EASE }}
              className="text-white/40 font-sans text-base sm:text-lg max-w-[420px] leading-relaxed mb-14"
            >
              Unlock unlimited learning — any topic, any mode, at the speed of thought.
            </motion.p>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.8, ease: EASE }}
              className="flex items-center gap-0 rounded-2xl overflow-hidden mb-12"
              style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)" }}
            >
              {[
                { n: 3, suffix: "", unit: "/ hour", label: "Free", color: "#34d399", rgb: "52,211,153" },
                { n: 25, suffix: "", unit: "/ day", label: "Flash Pro", color: "#f59e0b", rgb: "245,158,11" },
                { n: 190, suffix: "", unit: "/ 12h", label: "Executive", color: "#818cf8", rgb: "129,140,248" },
              ].map((s, i) => (
                <div key={s.label} className="flex flex-col items-center px-8 py-4 relative">
                  {i > 0 && <div className="absolute left-0 top-3 bottom-3 w-px bg-white/[0.06]" />}
                  <span className="font-sans font-black text-3xl text-white mb-0.5" style={{ letterSpacing: "-0.04em" }}>
                    <AnimCounter to={s.n} />
                  </span>
                  <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.16em]" style={{ color: s.color }}>{s.unit}</span>
                  <span className="text-[10px] font-sans text-white/25 mt-0.5">{s.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Scroll cue */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-[10px] font-sans text-white/20 uppercase tracking-widest">Compare plans</span>
              <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
                <div className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center pt-1.5">
                  <div className="w-1 h-2 rounded-full bg-white/20" />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* ════════════════════════════════════════
            PLAN CARDS
        ════════════════════════════════════════ */}
        <section className="relative py-8 pb-28 px-4">
          <div className="max-w-5xl mx-auto">

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-10 px-5 py-3.5 rounded-2xl text-sm font-sans text-red-400 text-center"
                  style={{ backgroundColor: "rgba(251,113,133,0.07)", border: "1px solid rgba(251,113,133,0.2)" }}>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Current plan indicator */}
            {currentTier !== "free" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="flex justify-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-sans"
                  style={{
                    background: currentTier === "pro" ? "rgba(245,158,11,0.08)" : "rgba(129,140,248,0.08)",
                    border: `1px solid ${currentTier === "pro" ? "rgba(245,158,11,0.22)" : "rgba(129,140,248,0.22)"}`,
                    color: currentTier === "pro" ? "#f59e0b" : "#818cf8",
                  }}>
                  ⚡ {currentTier === "pro" ? "Flash Pro" : "Flash Executive"} · {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
                </div>
              </motion.div>
            )}

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">

              {/* ── FREE ── */}
              {(["free", "pro", "exec"] as const).map((tierKey, i) => {
                const t = TIER_META[tierKey];
                const isCurrent = currentTier === tierKey;
                const isMiddle = tierKey === "pro";

                return (
                  <motion.div
                    key={tierKey}
                    initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.65, delay: i * 0.1, ease: EASE }}
                    className="relative flex flex-col"
                    style={{ zIndex: isMiddle ? 2 : 1 }}
                  >
                    {/* Double-Bezel outer shell */}
                    <div
                      className="relative rounded-[28px] p-[1.5px] flex-1 flex flex-col"
                      style={{
                        background: isMiddle
                          ? `linear-gradient(140deg, rgba(${t.rgb},0.55) 0%, rgba(${t.rgb},0.1) 45%, rgba(${t.rgb},0.4) 100%)`
                          : `linear-gradient(140deg, rgba(${t.rgb},0.22) 0%, rgba(${t.rgb},0.04) 50%, rgba(${t.rgb},0.16) 100%)`,
                        boxShadow: isMiddle
                          ? `0 0 80px rgba(${t.rgb},0.12), 0 0 160px rgba(${t.rgb},0.04)`
                          : "none",
                        transform: isMiddle ? "scale(1.02)" : "scale(1)",
                        transition: "transform 0.35s cubic-bezier(0.23,1,0.32,1)",
                      }}
                    >
                      {/* Inner core */}
                      <div
                        className="relative rounded-[calc(28px-1.5px)] overflow-hidden flex flex-col flex-1 p-6"
                        style={{ background: isMiddle ? `radial-gradient(ellipse at 30% 0%, rgba(${t.rgb},0.1) 0%, #0a0804 60%)` : "#050505" }}
                      >
                        {/* Inner highlight */}
                        <div className="absolute inset-0 pointer-events-none rounded-[calc(28px-1.5px)]"
                          style={{ boxShadow: `inset 0 1px 1px rgba(255,255,255,${isMiddle ? "0.1" : "0.05"})` }} />

                        {/* Shimmer sweep */}
                        {isMiddle && (
                          <motion.div className="absolute inset-0 pointer-events-none"
                            style={{ background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.055) 50%,transparent 70%)" }}
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ duration: 3.2, repeat: Infinity, ease: "linear", repeatDelay: 4 }} />
                        )}

                        {/* Badge row */}
                        <div className="flex items-center justify-between mb-5">
                          <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl"
                            style={{ background: `rgba(${t.rgb},0.12)`, border: `1px solid rgba(${t.rgb},0.25)`, boxShadow: isMiddle ? `0 0 24px rgba(${t.rgb},0.2)` : "none" }}>
                            ⚡
                          </div>
                          {isCurrent && (
                            <motion.div
                              initial={{ scale: 0 }} animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 18 }}
                              className="px-2.5 py-1 rounded-full text-[9px] font-sans font-bold uppercase tracking-[0.12em]"
                              style={{ background: `rgba(${t.rgb},0.14)`, color: t.color, border: `1px solid rgba(${t.rgb},0.28)` }}>
                              Current Plan
                            </motion.div>
                          )}
                          {!isCurrent && t.badge && (
                            <div className="px-2.5 py-1 rounded-full text-[9px] font-sans font-bold uppercase tracking-[0.12em]"
                              style={{ background: `rgba(${t.rgb},0.12)`, color: t.color, border: `1px solid rgba(${t.rgb},0.24)` }}>
                              {t.badge}
                            </div>
                          )}
                        </div>

                        {/* Plan name */}
                        <p className="font-sans font-black text-xl text-white mb-1" style={{ letterSpacing: "-0.025em" }}>{t.label}</p>

                        {/* Limit */}
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className="font-sans font-black text-3xl" style={{ color: t.color, letterSpacing: "-0.04em" }}>{t.limit}</span>
                          <span className="text-sm font-sans text-white/35">{t.limitSuffix}</span>
                        </div>

                        {/* Price */}
                        <p className="text-white/28 text-xs font-sans mb-6">
                          {t.price ? <><span className="text-white/50 font-semibold">{t.price}</span> {t.priceLabel}</> : t.priceLabel}
                        </p>

                        {/* Divider */}
                        <div className="h-px mb-6" style={{ background: `linear-gradient(90deg, rgba(${t.rgb},0.25), rgba(${t.rgb},0.04))` }} />

                        {/* Features */}
                        <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                          {t.features.map((f, fi) => (
                            <motion.li key={f}
                              initial={{ opacity: 0, x: -8 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.3 + fi * 0.05, ease: EASE }}
                              className="flex items-start gap-2.5 text-sm font-sans text-white/60">
                              <div className="w-4 h-4 rounded-full shrink-0 mt-0.5 flex items-center justify-center"
                                style={{ background: `rgba(${t.rgb},0.12)`, border: `1px solid rgba(${t.rgb},0.24)` }}>
                                <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                                  <path d="M1 3.5l1.8 1.8L6 1.5" stroke={t.color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                              {f}
                            </motion.li>
                          ))}
                        </ul>

                        {/* CTA */}
                        {tierKey === "free" ? (
                          <div className="w-full py-3.5 rounded-xl text-center text-sm font-sans font-semibold"
                            style={{ background: "rgba(52,211,153,0.05)", color: "rgba(52,211,153,0.35)", border: "1px solid rgba(52,211,153,0.1)", cursor: "default" }}>
                            Current Plan
                          </div>
                        ) : isCurrent ? (
                          <div className="w-full py-3.5 rounded-xl text-center text-sm font-sans font-semibold"
                            style={{ background: `rgba(${t.rgb},0.07)`, color: `rgba(${t.rgb},0.45)`, border: `1px solid rgba(${t.rgb},0.12)`, cursor: "default" }}>
                            {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
                          </div>
                        ) : tierKey === "exec" && currentTier === "free" ? (
                          /* show exec button to free users */
                          <div className="flex flex-col gap-2">
                            {!sdkLoaded && (
                              <div className="w-full h-12 rounded-xl flex items-center justify-center text-xs font-sans text-white/25"
                                style={{ background: `rgba(${t.rgb},0.05)`, border: `1px solid rgba(${t.rgb},0.1)` }}>
                                <span className="w-3.5 h-3.5 border border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin mr-2" />
                                Loading…
                              </div>
                            )}
                            <div id="paypal-exec-container"
                              className={`w-full rounded-xl overflow-hidden transition-opacity duration-300 ${sdkLoaded ? "opacity-100" : "opacity-0 h-0"}`} />
                          </div>
                        ) : tierKey === "pro" && currentTier === "free" ? (
                          /* show pro button to free users */
                          <div className="flex flex-col gap-2">
                            {!sdkLoaded && (
                              <div className="w-full h-12 rounded-xl flex items-center justify-center text-xs font-sans text-white/25"
                                style={{ background: `rgba(${t.rgb},0.05)`, border: `1px solid rgba(${t.rgb},0.1)` }}>
                                <span className="w-3.5 h-3.5 border border-amber-400/30 border-t-amber-500 rounded-full animate-spin mr-2" />
                                Loading…
                              </div>
                            )}
                            <div id="paypal-pro-container"
                              className={`w-full rounded-xl overflow-hidden transition-opacity duration-300 ${sdkLoaded ? "opacity-100" : "opacity-0 h-0"}`} />
                          </div>
                        ) : tierKey === "exec" && currentTier === "pro" ? (
                          /* pro user upgrading to exec */
                          <div className="flex flex-col gap-2">
                            {!sdkLoaded && (
                              <div className="w-full h-12 rounded-xl flex items-center justify-center text-xs font-sans text-white/25"
                                style={{ background: `rgba(${t.rgb},0.05)`, border: `1px solid rgba(${t.rgb},0.1)` }}>
                                <span className="w-3.5 h-3.5 border border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin mr-2" />
                                Loading…
                              </div>
                            )}
                            <div id="paypal-exec-container"
                              className={`w-full rounded-xl overflow-hidden transition-opacity duration-300 ${sdkLoaded ? "opacity-100" : "opacity-0 h-0"}`} />
                          </div>
                        ) : (
                          <div className="w-full py-3.5 rounded-xl text-center text-sm font-sans font-semibold"
                            style={{ background: `rgba(${t.rgb},0.06)`, color: `rgba(${t.rgb},0.35)`, border: `1px solid rgba(${t.rgb},0.1)`, cursor: "default" }}>
                            You&apos;re on Executive
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-5 mt-10"
            >
              {["🔒 Secure checkout via PayPal", "↩ 7-day refund, no questions", "⚡ Activates immediately", "✕ Cancel anytime"].map((t, i) => (
                <motion.span key={t}
                  initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.07, ease: EASE }}
                  className="text-[11px] font-sans text-white/22">{t}</motion.span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FEATURE COMPARISON TABLE
        ════════════════════════════════════════ */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.65, ease: EASE }}
              className="text-center mb-14"
            >
              <p className="font-mono text-[9px] tracking-[0.3em] text-amber-400/50 uppercase mb-3">Every detail</p>
              <h2 className="font-sans font-black text-3xl sm:text-4xl text-white mb-3" style={{ letterSpacing: "-0.03em" }}>
                Compare plans
              </h2>
              <p className="text-white/30 font-sans text-sm">Side by side. No fine print.</p>
            </motion.div>

            {/* Table header */}
            <motion.div
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="grid grid-cols-[1fr_80px_80px_80px] px-3 py-4 mb-1 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-[10px] font-sans text-white/25 uppercase tracking-widest">Feature</span>
              <span className="text-[10px] font-sans text-emerald-400/60 uppercase tracking-widest text-center">Free</span>
              <span className="text-[10px] font-sans text-amber-400/70 uppercase tracking-widest text-center">Pro</span>
              <span className="text-[10px] font-sans text-indigo-400/70 uppercase tracking-widest text-center">Exec</span>
            </motion.div>

            <div className="rounded-xl overflow-hidden border border-white/[0.05] bg-white/[0.012]">
              <div className="px-2 py-2">
                <p className="text-[9px] font-sans text-white/18 uppercase tracking-widest px-3 pt-3 pb-2">Flash Modes</p>
                <CompareRow i={0} label="General Flash" free pro exec />
                <CompareRow i={1} label="Math Flash" free pro exec />
                <CompareRow i={2} label="Science Flash" free={false} pro exec />
                <CompareRow i={3} label="History Flash" free={false} pro exec />
                <CompareRow i={4} label="Code Flash" free={false} pro exec />
                <p className="text-[9px] font-sans text-white/18 uppercase tracking-widest px-3 pt-6 pb-2">Limits</p>
                <CompareRow i={5} label="Flashes per window" free="3 / hour" pro="25 / day" exec="190 / 12h" />
                <CompareRow i={6} label="Hourly cap" free pro={false} exec={false} />
                <CompareRow i={7} label="Reset window" free="Rolling" pro="Midnight UTC" exec="Rolling" />
                <p className="text-[9px] font-sans text-white/18 uppercase tracking-widest px-3 pt-6 pb-2">Features</p>
                <CompareRow i={8} label="7 animated insight cards" free pro exec />
                <CompareRow i={9} label="Flash history (last 20)" free={false} pro exec />
                <CompareRow i={10} label="Unlimited history" free={false} pro={false} exec />
                <CompareRow i={11} label="Priority access" free={false} pro={false} exec />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FINAL CTA SECTION
        ════════════════════════════════════════ */}
        <section className="py-24 pb-40 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
            className="max-w-xl mx-auto relative"
          >
            <div className="absolute inset-0 pointer-events-none blur-[100px]"
              style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(245,158,11,0.1) 0%, transparent 65%)" }} />

            <p className="text-amber-400/60 text-[10px] font-mono uppercase tracking-[0.3em] mb-5">Ready to flash faster?</p>
            <h2 className="font-sans font-black text-4xl sm:text-5xl text-white mb-6" style={{ letterSpacing: "-0.035em" }}>
              Pick your speed.
            </h2>
            <p className="text-white/35 font-sans mb-10 text-base leading-relaxed">
              Flash Pro gives you 25 deep-dives a day.<br />
              Flash Executive gives you 190 every 12 hours.
            </p>

            <motion.button
              onClick={() => { const el = document.getElementById("paypal-pro-container"); el?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="group relative inline-flex items-center gap-3 px-9 py-4 rounded-2xl font-sans font-bold text-sm overflow-hidden"
              style={{ background: "linear-gradient(135deg,#f59e0b,#fb923c)", color: "#050505", boxShadow: "0 4px 40px rgba(245,158,11,0.3)" }}>
              <motion.div className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.25) 50%,transparent 70%)" }}
                animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2.2, repeat: Infinity, ease: "linear", repeatDelay: 2.5 }} />
              <span className="relative z-10">See Flash Pro plans</span>
              <div className="relative z-10 w-6 h-6 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="#050505" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </motion.button>
          </motion.div>
        </section>

      </div>
    </PageTransition>
  );
}
