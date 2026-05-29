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
    const dur = 1600;
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

// ─── Scroll bar ───────────────────────────────────────────────────────────────
function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div className="fixed top-0 left-0 right-0 h-[2px] origin-left z-50 pointer-events-none"
      style={{ scaleX, background: "linear-gradient(90deg,#fbbf24,#f59e0b,#d97706)" }} />
  );
}

// ─── Feature compare row ──────────────────────────────────────────────────────
function CompareRow({ label, free, pro, exec, i }: {
  label: string; free: boolean | string; pro: boolean | string; exec: boolean | string; i: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const check = (c: string) => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 6.5l3.2 3.2L11 3.5" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, x: -10 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: i * 0.035, ease: EASE }}
      className="grid grid-cols-[1fr_72px_72px_72px] items-center py-3 border-b border-white/[0.04] group hover:bg-white/[0.015] transition-colors px-3 rounded-lg">
      <span className="text-sm font-sans text-white/45 group-hover:text-white/70 transition-colors">{label}</span>
      <div className="flex justify-center">
        {free === true ? check("#34d399") : free === false ? <span className="text-white/10">—</span> : <span className="text-white/40 text-xs font-sans">{free}</span>}
      </div>
      <div className="flex justify-center">
        {pro === true ? check("#f59e0b") : pro === false ? <span className="text-white/10">—</span> : <span className="text-amber-400 text-xs font-sans font-medium">{pro}</span>}
      </div>
      <div className="flex justify-center">
        {exec === true ? check("#818cf8") : exec === false ? <span className="text-white/10">—</span> : <span className="text-indigo-400 text-xs font-sans font-medium">{exec}</span>}
      </div>
    </motion.div>
  );
}

