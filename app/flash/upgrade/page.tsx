"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Script from "next/script";
import PageTransition from "@/components/PageTransition";
import {
  getFlashTier,
  getFlashTierDaysRemaining,
  activateFlashTier,
  type FlashTier,
} from "@/lib/flash-limits";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Plan metadata ────────────────────────────────────────────────────────────
const TIER_META = {
  free: {
    id: "free" as const,
    label: "Free",
    icon: "⚡",
    limit: "3 / hour",
    color: "#34d399",
    rgb: "52,211,153",
    price: null,
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
    icon: "⚡",
    limit: "25 / day",
    color: "#f59e0b",
    rgb: "245,158,11",
    price: "$3.50 / month",
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
    icon: "⚡",
    limit: "190 / 12h",
    color: "#818cf8",
    rgb: "129,140,248",
    price: "$12.00 / month",
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

// ─── Success state card ───────────────────────────────────────────────────────
function SuccessCard({ tierLabel, planKey, router }: { tierLabel: string; planKey: PlanKey; router: ReturnType<typeof useRouter> }) {
  const isExec = planKey === "flash-exec";
  const limitInfo = isExec ? "190 flashes every 12 hours" : "25 flashes every day";
  const color = isExec ? "#818cf8" : "#f59e0b";
  const rgb = isExec ? "129,140,248" : "245,158,11";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center"
    >
      {/* Pulsing check */}
      <div className="relative mb-8">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{ border: `1px solid rgba(${rgb},${0.3 / i})` }}
            animate={{ scale: [1, 1 + i * 0.4], opacity: [0.7, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
          />
        ))}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 18 }}
          className="relative w-20 h-20 rounded-full flex items-center justify-center text-3xl z-10"
          style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.3)`, boxShadow: `0 0 60px rgba(${rgb},0.2)` }}
        >
          ✅
        </motion.div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="font-sans font-black text-3xl sm:text-4xl text-white mb-3"
        style={{ letterSpacing: "-0.03em" }}
      >
        You&apos;re now on{" "}
        <span style={{ color }}>{tierLabel}</span>!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="text-white/50 font-sans text-base mb-10"
      >
        {limitInfo} — unlock begins immediately.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => router.push("/flash")}
        className="px-8 py-3.5 rounded-xl font-sans font-bold text-sm"
        style={{
          background: `linear-gradient(135deg, ${color}, rgba(${rgb},0.8))`,
          color: "#050505",
          boxShadow: `0 4px 24px rgba(${rgb},0.3)`,
        }}
      >
        Start Flashing →
      </motion.button>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FlashUpgradePage() {
  const router = useRouter();
  const [currentTier, setCurrentTier] = useState<FlashTier>("free");
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [error, setError] = useState("");
  const [succeeded, setSucceeded] = useState(false);
  const [activatedTier, setActivatedTier] = useState<string>("");
  const [activatedPlanKey, setActivatedPlanKey] = useState<PlanKey>("flash-pro");
  const [renderingButtons, setRenderingButtons] = useState(false);
  const buttonsRendered = useRef(false);

  // Read current tier on mount
  useEffect(() => {
    setCurrentTier(getFlashTier());
    setDaysRemaining(getFlashTierDaysRemaining());
  }, []);

  // Render PayPal buttons after SDK loads
  useEffect(() => {
    if (!sdkLoaded || !window.paypal || buttonsRendered.current) return;
    buttonsRendered.current = true;
    setRenderingButtons(true);

    const renderFor = async (planKey: PlanKey, containerId: string) => {
      const container = document.getElementById(containerId);
      if (!container || !window.paypal) return;

      // Clear any previous content
      container.innerHTML = "";

      const buttons = window.paypal.Buttons({
        style: {
          layout: "horizontal",
          color: "gold",
          shape: "rect",
          label: "pay",
          height: 44,
          tagline: false,
        },
        createOrder: async () => {
          setError("");
          const res = await fetch("/api/flash/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan: planKey }),
          });
          const data = await res.json();
          if (!res.ok || data.error) {
            setError(data.error || "Failed to create order");
            throw new Error(data.error || "Failed to create order");
          }
          return data.orderId;
        },
        onApprove: async (data: { orderID: string }) => {
          setError("");
          try {
            const res = await fetch("/api/flash/capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: data.orderID, plan: planKey }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) {
              setError(result.error || "Payment capture failed");
              return;
            }
            activateFlashTier(result.tier, result.expiresAt);
            const label = result.tier === "pro" ? "Flash Pro" : "Flash Executive";
            setActivatedTier(label);
            setActivatedPlanKey(planKey);
            setSucceeded(true);
          } catch {
            setError("Something went wrong capturing your payment. Please contact support.");
          }
        },
        onError: () => {
          setError("PayPal encountered an error. Please try again.");
        },
      });

      if (buttons.isEligible && !buttons.isEligible()) return;
      await buttons.render(`#${containerId}`);
    };

    Promise.all([
      renderFor("flash-pro", "paypal-pro-container"),
      renderFor("flash-exec", "paypal-exec-container"),
    ]).finally(() => setRenderingButtons(false));
  }, [sdkLoaded]);

  // ─── Success screen ───────────────────────────────────────────────────────
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
      {/* PayPal SDK */}
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&components=buttons&intent=capture&currency=USD`}
        onLoad={() => setSdkLoaded(true)}
        strategy="afterInteractive"
      />

      <div className="min-h-screen bg-[#050505] relative overflow-x-hidden">
        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(129,140,248,0.15) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            mask: "radial-gradient(ellipse 80% 60% at 50% 30%, black 0%, transparent 75%)",
            WebkitMask: "radial-gradient(ellipse 80% 60% at 50% 30%, black 0%, transparent 75%)",
          }}
        />
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 10%, rgba(129,140,248,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-24">
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => router.push("/flash")}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors duration-200 text-sm font-sans mb-12"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Flash
          </motion.button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <p className="font-sans font-bold text-[11px] tracking-[0.28em] uppercase mb-4 opacity-60" style={{ color: "#f59e0b" }}>
              TM10
            </p>
            <h1
              className="font-sans font-black leading-none mb-5"
              style={{
                fontSize: "clamp(48px, 10vw, 96px)",
                letterSpacing: "-0.04em",
                WebkitTextFillColor: "transparent",
                background: "linear-gradient(160deg, #fbbf24 0%, #f59e0b 60%, #d97706 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              FLASH PRO
            </h1>
            <p className="text-white/40 font-sans text-base max-w-md mx-auto leading-relaxed">
              Unlock unlimited learning — any topic, any time, at the speed of thought.
            </p>

            {/* Current plan indicator */}
            {currentTier !== "free" && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-sans"
                style={{
                  backgroundColor: currentTier === "pro" ? "rgba(245,158,11,0.1)" : "rgba(129,140,248,0.1)",
                  border: `1px solid ${currentTier === "pro" ? "rgba(245,158,11,0.25)" : "rgba(129,140,248,0.25)"}`,
                  color: currentTier === "pro" ? "#f59e0b" : "#818cf8",
                }}
              >
                <span>⚡</span>
                <span className="font-semibold">
                  {currentTier === "pro" ? "Flash Pro" : "Flash Executive"} · {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-8 px-4 py-3 rounded-xl text-sm font-sans text-red-400 text-center"
                style={{ backgroundColor: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.2)" }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tier cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">

            {/* ── Free card ── */}
            <motion.div
              initial={{ opacity: 0, y: 32, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02 }}
              className="relative rounded-3xl p-6 flex flex-col"
              style={{
                background: "rgba(52,211,153,0.04)",
                border: "1px solid rgba(52,211,153,0.18)",
              }}
            >
              {/* Current Plan badge */}
              {currentTier === "free" && (
                <div
                  className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest"
                  style={{ backgroundColor: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}
                >
                  Current Plan
                </div>
              )}

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-5"
                style={{ backgroundColor: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.22)" }}
              >
                ⚡
              </div>

              <p className="font-sans font-black text-xl text-white mb-1" style={{ letterSpacing: "-0.02em" }}>
                Free
              </p>
              <p className="font-sans text-sm font-bold mb-1" style={{ color: "#34d399" }}>
                3 / hour
              </p>
              <p className="text-white/30 text-xs font-sans mb-6">Always free</p>

              {/* Divider */}
              <div className="h-px mb-6" style={{ background: "rgba(52,211,153,0.12)" }} />

              {/* Features */}
              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {TIER_META.free.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm font-sans text-white/60">
                    <span className="mt-0.5 shrink-0 text-xs" style={{ color: "#34d399" }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div
                className="w-full rounded-xl py-3 text-sm font-sans font-bold text-center"
                style={{ backgroundColor: "rgba(52,211,153,0.06)", color: "rgba(52,211,153,0.4)", border: "1px solid rgba(52,211,153,0.12)", cursor: "default" }}
              >
                Current Plan
              </div>
            </motion.div>

            {/* ── Flash Pro card ── */}
            <motion.div
              initial={{ opacity: 0, y: 32, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02, borderColor: "rgba(245,158,11,0.4)" }}
              className="relative rounded-3xl p-6 flex flex-col"
              style={{
                background: "rgba(245,158,11,0.05)",
                border: "1px solid rgba(245,158,11,0.22)",
                boxShadow: "0 0 60px rgba(245,158,11,0.05)",
              }}
            >
              {currentTier === "pro" && (
                <div
                  className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest"
                  style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
                >
                  Current Plan
                </div>
              )}

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-5"
                style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}
              >
                ⚡
              </div>

              <p className="font-sans font-black text-xl text-white mb-1" style={{ letterSpacing: "-0.02em" }}>
                Flash Pro
              </p>
              <p className="font-sans text-sm font-bold mb-1" style={{ color: "#f59e0b" }}>
                25 / day
              </p>
              <p className="text-white/30 text-xs font-sans mb-6">$3.50 / month</p>

              {/* Divider */}
              <div className="h-px mb-6" style={{ background: "rgba(245,158,11,0.15)" }} />

              {/* Features */}
              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {TIER_META.pro.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm font-sans text-white/60">
                    <span className="mt-0.5 shrink-0 text-xs" style={{ color: "#f59e0b" }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* PayPal button or current plan indicator */}
              {currentTier === "pro" ? (
                <div
                  className="w-full rounded-xl py-3 text-sm font-sans font-bold text-center"
                  style={{ backgroundColor: "rgba(245,158,11,0.08)", color: "rgba(245,158,11,0.5)", border: "1px solid rgba(245,158,11,0.15)", cursor: "default" }}
                >
                  {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
                </div>
              ) : currentTier === "exec" ? (
                <div
                  className="w-full rounded-xl py-3 text-sm font-sans font-bold text-center"
                  style={{ backgroundColor: "rgba(245,158,11,0.04)", color: "rgba(245,158,11,0.3)", border: "1px solid rgba(245,158,11,0.1)", cursor: "default" }}
                >
                  You&apos;re on Executive
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {!sdkLoaded && (
                    <div
                      className="w-full h-11 rounded-xl flex items-center justify-center text-xs font-sans text-white/25"
                      style={{ backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.1)" }}
                    >
                      <span className="w-3.5 h-3.5 border border-amber-400/30 border-t-amber-500 rounded-full animate-spin mr-2" />
                      Loading payment…
                    </div>
                  )}
                  <div
                    id="paypal-pro-container"
                    className={`w-full rounded-xl overflow-hidden transition-opacity duration-300 ${sdkLoaded ? "opacity-100" : "opacity-0 h-0"}`}
                  />
                </div>
              )}
            </motion.div>

            {/* ── Flash Executive card ── */}
            <motion.div
              initial={{ opacity: 0, y: 32, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, delay: 0.19, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02, borderColor: "rgba(129,140,248,0.4)" }}
              className="relative rounded-3xl p-6 flex flex-col"
              style={{
                background: "rgba(129,140,248,0.05)",
                border: "1px solid rgba(129,140,248,0.22)",
                boxShadow: "0 0 60px rgba(129,140,248,0.06)",
              }}
            >
              {/* Most Power badge */}
              <div
                className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest"
                style={{ backgroundColor: "rgba(129,140,248,0.15)", color: "#818cf8", border: "1px solid rgba(129,140,248,0.3)" }}
              >
                {currentTier === "exec" ? "Current Plan" : "Most Power"}
              </div>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-5"
                style={{ backgroundColor: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.25)" }}
              >
                ⚡
              </div>

              <p className="font-sans font-black text-xl text-white mb-1" style={{ letterSpacing: "-0.02em" }}>
                Flash Executive
              </p>
              <p className="font-sans text-sm font-bold mb-1" style={{ color: "#818cf8" }}>
                190 / 12h
              </p>
              <p className="text-white/30 text-xs font-sans mb-6">$12.00 / month</p>

              {/* Divider */}
              <div className="h-px mb-6" style={{ background: "rgba(129,140,248,0.15)" }} />

              {/* Features */}
              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {TIER_META.exec.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm font-sans text-white/60">
                    <span className="mt-0.5 shrink-0 text-xs" style={{ color: "#818cf8" }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* PayPal button or current plan indicator */}
              {currentTier === "exec" ? (
                <div
                  className="w-full rounded-xl py-3 text-sm font-sans font-bold text-center"
                  style={{ backgroundColor: "rgba(129,140,248,0.08)", color: "rgba(129,140,248,0.5)", border: "1px solid rgba(129,140,248,0.15)", cursor: "default" }}
                >
                  {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
                </div>
              ) : currentTier === "pro" ? (
                <div className="flex flex-col gap-2">
                  {!sdkLoaded && (
                    <div
                      className="w-full h-11 rounded-xl flex items-center justify-center text-xs font-sans text-white/25"
                      style={{ backgroundColor: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.1)" }}
                    >
                      <span className="w-3.5 h-3.5 border border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin mr-2" />
                      Loading payment…
                    </div>
                  )}
                  <div
                    id="paypal-exec-container"
                    className={`w-full rounded-xl overflow-hidden transition-opacity duration-300 ${sdkLoaded ? "opacity-100" : "opacity-0 h-0"}`}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {!sdkLoaded && (
                    <div
                      className="w-full h-11 rounded-xl flex items-center justify-center text-xs font-sans text-white/25"
                      style={{ backgroundColor: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.1)" }}
                    >
                      <span className="w-3.5 h-3.5 border border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin mr-2" />
                      Loading payment…
                    </div>
                  )}
                  <div
                    id="paypal-exec-container"
                    className={`w-full rounded-xl overflow-hidden transition-opacity duration-300 ${sdkLoaded ? "opacity-100" : "opacity-0 h-0"}`}
                  />
                </div>
              )}
            </motion.div>

          </div>

          {/* Footer note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-white/20 text-xs font-sans mt-10"
          >
            One-time payment per month · Cancel anytime · Secure checkout via PayPal
          </motion.p>
        </div>
      </div>
    </PageTransition>
  );
}
