"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const verified = useRef(false);

  useEffect(() => {
    if (verified.current) return;
    verified.current = true;

    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (tokenHash && type === "recovery") {
      // Verify the token directly — bypasses PKCE entirely
      supabase.auth
        .verifyOtp({ token_hash: tokenHash, type: "recovery" })
        .then(({ error: verifyError }) => {
          if (verifyError) {
            setChecking(false);
            setSessionReady(false);
          } else {
            setSessionReady(true);
            setChecking(false);
          }
        });
    } else {
      // No token in URL — check for existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSessionReady(true);
        }
        setChecking(false);
      });
    }
  }, [searchParams, supabase.auth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    }
  }

  return (
    <motion.div
      className="w-full max-w-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl text-white mb-2">
          New Password
        </h1>
        <p className="text-white/40 text-sm font-sans">
          Choose a new password for your account
        </p>
      </div>

      {checking ? (
        <div className="text-center py-8">
          <p className="text-white/30 text-sm font-sans">
            Verifying your reset link...
          </p>
        </div>
      ) : success ? (
        <motion.div
          className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="text-emerald-400 font-sans text-sm mb-2">
            Password updated! Redirecting...
          </p>
        </motion.div>
      ) : !sessionReady ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
          <p className="text-red-400 font-sans text-sm mb-3">
            This reset link has expired or is invalid.
          </p>
          <button
            onClick={() => router.push("/auth/login")}
            className="text-white/40 text-sm font-sans hover:text-white/60 transition-colors underline"
          >
            Request a new reset link
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/40 text-xs font-mono mb-1.5 tracking-wider">
              NEW PASSWORD
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

          <div>
            <label className="block text-white/40 text-xs font-mono mb-1.5 tracking-wider">
              CONFIRM PASSWORD
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Enter password again"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 focus:border-emerald-500/30 focus:bg-white/[0.05] text-white font-sans text-sm outline-none transition-all placeholder:text-white/20"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs font-sans">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-sm tracking-wider hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "..." : "UPDATE PASSWORD"}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <div className="border-t border-white/5 pt-3">
          <button
            onClick={() => router.push("/auth/login")}
            className="text-white/20 text-sm font-sans hover:text-white/40 transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="text-center py-8">
            <p className="text-white/30 text-sm font-sans">Loading...</p>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
