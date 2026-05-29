"use client";

import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { activateProWithExpiry } from "@/lib/limits";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const tokenParam = searchParams.get("token");
  const plan = searchParams.get("plan") || "annual";

  const [status, setStatus] = useState<"capturing" | "email" | "checking" | "done" | "error">("capturing");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [daysGranted, setDaysGranted] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    // ── Ko-fi flow ────────────────────────────────────────────────────────────
    if (source === "kofi") {
      if (!tokenParam) { setStatus("error"); return; }
      // Verify token, then ask for email
      fetch(`/api/kofi-verify?token=${encodeURIComponent(tokenParam)}`)
        .then(r => r.json())
        .then(data => {
          if (data.valid) setStatus("email");
          else setStatus("error");
        })
        .catch(() => setStatus("error"));
      return;
    }

    // ── PayPal flow ───────────────────────────────────────────────────────────
    const orderId = tokenParam;
    if (!orderId) { setStatus("error"); return; }

    fetch("/api/paypal-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem("tmi10_is_pro", "1");
          setStatus("done");
          setDaysRemaining(plan === "annual" ? 365 : 30);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [source, tokenParam, plan]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setEmailError("Please enter your Ko-fi email."); return; }
    setEmailError("");
    setStatus("checking");

    try {
      const res = await fetch(
        `/api/kofi-verify?token=${encodeURIComponent(tokenParam ?? "")}&email=${encodeURIComponent(email.trim())}`
      );
      const data = await res.json();

      if (!data.valid) { setStatus("error"); return; }

      if (!data.found) {
        // Webhook may not have arrived yet — retry up to 5 times
        if (retries < 5) {
          setRetries(r => r + 1);
          setTimeout(() => setStatus("email"), 3000);
        } else {
          setEmailError("We couldn't find your payment yet. Wait a moment and try again, or contact support.");
          setStatus("email");
        }
        return;
      }

      if (data.expired) {
        setEmailError("Your subscription has expired. Please donate again to renew.");
        setStatus("email");
        return;
      }

      // Activate Pro with expiry
      activateProWithExpiry(data.expiresAt);
      setDaysGranted(data.daysGranted ?? 0);
      setDaysRemaining(data.daysRemaining ?? 0);
      setStatus("done");
    } catch {
      setEmailError("Something went wrong. Please try again.");
      setStatus("email");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      {/* Background */}
      <div className="fixed inset-0 -z-10" style={{ background: "radial-gradient(ellipse at 50% 0%, #030f09 0%, #020609 100%)" }} />
      <motion.div className="fixed inset-0 -z-10 rounded-full blur-[200px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)" }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 6, repeat: Infinity }} />

      <div className="text-center max-w-sm w-full">

        {/* Capturing / loading */}
        {(status === "capturing" || status === "checking") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div className="w-16 h-16 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full mx-auto mb-6" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
            <p className="text-white/50 font-sans">
              {status === "checking" ? "Checking your payment…" : "Confirming your payment…"}
            </p>
            {status === "checking" && retries > 0 && (
              <p className="text-white/30 font-sans text-sm mt-2">Attempt {retries}/5 — webhook may still be arriving…</p>
            )}
          </motion.div>
        )}

        {/* Ko-fi email input */}
        {status === "email" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 rounded-full bg-[#FF5E5B]/10 border border-[#FF5E5B]/30 flex items-center justify-center mx-auto mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" fill="#FF5E5B" />
              </svg>
            </div>

            <h1 className="font-display text-2xl text-white mb-2">Activate your Pro</h1>
            <p className="text-white/40 font-sans text-sm mb-6 leading-relaxed">
              Enter the email you used on Ko-fi to activate your subscription.
            </p>

            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-white/25 font-sans text-sm outline-none focus:border-emerald-500/40 transition-colors"
              />
              <AnimatePresence>
                {emailError && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-400 text-xs font-sans text-left">
                    {emailError}
                  </motion.p>
                )}
              </AnimatePresence>
              <motion.button
                type="submit"
                className="w-full py-3.5 rounded-xl font-sans font-semibold text-sm text-black"
                style={{ background: "linear-gradient(135deg,#34d399,#10b981)" }}
                whileTap={{ scale: 0.97 }}
              >
                Activate Pro →
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Success — celebration popup */}
        {status === "done" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="w-full"
          >
            {/* Confetti particles */}
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={i}
                className="fixed pointer-events-none rounded-full"
                style={{
                  width: 6 + (i % 4) * 2,
                  height: 6 + (i % 4) * 2,
                  left: `${10 + (i * 5.5) % 80}%`,
                  top: "-10px",
                  background: ["#34d399","#6ee7b7","#10b981","#a7f3d0","#fff"][i % 5],
                }}
                animate={{
                  y: ["0vh", "110vh"],
                  x: [0, (i % 2 === 0 ? 1 : -1) * (20 + (i * 7) % 60)],
                  rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)],
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 2.5 + (i % 4) * 0.4, delay: i * 0.07, ease: "easeIn" }}
              />
            ))}

            {/* Card */}
            <div className="relative rounded-2xl border border-emerald-500/20 bg-[#040e08] overflow-hidden">
              {/* Top glow */}
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/15 to-transparent pointer-events-none" />

              <div className="relative p-8">
                {/* Checkmark */}
                <motion.div
                  className="w-16 h-16 rounded-full border-2 border-emerald-400/40 bg-emerald-500/10 flex items-center justify-center mx-auto mb-5"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                >
                  <motion.svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <motion.path d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 }} />
                  </motion.svg>
                </motion.div>

                <motion.h1
                  className="font-display text-3xl text-white mb-1 text-center"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                >
                  Welcome to Pro ✦
                </motion.h1>
                <motion.p
                  className="text-white/40 font-sans text-sm text-center mb-6"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                >
                  Your subscription is now active
                </motion.p>

                {/* Receipt card */}
                <motion.div
                  className="rounded-xl bg-white/[0.03] border border-white/[0.07] divide-y divide-white/[0.06] mb-6"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                >
                  {daysGranted > 0 && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-white/40 font-sans text-xs">Access granted</span>
                      <span className="text-emerald-400 font-sans text-sm font-semibold">
                        {daysGranted} days
                        {daysGranted >= 30 && (
                          <span className="text-white/30 font-normal"> ({(daysGranted / 30).toFixed(1).replace(".0","") } mo)</span>
                        )}
                      </span>
                    </div>
                  )}
                  {daysRemaining > 0 && daysRemaining !== Infinity && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-white/40 font-sans text-xs">Days remaining</span>
                      <span className="text-white font-sans text-sm font-semibold">{daysRemaining} days</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-white/40 font-sans text-xs">Invoice</span>
                    <span className="text-white/60 font-sans text-xs">Sent to your email ✓</span>
                  </div>
                </motion.div>

                {daysGranted > 0 && (
                  <motion.p
                    className="text-white/25 font-sans text-[11px] text-center mb-5"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                  >
                    Every $5 donated = 30 more days · donate anytime to extend
                  </motion.p>
                )}

                <motion.button
                  onClick={() => router.push("/")}
                  className="w-full py-3.5 rounded-xl font-sans font-semibold text-sm text-black relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg,#34d399,#10b981)" }}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)" }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                  />
                  <span className="relative z-10">Start Learning →</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {status === "error" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="font-display text-2xl text-white mb-3">Something went wrong</h1>
            <p className="text-white/40 font-sans text-sm mb-6">If you were charged, contact us and we&apos;ll sort it immediately.</p>
            <button onClick={() => router.push("/pro")} className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white font-sans text-sm transition-colors">
              Back to Pro page
            </button>
          </motion.div>
        )}

      </div>
    </main>
  );
}

export default function SuccessPage() {
  return <Suspense><SuccessContent /></Suspense>;
}
