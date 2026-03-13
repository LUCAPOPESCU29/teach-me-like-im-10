"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";

export default function DidYouKnow() {
  const { data: dataLayer } = useAuth();
  const [fact, setFact] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `tmi10_dyk_${today}`;
    const dismissKey = `tmi10_dyk_dismissed_${today}`;

    try {
      if (sessionStorage.getItem(dismissKey)) {
        setDismissed(true);
        setLoading(false);
        return;
      }

      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setFact(cached);
        setLoading(false);
        return;
      }
    } catch {
      // sessionStorage may be unavailable
    }

    async function fetchFact() {
      try {
        const history = await dataLayer.getTopicHistory();
        const topicNames = history.slice(0, 5).map((t) => t.topicName);

        const res = await fetch("/api/did-you-know", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topics: topicNames.length > 0 ? topicNames : undefined,
          }),
        });

        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        if (data.fact) {
          setFact(data.fact);
          try {
            sessionStorage.setItem(cacheKey, data.fact);
          } catch {}
        }
      } catch {
        // Silently fail — non-critical feature
      } finally {
        setLoading(false);
      }
    }

    fetchFact();
  }, [dataLayer]);

  function handleDismiss() {
    setDismissed(true);
    const today = new Date().toISOString().slice(0, 10);
    try {
      sessionStorage.setItem(`tmi10_dyk_dismissed_${today}`, "1");
    } catch {}
  }

  if (loading || dismissed || !fact) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="w-full max-w-md mb-6"
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative p-4 rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.03]">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/20 hover:text-white/50 transition-colors text-xs"
          >
            {"\u2715"}
          </button>

          <div className="flex items-start gap-3 pr-6">
            <span className="text-cyan-400/60 text-lg mt-0.5 shrink-0">
              {"\u{1F4A1}"}
            </span>
            <div>
              <span className="text-cyan-400/50 font-mono text-[10px] tracking-[0.2em] uppercase block mb-1.5">
                Did you know?
              </span>
              <p className="text-white/70 text-sm font-serif leading-relaxed">
                {fact}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
