"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Script from "next/script";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { activateProWithExpiry } from "@/lib/limits";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    paypal?: any;
  }
}

function useTilt(ref: React.RefObject<HTMLDivElement | null>) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 30 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handle = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      x.set((e.clientX - rect.left) / rect.width - 0.5);
      y.set((e.clientY - rect.top) / rect.height - 0.5);
    };
    const reset = () => { x.set(0); y.set(0); };
    el.addEventListener("mousemove", handle);
    el.addEventListener("mouseleave", reset);
    return () => { el.removeEventListener("mousemove", handle); el.removeEventListener("mouseleave", reset); };
  }, [ref, x, y]);
  return { rotateX, rotateY };
}

function Particles() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, #030f09 0%, #020609 60%, #030609 100%)" }} />
      <motion.div
        className="absolute rounded-full blur-[160px]"
        style={{ width: 800, height: 800, top: "-20%", left: "50%", x: "-50%", background: "radial-gradient(circle, rgba(52,211,153,0.13) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div className="absolute rounded-full blur-[120px]" style={{ width: 400, height: 400, bottom: "10%", left: "10%", background: "radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)" }} animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute rounded-full" style={{ width: 2 + (i % 3), height: 2 + (i % 3), left: `${8 + (i * 8.3) % 85}%`, top: `${5 + (i * 11.7) % 85}%`, background: `rgba(52,211,153,${0.15 + (i % 5) * 0.08})` }} animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -30 - (i % 4) * 10, 0] }} transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }} />
      ))}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `linear-gradient(rgba(52,211,153,1) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,1) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
    </div>
  );
}

const FEATURES = [
  { icon: "∞", label: "Unlimited topics daily" },
  { icon: "🎧", label: "Audio explanations" },
  { icon: "📄", label: "PDF export any topic" },
  { icon: "💬", label: "AI follow-up questions" },
  { icon: "🛤️", label: "Custom learning paths" },
  { icon: "🔒", label: "Private study rooms" },
  { icon: "✦", label: "Full XP shop + all perks" },
  { icon: "📊", label: "Analytics dashboard" },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = (searchParams.get("plan") as "monthly" | "annual") || "annual";
  const cancelled = searchParams.get("cancelled") === "true";

  const [plan, setPlan] = useState<"monthly" | "annual">(initialPlan);
  const [ppLoading, setPpLoading] = useState(false);
  const [ppError, setPpError] = useState("");

  // Hosted fields
  const [hfInstance, setHfInstance] = useState<any>(null);
  const [hfReady, setHfReady] = useState(false);
  const [hfEligible, setHfEligible] = useState<boolean | null>(null); // null = unknown
  const [hfLoading, setHfLoading] = useState(false);
  const [hfError, setHfError] = useState("");
  const [cardName, setCardName] = useState("");
  const planRef = useRef(plan);

  // Promo code state
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null); // % off
  const [promoActivating, setPromoActivating] = useState(false);
  const [promoDone, setPromoDone] = useState(false);
  const [promoDays, setPromoDays] = useState(0);

  const cardRef = useRef<HTMLDivElement>(null);
  const { rotateX, rotateY } = useTilt(cardRef);

  // Keep planRef current so createOrder always uses latest plan
  useEffect(() => { planRef.current = plan; }, [plan]);

  const initHostedFields = useCallback(() => {
    if (!window.paypal?.HostedFields) { setHfEligible(false); return; }
    if (!window.paypal.HostedFields.isEligible()) { setHfEligible(false); return; }
    setHfEligible(true);

    // Safety timeout — if not ready in 8s, hide and fall back
    const timeout = setTimeout(() => setHfEligible(false), 8000);

    window.paypal.HostedFields.render({
      createOrder: async () => {
        const res = await fetch("/api/paypal-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: planRef.current }),
        });
        const data = await res.json();
        if (!data.orderId) throw new Error("No order ID");
        return data.orderId;
      },
      fields: {
        number:         { selector: "#hf-number",  placeholder: "4242 4242 4242 4242" },
        cvv:            { selector: "#hf-cvv",     placeholder: "•••" },
        expirationDate: { selector: "#hf-expiry",  placeholder: "MM / YY" },
      },
      styles: {
        input: {
          color: "rgba(255,255,255,0.85)",
          "font-size": "14px",
          "font-family": "ui-monospace, 'SF Mono', monospace",
          "letter-spacing": "0.04em",
        },
        ":focus":   { color: "#fff" },
        ".invalid": { color: "#f87171" },
        ".valid":   { color: "#34d399" },
        "::placeholder": { color: "rgba(255,255,255,0.2)" },
      },
    }).then((instance: any) => {
      clearTimeout(timeout);
      setHfInstance(instance);
      setHfReady(true);
    }).catch(() => { clearTimeout(timeout); setHfEligible(false); });
  }, []);

  async function handleCardPay() {
    if (!hfInstance) return;
    setHfLoading(true);
    setHfError("");
    try {
      const result = await hfInstance.submit({ cardholderName: cardName });
      const orderId = result?.orderId ?? result?.orderID;
      if (!orderId) throw new Error("No order ID");
      const capture = await fetch("/api/paypal-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await capture.json();
      if (data.success) {
        // Use the server-provided expiry; fall back to plan-based calculation
        const expiresAt =
          data.expiresAt ??
          Date.now() + (planRef.current === "annual" ? 365 : 30) * 24 * 60 * 60 * 1000;
        activateProWithExpiry(expiresAt);
        router.push(`/checkout/success?plan=${planRef.current}`);
      } else {
        setHfError("Payment failed. Please check your card details.");
      }
    } catch {
      setHfError("Payment failed. Please try again.");
    } finally {
      setHfLoading(false);
    }
  }

  const basePrice = plan === "annual" ? 40 : 5;
  const discountedPrice = appliedDiscount ? basePrice * (1 - appliedDiscount / 100) : basePrice;
  const price = appliedDiscount === 100 ? "FREE" : `$${discountedPrice % 1 === 0 ? discountedPrice : discountedPrice.toFixed(2)}`;
  const originalPrice = `$${basePrice}`;
  const perMonth = plan === "annual" ? "$3.33/mo" : "$5/mo";

  async function handleApplyPromo() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch("/api/discount-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedDiscount(data.discount);
        setPromoError("");
      } else {
        setPromoError("Invalid code. Try again.");
        setAppliedDiscount(null);
      }
    } catch {
      setPromoError("Couldn't verify code. Try again.");
    } finally {
      setPromoLoading(false);
    }
  }

  async function handleFreeActivate() {
    setPromoActivating(true);
    try {
      const res = await fetch("/api/promo-activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), plan }),
      });
      const data = await res.json();
      if (data.success) {
        activateProWithExpiry(data.expiresAt);
        setPromoDays(data.daysGranted);
        setPromoDone(true);
      } else {
        setPromoError("Activation failed. Please try again.");
      }
    } catch {
      setPromoError("Activation failed. Please try again.");
    } finally {
      setPromoActivating(false);
    }
  }

  async function handlePayPal() {
    setPpLoading(true);
    setPpError("");
    try {
      const res = await fetch("/api/paypal-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPpError("PayPal unavailable. Please use Ko-fi below.");
        setPpLoading(false);
      }
    } catch {
      setPpError("PayPal unavailable. Please use Ko-fi below.");
      setPpLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 pb-28">
      {/* PayPal SDK — hosted fields */}
      {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && (
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&components=hosted-fields&intent=capture&currency=USD`}
          strategy="afterInteractive"
          onLoad={initHostedFields}
        />
      )}
      <Particles />

      {/* Promo success overlay */}
      <AnimatePresence>
        {promoDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
          >
            {/* Confetti */}
            {[...Array(20)].map((_, i) => (
              <motion.div key={i} className="fixed pointer-events-none rounded-full" style={{ width: 6 + (i % 4) * 2, height: 6 + (i % 4) * 2, left: `${5 + (i * 4.7) % 90}%`, top: "-10px", background: ["#34d399","#6ee7b7","#10b981","#a7f3d0","#fff","#fde68a"][i % 6] }} animate={{ y: ["0vh","110vh"], x: [0,(i%2===0?1:-1)*(20+(i*7)%60)], rotate:[0,360*(i%2===0?1:-1)], opacity:[1,1,0] }} transition={{ duration: 2.5+(i%4)*0.4, delay: i*0.05, ease:"easeIn" }} />
            ))}

            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="w-full max-w-sm rounded-2xl border border-emerald-500/20 bg-[#040e08] overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-emerald-500/15 to-transparent pointer-events-none" />
              <div className="p-8 text-center relative">
                <motion.div className="w-16 h-16 rounded-full border-2 border-emerald-400/40 bg-emerald-500/10 flex items-center justify-center mx-auto mb-5" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.1 }}>
                  <motion.svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <motion.path d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 }} />
                  </motion.svg>
                </motion.div>

                <motion.h2 className="font-display text-3xl text-white mb-1" initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.35 }}>
                  Pro Activated ✦
                </motion.h2>
                <motion.p className="text-white/40 font-sans text-sm mb-6" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.45 }}>
                  Your discount code worked!
                </motion.p>

                <motion.div className="rounded-xl bg-white/[0.03] border border-white/[0.07] divide-y divide-white/[0.06] mb-6 text-left" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.5 }}>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-white/40 font-sans text-xs">Code used</span>
                    <span className="text-emerald-400 font-mono text-sm font-semibold">{promoCode}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-white/40 font-sans text-xs">Access granted</span>
                    <span className="text-white font-sans text-sm font-semibold">{promoDays} days</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-white/40 font-sans text-xs">Amount paid</span>
                    <span className="text-emerald-400 font-sans text-sm font-semibold">$0.00 🎉</span>
                  </div>
                </motion.div>

                <motion.button
                  onClick={() => router.push("/")}
                  className="w-full py-3.5 rounded-xl font-sans font-bold text-sm text-black relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg,#34d399,#10b981)" }}
                  initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.65 }}
                  whileHover={{ scale:1.01 }}
                  whileTap={{ scale:0.97 }}
                >
                  <motion.div className="absolute inset-0 pointer-events-none" style={{ background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.2) 50%,transparent 70%)" }} animate={{ x:["-100%","200%"] }} transition={{ duration:1.5,repeat:Infinity,ease:"linear",repeatDelay:1 }} />
                  <span className="relative z-10">Start Learning →</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button onClick={() => router.push("/pro")} className="fixed top-6 left-6 flex items-center gap-2 text-white/30 hover:text-white/60 font-sans text-sm transition-colors z-50" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
        ← Back
      </motion.button>

      <AnimatePresence>
        {cancelled && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-sans">
            Payment cancelled — no charge was made
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        {/* Left */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-6">
            <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" /></span>
            <span className="text-emerald-400 text-xs font-sans tracking-wider uppercase">Teach Me Like I'm 10 — Pro</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-white mb-4 leading-tight">
            Learn without<br />
            <span style={{ background: "linear-gradient(135deg,#34d399,#6ee7b7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>limits.</span>
          </h1>
          <p className="text-white/40 font-sans text-base mb-10 leading-relaxed">One upgrade. Everything unlocked. Cancel anytime.</p>
          <div className="space-y-3.5">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07, duration: 0.4 }} className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm shrink-0">{f.icon}</div>
                <span className="text-white/65 font-sans text-sm">{f.label}</span>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="flex items-center gap-5 mt-10">
            {["Cancel anytime", "No hidden fees", "Secure payment"].map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-white/25 text-xs font-sans"><span className="text-emerald-500/60 text-[10px]">✓</span>{t}</div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right — payment card */}
        <motion.div initial={{ opacity: 0, x: 30, y: 20 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}>
          <motion.div ref={cardRef} style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1000 }}>
            <div className="rounded-3xl p-px" style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.6) 0%, rgba(52,211,153,0.1) 40%, rgba(52,211,153,0.4) 100%)" }}>
              <div className="rounded-[23px] bg-[#040e08] p-8 relative overflow-hidden">

                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
                <motion.div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(105deg, transparent 40%, rgba(52,211,153,0.04) 50%, transparent 60%)" }} animate={{ x: ["-100%", "200%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 3 }} />

                {/* Plan toggle */}
                <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-6 relative">
                  {(["annual", "monthly"] as const).map((p) => (
                    <button key={p} onClick={() => setPlan(p)} className="flex-1 py-2.5 rounded-lg text-sm font-sans transition-all relative z-10 flex items-center justify-center gap-2" style={{ color: plan === p ? "#fff" : "rgba(255,255,255,0.35)" }}>
                      {plan === p && <motion.div layoutId="plan-pill" className="absolute inset-0 rounded-lg bg-white/10" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                      <span className="relative">{p === "annual" ? "Annual" : "Monthly"}</span>
                      {p === "annual" && <span className="relative text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">SAVE 33%</span>}
                    </button>
                  ))}
                </div>

                {/* Price */}
                <div className="mb-6 text-center">
                  <AnimatePresence mode="wait">
                    <motion.div key={`${plan}-${appliedDiscount}`} initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.96 }} transition={{ duration: 0.2 }}>
                      <div className="flex items-end justify-center gap-2 mb-1">
                        {appliedDiscount && appliedDiscount > 0 && (
                          <span className="font-display text-2xl text-white/25 line-through mb-1">{originalPrice}</span>
                        )}
                        <span className={`font-display text-5xl ${appliedDiscount === 100 ? "text-emerald-400" : "text-white"}`}>{price}</span>
                        {appliedDiscount !== 100 && (
                          <span className="text-white/30 font-sans text-sm mb-3">/{plan === "annual" ? "year" : "month"}</span>
                        )}
                      </div>
                      {appliedDiscount && appliedDiscount > 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                          <span className="text-emerald-400 text-xs font-sans font-semibold">🎉 {appliedDiscount}% off applied</span>
                        </div>
                      ) : (
                        <p className="text-white/30 font-sans text-sm">{plan === "annual" ? `That's just ${perMonth} — billed once` : "Billed every month"}</p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* ── Promo code ── */}
                <div className="mb-5">
                  <button
                    onClick={() => setPromoOpen(o => !o)}
                    className="flex items-center gap-1.5 text-white/30 hover:text-white/60 font-sans text-xs transition-colors mx-auto"
                  >
                    <span>{promoOpen ? "▾" : "▸"}</span>
                    {appliedDiscount ? `Promo applied (${appliedDiscount}% off)` : "Have a promo code?"}
                  </button>

                  <AnimatePresence>
                    {promoOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 flex gap-2">
                          <input
                            type="text"
                            value={promoCode}
                            onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); setAppliedDiscount(null); }}
                            onKeyDown={e => e.key === "Enter" && handleApplyPromo()}
                            placeholder="PROMO CODE"
                            className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 font-mono text-sm outline-none focus:border-emerald-500/40 transition-colors tracking-widest"
                          />
                          <motion.button
                            onClick={handleApplyPromo}
                            disabled={promoLoading || !promoCode.trim()}
                            className="px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/70 hover:text-white font-sans text-sm transition-colors disabled:opacity-40"
                            whileTap={{ scale: 0.97 }}
                          >
                            {promoLoading ? (
                              <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full inline-block" />
                            ) : "Apply"}
                          </motion.button>
                        </div>
                        <AnimatePresence>
                          {promoError && (
                            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-400 text-xs font-sans mt-2">
                              {promoError}
                            </motion.p>
                          )}
                          {appliedDiscount && (
                            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-emerald-400 text-xs font-sans mt-2">
                              ✓ {appliedDiscount}% discount applied{appliedDiscount === 100 ? " — click below to activate for free!" : ""}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 100% promo — free activate button */}
                <AnimatePresence>
                  {appliedDiscount === 100 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4">
                      <motion.button
                        onClick={handleFreeActivate}
                        disabled={promoActivating}
                        className="relative w-full py-4 rounded-xl font-sans font-bold text-base overflow-hidden text-black"
                        style={{ background: "linear-gradient(135deg,#34d399,#10b981)" }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)" }} animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }} />
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {promoActivating ? (
                            <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full inline-block" />
                          ) : "✦ Activate Pro for Free"}
                        </span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── PayPal Hosted Fields — only renders when confirmed eligible + ready ── */}
                <AnimatePresence>
                  {hfEligible === true && hfReady && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-5"
                    >
                      {/* Cardholder name */}
                      <div className="flex flex-col gap-1.5 mb-3">
                        <label className="text-white/35 text-[10px] font-sans tracking-widest uppercase">Cardholder name</label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={e => setCardName(e.target.value)}
                          placeholder="Name on card"
                          className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/85 placeholder-white/20 font-sans text-sm outline-none focus:border-emerald-500/30 transition-colors"
                        />
                      </div>

                      {/* Card number */}
                      <div className="flex flex-col gap-1.5 mb-3">
                        <label className="text-white/35 text-[10px] font-sans tracking-widest uppercase">Card number</label>
                        <div className="h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center">
                          <div id="hf-number" className="w-full" style={{ height: 48, marginTop: -2 }} />
                        </div>
                      </div>

                      {/* Expiry + CVV */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-white/35 text-[10px] font-sans tracking-widest uppercase">Expiry</label>
                          <div className="h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center">
                            <div id="hf-expiry" className="w-full" style={{ height: 48, marginTop: -2 }} />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-white/35 text-[10px] font-sans tracking-widest uppercase">CVV</label>
                          <div className="h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center">
                            <div id="hf-cvv" className="w-full" style={{ height: 48, marginTop: -2 }} />
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {hfError && (
                          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-400 text-xs font-sans mb-3 text-center">
                            {hfError}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <motion.button
                        onClick={handleCardPay}
                        disabled={hfLoading}
                        className="relative w-full py-4 rounded-xl font-sans font-bold text-base overflow-hidden text-black"
                        style={{ background: "linear-gradient(135deg,#34d399,#10b981)" }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)" }} animate={{ x: hfLoading ? 0 : ["-100%","200%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }} />
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {hfLoading ? (
                            <><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full inline-block" /> Processing…</>
                          ) : (
                            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Pay {price}</>
                          )}
                        </span>
                      </motion.button>

                      <p className="text-center text-white/20 text-[10px] font-sans mt-2 mb-5">
                        Secured by PayPal · No PayPal account needed
                      </p>

                      <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px bg-white/[0.06]" />
                        <span className="text-white/20 text-xs font-sans">or</span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Ko-fi primary CTA ── */}
                <motion.a
                  href="https://ko-fi.com/lucapopescu24750"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-full py-4 rounded-xl font-sans font-bold text-base overflow-hidden flex items-center justify-center gap-2.5 text-black"
                  style={{ background: "linear-gradient(135deg, #34d399 0%, #10b981 100%)" }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)" }} animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }} />
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="relative z-10">
                    <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" fill="black" />
                  </svg>
                  <span className="relative z-10">Support on Ko-fi</span>
                </motion.a>
                <p className="text-center text-white/25 text-[11px] font-sans mt-2 mb-5">
                  Accepts all major credit & debit cards · No account needed
                </p>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-white/20 text-xs font-sans">or pay with PayPal</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                {/* PayPal secondary */}
                <AnimatePresence>
                  {ppError && (
                    <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-amber-400 text-xs font-sans text-center mb-3">
                      {ppError}
                    </motion.p>
                  )}
                </AnimatePresence>
                <motion.button
                  onClick={handlePayPal}
                  disabled={ppLoading}
                  className="relative w-full py-3.5 rounded-xl font-sans font-semibold text-sm overflow-hidden flex items-center justify-center gap-2 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {ppLoading ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full inline-block" />
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-60">
                        <path d="M20.067 8.478c.492.315.844.825.983 1.39a4.244 4.244 0 01-.285 2.638c-.476 1.111-1.255 1.896-2.315 2.328-.82.336-1.773.503-2.833.503H14.25c-.23 0-.425.168-.46.395l-.652 4.145-.124.787c-.035.228-.23.395-.46.395H9.94a.228.228 0 01-.226-.265l.964-6.11c.035-.228.23-.395.46-.395h1.667c3.16 0 5.657-1.278 6.487-4.154.073-.258.133-.51.178-.753.072-.004.1.01.098.096z" />
                        <path d="M7.817 5.07c.458-.193.96-.29 1.494-.29h5.832c.691 0 1.338.099 1.928.3.17.059.333.125.49.196.166.077.323.163.47.257.165.106.317.224.456.352.082.072.16.148.235.227a5.39 5.39 0 00-.178.753c-.83 2.876-3.327 4.154-6.487 4.154H10.39c-.23 0-.425.167-.46.394L9.277 17.56l-.964 6.11A.228.228 0 018.087 24H5.394a.457.457 0 01-.452-.524l2.478-15.7a2.28 2.28 0 011.397-1.705z" />
                      </svg>
                      Pay with PayPal
                    </>
                  )}
                </motion.button>

                {/* Payment icons */}
                <div className="flex items-center justify-center gap-2 mt-5 opacity-20">
                  {["VISA", "MC", "AMEX", "PP"].map((b) => (
                    <div key={b} className="px-2 py-0.5 rounded bg-white/10 text-[9px] text-white font-mono tracking-wider">{b}</div>
                  ))}
                </div>

              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return <Suspense><CheckoutContent /></Suspense>;
}