// ─── PayPal button slot ───────────────────────────────────────────────────────
function PayPalSlot({ id, sdkLoaded, color, rgb, timedOut }: {
  id: string; sdkLoaded: boolean; color: string; rgb: string; timedOut: boolean;
}) {
  if (timedOut) return (
    <a href="https://www.paypal.com" target="_blank" rel="noopener noreferrer"
      className="w-full py-3.5 rounded-xl text-sm font-sans font-semibold text-center flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
      style={{ background: "#FFC439", color: "#000" }}>
      Pay with PayPal ↗
    </a>
  );
  return (
    <div className="flex flex-col gap-2">
      {!sdkLoaded && (
        <div className="w-full h-12 rounded-xl flex items-center justify-center text-xs font-sans text-white/30"
          style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.1)` }}>
          <span className="w-3.5 h-3.5 border border-t-current rounded-full animate-spin mr-2 opacity-40" style={{ borderColor: color }} />
          Loading payment…
        </div>
      )}
      <div id={id}
        className={`w-full rounded-xl overflow-hidden transition-opacity duration-300 ${sdkLoaded ? "opacity-100" : "opacity-0 h-0"}`} />
    </div>
  );
}

// ─── Success ──────────────────────────────────────────────────────────────────
function SuccessCard({ tierLabel, planKey, router }: {
  tierLabel: string; planKey: PlanKey; router: ReturnType<typeof useRouter>;
}) {
  const isExec = planKey === "flash-exec";
  const color = isExec ? "#818cf8" : "#f59e0b";
  const rgb = isExec ? "129,140,248" : "245,158,11";
  return (
    <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="relative mb-10">
        {[1, 2, 3].map((i) => (
          <motion.div key={i} className="absolute inset-0 rounded-full"
            style={{ border: `1px solid rgba(${rgb},${0.35 / i})`, scale: 1 + i * 0.38 }}
            animate={{ opacity: [0.8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.45, ease: "easeOut" }} />
        ))}
        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 16 }}
          className="relative w-24 h-24 rounded-[24px] flex items-center justify-center text-4xl z-10"
          style={{ background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.28)`, boxShadow: `0 0 80px rgba(${rgb},0.2)` }}>
          ✅
        </motion.div>
      </div>
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="text-[10px] font-sans font-semibold uppercase tracking-[0.22em] mb-4" style={{ color }}>
        Payment confirmed
      </motion.p>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="font-display text-4xl sm:text-5xl text-white mb-4 leading-tight">
        You&apos;re on{" "}
        <span style={{ background: `linear-gradient(135deg,${color},rgba(${rgb},0.65))`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          {tierLabel}
        </span>
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
        className="text-white/38 font-sans text-base mb-12">
        {isExec ? "190 flashes every 12 hours" : "25 flashes every day"} — starts immediately.
      </motion.p>
      <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        onClick={() => router.push("/flash")}
        className="group relative px-10 py-4 rounded-2xl font-sans font-bold text-sm overflow-hidden"
        style={{ background: `linear-gradient(135deg,${color},rgba(${rgb},0.7))`, color: "#050505", boxShadow: `0 4px 32px rgba(${rgb},0.3)` }}>
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.22) 50%,transparent 70%)" }}
          animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 2 }} />
        <span className="relative z-10 flex items-center gap-2.5">
          Start Flashing
          <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>→</motion.span>
        </span>
      </motion.button>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function FlashUpgradePage() {
  const router = useRouter();
  const [currentTier, setCurrentTier] = useState<FlashTier>("free");
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [sdkTimedOut, setSdkTimedOut] = useState(false);
  const [error, setError] = useState("");
  const [succeeded, setSucceeded] = useState(false);
  const [activatedTier, setActivatedTier] = useState("");
  const [activatedPlanKey, setActivatedPlanKey] = useState<PlanKey>("flash-pro");
  const buttonsRendered = useRef(false);
  const sdkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(heroScroll, [0, 1], ["0%", "22%"]);
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0]);

  useEffect(() => {
    setCurrentTier(getFlashTier());
    setDaysRemaining(getFlashTierDaysRemaining());
    // Bail-out: if PayPal SDK hasn't loaded in 9s, show fallback
    sdkTimeoutRef.current = setTimeout(() => {
      if (!buttonsRendered.current) setSdkTimedOut(true);
    }, 9000);
    return () => { if (sdkTimeoutRef.current) clearTimeout(sdkTimeoutRef.current); };
  }, []);

  useEffect(() => {
    if (!sdkLoaded) return;
    if (buttonsRendered.current) return;
    if (!window.paypal) { setSdkTimedOut(true); return; }

    buttonsRendered.current = true;
    if (sdkTimeoutRef.current) clearTimeout(sdkTimeoutRef.current);

    const renderFor = async (planKey: PlanKey, containerId: string) => {
      const container = document.getElementById(containerId);
      if (!container || !window.paypal) return;
      container.innerHTML = "";
      try {
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
        // Only skip if definitely ineligible; otherwise always try to render
        if (buttons.isEligible && buttons.isEligible() === false) {
          setSdkTimedOut(true);
          return;
        }
        await buttons.render(`#${containerId}`);
      } catch {
        setSdkTimedOut(true);
      }
    };

    Promise.all([
      renderFor("flash-pro", "paypal-pro-container"),
      renderFor("flash-exec", "paypal-exec-container"),
    ]);
  }, [sdkLoaded]);

  if (succeeded) return (
    <PageTransition>
      <div className="min-h-screen bg-[#030609]">
        <SuccessCard tierLabel={activatedTier} planKey={activatedPlanKey} router={router} />
      </div>
    </PageTransition>
  );

  return (
    <PageTransition>
      <ScrollBar />
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&components=buttons&intent=capture&currency=USD`}
        onLoad={() => setSdkLoaded(true)}
        onError={() => setSdkTimedOut(true)}
        strategy="afterInteractive"
      />

      <div className="min-h-screen bg-[#030609] relative overflow-x-hidden">

        {/* ── Fixed background layers ── */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          {/* Emerald top orb — matches site */}
          <motion.div className="absolute rounded-full"
            style={{ width: 700, height: 700, top: "-20%", left: "50%", x: "-50%", background: "radial-gradient(circle, rgba(52,211,153,0.09) 0%, transparent 65%)", filter: "blur(100px)" }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />
          {/* Amber accent orb */}
          <motion.div className="absolute rounded-full"
            style={{ width: 500, height: 500, top: "25%", right: "-8%", background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 65%)", filter: "blur(90px)" }}
            animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 4 }} />
          {/* Indigo bottom orb */}
          <motion.div className="absolute rounded-full"
            style={{ width: 450, height: 450, bottom: "5%", left: "15%", background: "radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 65%)", filter: "blur(80px)" }}
            animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 8 }} />
          {/* Site grid */}
          <div className="absolute inset-0 opacity-[0.018]"
            style={{ backgroundImage: "linear-gradient(rgba(52,211,153,1) 1px,transparent 1px),linear-gradient(90deg,rgba(52,211,153,1) 1px,transparent 1px)", backgroundSize: "72px 72px" }} />
        </div>

        {/* ── Back nav ── */}
        <motion.button
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          onClick={() => router.push("/flash")}
          className="fixed top-6 left-6 z-40 flex items-center gap-1.5 text-xs font-sans text-white/28 hover:text-white/60 transition-colors duration-200">
          ← Flash
        </motion.button>

        {/* ════════════════ HERO ════════════════ */}
        <section ref={heroRef} className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 overflow-hidden">
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="flex flex-col items-center text-center">

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
              style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-70" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
              </span>
              <span className="text-amber-400/85 text-[10px] font-sans font-semibold tracking-[0.2em] uppercase">Flash Suite · Upgrade</span>
            </motion.div>

            {/* Headline — font-display (Instrument Serif) matching site */}
            <div className="relative mb-5" style={{ perspective: "900px" }}>
              {["FLASH", " ", "PRO"].map((word, wi) =>
                word === " " ? <span key={wi} style={{ display: "inline-block", width: "0.35em" }} /> :
                word.split("").map((ch, ci) => {
                  const globalIdx = wi === 0 ? ci : wi === 2 ? 6 + ci : ci;
                  return (
                    <motion.span key={`${wi}-${ci}`}
                      initial={{ opacity: 0, y: 48, rotateX: 75, filter: "blur(14px)" }}
                      animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
                      transition={{ duration: 0.7, delay: 0.08 + globalIdx * 0.048, ease: EASE }}
                      style={{
                        display: "inline-block",
                        fontFamily: "Instrument Serif, serif",
                        fontSize: "clamp(64px, 14vw, 130px)",
                        fontWeight: 400,
                        fontStyle: "italic",
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                        background: "linear-gradient(160deg, #fde68a 0%, #fbbf24 30%, #f59e0b 65%, #d97706 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}>
                      {ch}
                    </motion.span>
                  );
                })
              )}
            </div>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.65, ease: EASE }}
              className="text-white/38 font-sans text-base sm:text-lg max-w-[400px] leading-relaxed mb-14">
              Unlock unlimited learning — any topic, any mode, at the speed of thought.
            </motion.p>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8, ease: EASE }}
              className="flex items-stretch rounded-2xl overflow-hidden mb-14"
              style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)", backdropFilter: "blur(12px)" }}>
              {[
                { n: 3, unit: "/ hour", label: "Free", color: "#34d399" },
                { n: 25, unit: "/ day", label: "Flash Pro", color: "#f59e0b" },
                { n: 190, unit: "/ 12h", label: "Executive", color: "#818cf8" },
              ].map((s, i) => (
                <div key={s.label} className="flex flex-col items-center px-7 py-5 relative">
                  {i > 0 && <div className="absolute left-0 top-4 bottom-4 w-px bg-white/[0.06]" />}
                  <span className="font-display text-3xl sm:text-4xl text-white mb-0.5" style={{ letterSpacing: "-0.02em" }}>
                    <AnimCounter to={s.n} />
                  </span>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-[0.14em]" style={{ color: s.color }}>{s.unit}</span>
                  <span className="text-[10px] font-sans text-white/22 mt-0.5">{s.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Scroll cue */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
              className="flex flex-col items-center gap-2">
              <span className="text-[9px] font-sans text-white/18 uppercase tracking-widest">Compare plans</span>
              <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
                <div className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center pt-1.5">
                  <div className="w-1 h-2 rounded-full bg-white/20" />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* ════════════════ PLAN CARDS ════════════════ */}
        <section className="relative pb-28 px-4">
          <div className="max-w-5xl mx-auto">

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-10 px-5 py-3.5 rounded-2xl text-sm font-sans text-red-400 text-center"
                  style={{ background: "rgba(251,113,133,0.07)", border: "1px solid rgba(251,113,133,0.18)" }}>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {currentTier !== "free" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mb-10">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              {(["free", "pro", "exec"] as const).map((tierKey, i) => {
                const t = TIER_META[tierKey];
                const isCurrent = currentTier === tierKey;
                const isHighlighted = tierKey === "pro";

                // Which PayPal container to show for this card
                const showProButton = tierKey === "pro" && currentTier === "free";
                const showExecButtonOnExec = tierKey === "exec" && currentTier !== "exec";
                const showExecButtonOnPro = tierKey === "exec" && currentTier === "pro";

                return (
                  <motion.div key={tierKey}
                    initial={{ opacity: 0, y: 36, filter: "blur(8px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
                    className="relative flex flex-col rounded-2xl overflow-hidden"
                    style={{
                      background: isHighlighted
                        ? `radial-gradient(ellipse at 40% 0%, rgba(${t.rgb},0.12) 0%, #070705 60%)`
                        : "rgba(255,255,255,0.02)",
                      border: `1px solid rgba(${t.rgb},${isHighlighted ? 0.35 : 0.18})`,
                      boxShadow: isHighlighted ? `0 0 80px rgba(${t.rgb},0.08), 0 0 160px rgba(${t.rgb},0.03)` : "none",
                      transform: isHighlighted ? "scale(1.025)" : "scale(1)",
                    }}>

                    {/* Shimmer on highlighted card */}
                    {isHighlighted && (
                      <motion.div className="absolute inset-0 pointer-events-none"
                        style={{ background: "linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.04) 50%,transparent 65%)" }}
                        animate={{ x: ["-100%", "220%"] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "linear", repeatDelay: 5 }} />
                    )}

                    {/* Inner highlight line */}
                    <div className="absolute inset-0 pointer-events-none rounded-2xl"
                      style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,${isHighlighted ? 0.09 : 0.04})` }} />

                    <div className="relative p-6 flex flex-col flex-1">
                      {/* Badge row */}
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl"
                          style={{ background: `rgba(${t.rgb},0.1)`, border: `1px solid rgba(${t.rgb},0.22)`, boxShadow: isHighlighted ? `0 0 20px rgba(${t.rgb},0.18)` : "none" }}>
                          ⚡
                        </div>
                        {isCurrent && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 18 }}
                            className="px-2.5 py-1 rounded-full text-[9px] font-sans font-bold uppercase tracking-[0.12em]"
                            style={{ background: `rgba(${t.rgb},0.12)`, color: t.color, border: `1px solid rgba(${t.rgb},0.25)` }}>
                            Current Plan
                          </motion.div>
                        )}
                        {!isCurrent && t.badge && (
                          <div className="px-2.5 py-1 rounded-full text-[9px] font-sans font-bold uppercase tracking-[0.12em]"
                            style={{ background: `rgba(${t.rgb},0.1)`, color: t.color, border: `1px solid rgba(${t.rgb},0.22)` }}>
                            {t.badge}
                          </div>
                        )}
                      </div>

                      {/* Plan name — font-display */}
                      <p className="font-display text-2xl text-white mb-1 leading-tight" style={{ fontStyle: "italic" }}>{t.label}</p>

                      {/* Limit */}
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="font-display text-4xl" style={{ color: t.color, letterSpacing: "-0.02em" }}>{t.limit}</span>
                        <span className="text-sm font-sans text-white/30">{t.limitSuffix}</span>
                      </div>

                      {/* Price */}
                      <p className="text-white/25 text-xs font-sans mb-6">
                        {t.price ? <><span className="text-white/45 font-semibold text-sm">{t.price}</span> {t.priceLabel}</> : t.priceLabel}
                      </p>

                      {/* Divider */}
                      <div className="h-px mb-5" style={{ background: `linear-gradient(90deg, rgba(${t.rgb},0.3), rgba(${t.rgb},0.04))` }} />

                      {/* Features */}
                      <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                        {t.features.map((f, fi) => (
                          <motion.li key={f}
                            initial={{ opacity: 0, x: -6 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.25 + fi * 0.055, ease: EASE }}
                            className="flex items-start gap-2.5 text-sm font-sans text-white/55">
                            <div className="w-4 h-4 rounded-full shrink-0 mt-0.5 flex items-center justify-center"
                              style={{ background: `rgba(${t.rgb},0.1)`, border: `1px solid rgba(${t.rgb},0.22)` }}>
                              <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                                <path d="M1 3.5l1.8 1.8L6 1.5" stroke={t.color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            {f}
                          </motion.li>
                        ))}
                      </ul>

                      {/* CTA slot */}
                      {tierKey === "free" || isCurrent ? (
                        <div className="w-full py-3.5 rounded-xl text-center text-sm font-sans font-medium"
                          style={{ background: `rgba(${t.rgb},0.05)`, color: `rgba(${t.rgb},${isCurrent && tierKey !== "free" ? 0.5 : 0.3})`, border: `1px solid rgba(${t.rgb},0.1)`, cursor: "default" }}>
                          {tierKey === "free" && currentTier === "free" ? "Current Plan"
                            : tierKey === "free" ? "Free Plan"
                            : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`}
                        </div>
                      ) : showProButton ? (
                        <PayPalSlot id="paypal-pro-container" sdkLoaded={sdkLoaded} color={t.color} rgb={t.rgb} timedOut={sdkTimedOut} />
                      ) : (showExecButtonOnExec || showExecButtonOnPro) ? (
                        <PayPalSlot id="paypal-exec-container" sdkLoaded={sdkLoaded} color={t.color} rgb={t.rgb} timedOut={sdkTimedOut} />
                      ) : tierKey === "exec" && currentTier === "exec" ? null : (
                        <div className="w-full py-3.5 rounded-xl text-center text-sm font-sans font-medium"
                          style={{ background: `rgba(${t.rgb},0.05)`, color: `rgba(${t.rgb},0.3)`, border: `1px solid rgba(${t.rgb},0.1)`, cursor: "default" }}>
                          You&apos;re on Executive
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Trust strip */}
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-10">
              {["🔒 Secure via PayPal", "↩ 7-day refund", "⚡ Activates immediately", "✕ Cancel anytime"].map((item, i) => (
                <motion.span key={item}
                  initial={{ opacity: 0, y: 4 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.07, ease: EASE }}
                  className="text-[11px] font-sans text-white/20">{item}</motion.span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════ COMPARE TABLE ════════════════ */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE }} className="text-center mb-14">
              <p className="font-mono text-[9px] tracking-[0.3em] text-amber-400/45 uppercase mb-3">Side by side</p>
              <h2 className="font-display text-3xl sm:text-4xl text-white mb-3 leading-tight" style={{ fontStyle: "italic" }}>Compare plans</h2>
              <p className="text-white/28 font-sans text-sm">Every detail. No fine print.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="grid grid-cols-[1fr_72px_72px_72px] px-3 py-4 mb-1 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-[10px] font-sans text-white/22 uppercase tracking-widest">Feature</span>
              <span className="text-[10px] font-sans text-emerald-400/55 uppercase tracking-widest text-center">Free</span>
              <span className="text-[10px] font-sans text-amber-400/65 uppercase tracking-widest text-center">Pro</span>
              <span className="text-[10px] font-sans text-indigo-400/65 uppercase tracking-widest text-center">Exec</span>
            </motion.div>

            <div className="rounded-xl overflow-hidden border border-white/[0.05] bg-white/[0.01]">
              <div className="px-2 py-2">
                <p className="text-[9px] font-sans text-white/15 uppercase tracking-widest px-3 pt-3 pb-2">Flash Modes</p>
                <CompareRow i={0} label="General Flash" free pro exec />
                <CompareRow i={1} label="Math Flash" free pro exec />
                <CompareRow i={2} label="Science Flash" free={false} pro exec />
                <CompareRow i={3} label="History Flash" free={false} pro exec />
                <CompareRow i={4} label="Code Flash" free={false} pro exec />
                <p className="text-[9px] font-sans text-white/15 uppercase tracking-widest px-3 pt-6 pb-2">Limits</p>
                <CompareRow i={5} label="Flashes per window" free="3 / hr" pro="25 / day" exec="190 / 12h" />
                <CompareRow i={6} label="Hourly cap" free pro={false} exec={false} />
                <p className="text-[9px] font-sans text-white/15 uppercase tracking-widest px-3 pt-6 pb-2">Features</p>
                <CompareRow i={7} label="Flash history (last 20)" free={false} pro exec />
                <CompareRow i={8} label="Unlimited history" free={false} pro={false} exec />
                <CompareRow i={9} label="Priority access" free={false} pro={false} exec />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════ FINAL CTA ════════════════ */}
        <section className="py-24 pb-40 px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.65, ease: EASE }} className="max-w-lg mx-auto relative">
            <div className="absolute inset-0 pointer-events-none blur-[120px]"
              style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(245,158,11,0.08) 0%, transparent 65%)" }} />
            <p className="text-amber-400/50 text-[9px] font-mono uppercase tracking-[0.3em] mb-5">Ready to go faster?</p>
            <h2 className="font-display text-4xl sm:text-5xl text-white mb-5 leading-tight" style={{ fontStyle: "italic" }}>
              Pick your speed.
            </h2>
            <p className="text-white/30 font-sans mb-10 text-base leading-relaxed">
              Flash Pro: 25 deep-dives a day.<br />
              Flash Executive: 190 every 12 hours.
            </p>
            <motion.button
              onClick={() => { document.getElementById("paypal-pro-container")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="group relative inline-flex items-center gap-3 px-9 py-4 rounded-2xl font-sans font-bold text-sm overflow-hidden"
              style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#050505", boxShadow: "0 4px 36px rgba(245,158,11,0.28)" }}>
              <motion.div className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.22) 50%,transparent 70%)" }}
                animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2.2, repeat: Infinity, ease: "linear", repeatDelay: 2.5 }} />
              <span className="relative z-10">See Flash Pro plans</span>
              <div className="relative z-10 w-6 h-6 rounded-full bg-black/12 flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="#050505" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </motion.button>
          </motion.div>
        </section>

      </div>
    </PageTransition>
  );
}
