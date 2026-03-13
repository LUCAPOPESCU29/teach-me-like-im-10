"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [nameStatus, setNameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "signup" || !displayName.trim() || displayName.trim().length < 2) {
      setNameStatus("idle");
      setNameError(null);
      return;
    }

    setNameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/auth/check-username?name=${encodeURIComponent(displayName.trim())}`
        );
        const data = await res.json();
        if (data.available) {
          setNameStatus("available");
          setNameError(null);
        } else {
          setNameStatus(data.reason === "Already taken" ? "taken" : "invalid");
          setNameError(data.reason);
        }
      } catch {
        setNameStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [displayName, mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "forgot") {
      try {
        const res = await fetch("/api/auth/send-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (res.ok) {
          setResetSent(true);
        } else {
          setError("Something went wrong. Please try again.");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else {
        router.push("/");
      }
    } else {
      if (!displayName.trim() || displayName.trim().length < 2) {
        setError("Please choose a username (at least 2 characters).");
        setLoading(false);
        return;
      }
      if (nameStatus === "taken" || nameStatus === "invalid") {
        setError("Please choose an available username.");
        setLoading(false);
        return;
      }
      const trimmedName = displayName.trim();
      const result = await signUp(email, password, trimmedName);
      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
      }
    }
  }

  const title =
    mode === "forgot"
      ? "Reset Password"
      : mode === "login"
      ? "Welcome Back"
      : "Create Account";

  const subtitle =
    mode === "forgot"
      ? "Enter your email to receive a reset link"
      : mode === "login"
      ? "Sign in to sync your progress"
      : "Join to save your learning journey";

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-white mb-2">{title}</h1>
          <p className="text-white/40 text-sm font-sans">{subtitle}</p>
        </div>

        {success ? (
          <motion.div
            className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-emerald-400 font-sans text-sm mb-2">
              Check your email to confirm your account.
            </p>
            <button
              onClick={() => {
                setMode("login");
                setSuccess(false);
              }}
              className="text-emerald-300 text-sm underline"
            >
              Back to sign in
            </button>
          </motion.div>
        ) : resetSent ? (
          <motion.div
            className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-emerald-400 font-sans text-sm mb-2">
              If an account exists with that email, you&apos;ll receive a reset
              link shortly.
            </p>
            <button
              onClick={() => {
                setMode("login");
                setResetSent(false);
              }}
              className="text-emerald-300 text-sm underline"
            >
              Back to sign in
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-white/40 text-xs font-mono mb-1.5 tracking-wider">
                  USERNAME <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Choose a unique name"
                    required
                    minLength={2}
                    maxLength={30}
                    className="w-full px-4 py-3 pr-10 rounded-xl bg-white/[0.03] border border-white/10 focus:border-emerald-500/30 focus:bg-white/[0.05] text-white font-sans text-sm outline-none transition-all placeholder:text-white/20"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                    {nameStatus === "checking" && (
                      <span className="text-white/30 animate-pulse">...</span>
                    )}
                    {nameStatus === "available" && (
                      <span className="text-emerald-400">&#10003;</span>
                    )}
                    {(nameStatus === "taken" || nameStatus === "invalid") && (
                      <span className="text-red-400">&#10007;</span>
                    )}
                  </div>
                </div>
                {nameError && (
                  <p className="text-red-400/70 text-xs mt-1 font-sans">
                    {nameError}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-white/40 text-xs font-mono mb-1.5 tracking-wider">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 focus:border-emerald-500/30 focus:bg-white/[0.05] text-white font-sans text-sm outline-none transition-all placeholder:text-white/20"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="block text-white/40 text-xs font-mono mb-1.5 tracking-wider">
                  PASSWORD
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 focus:border-emerald-500/30 focus:bg-white/[0.05] text-white font-sans text-sm outline-none transition-all placeholder:text-white/20"
                />
              </div>
            )}

            {error && (
              <p className="text-red-400 text-xs font-sans">{error}</p>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                (mode === "signup" &&
                  (nameStatus !== "available" ||
                    !displayName.trim() ||
                    displayName.trim().length < 2))
              }
              className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-sm tracking-wider hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "..."
                : mode === "forgot"
                ? "SEND RESET LINK"
                : mode === "login"
                ? "SIGN IN"
                : "CREATE ACCOUNT"}
            </button>

            {mode === "login" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError(null);
                  }}
                  className="text-white/25 text-xs font-sans hover:text-white/45 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </form>
        )}

        <div className="mt-6 text-center space-y-3">
          {mode === "forgot" && !resetSent ? (
            <button
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className="text-white/30 text-sm font-sans hover:text-white/50 transition-colors"
            >
              Back to sign in
            </button>
          ) : !success && !resetSent ? (
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
              }}
              className="text-white/30 text-sm font-sans hover:text-white/50 transition-colors"
            >
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          ) : null}

          <div className="border-t border-white/5 pt-3">
            <button
              onClick={() => router.push("/")}
              className="text-white/20 text-sm font-sans hover:text-white/40 transition-colors"
            >
              Continue as guest
            </button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
