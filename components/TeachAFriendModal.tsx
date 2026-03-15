"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LEVEL_META } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { useCelebration } from "@/components/CelebrationProvider";
import { createClient } from "@/lib/supabase/client";
import type { LevelData } from "@/lib/data";

interface TeachAFriendModalProps {
  topic: string;
  slug: string;
  lang: string;
  levels: LevelData[];
  onClose: () => void;
}

export default function TeachAFriendModal({
  topic,
  slug,
  lang,
  levels,
  onClose,
}: TeachAFriendModalProps) {
  const { user, data: dataLayer } = useAuth();
  const { celebrate } = useCelebration();

  const [step, setStep] = useState<"compose" | "creating" | "share">(
    "compose"
  );
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const completedLevels = levels.filter((l) => l.complete);
  const maxLevel = Math.max(...completedLevels.map((l) => l.level), 0);

  async function handleCreate() {
    setStep("creating");
    setError("");
    try {
      let sharerName = "A friend";
      let sharerUserId: string | null = null;

      if (user) {
        sharerUserId = user.id;
        const supabase = createClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();
        if (profile?.display_name) {
          sharerName = profile.display_name;
        }
      }

      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicSlug: slug,
          topicName: topic,
          lang,
          levels: completedLevels,
          sharerName,
          sharerUserId,
          message: message.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setCode(data.code);
      setStep("share");

      // Award 25 XP for sharing (once per topic)
      if (user) {
        const supabase = createClient();
        const { data: existing } = await supabase
          .from("xp_events")
          .select("id")
          .eq("user_id", user.id)
          .eq("source", "share")
          .eq("topic_slug", slug)
          .limit(1)
          .maybeSingle();

        if (!existing) {
          const xpResult = await dataLayer.addXP(25, "share", slug);
          celebrate({ xp: xpResult.xpGained, sound: "chime" });
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create share");
      setStep("compose");
    }
  }

  const shareUrl = code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${code}`
    : "";

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleNativeShare() {
    const text = `I learned about "${topic}" on Teach Me Like I'm 10 — check out what I discovered!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${topic} — Teach Me Like I'm 10`,
          text,
          url: shareUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopy();
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="max-w-sm w-full rounded-2xl border border-white/10 bg-[#0a1020]/95 backdrop-blur-xl p-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {step === "compose" && (
            <div>
              <h3 className="font-mono text-sm tracking-wider text-amber-400 mb-1">
                TEACH A FRIEND
              </h3>
              <p className="text-white/30 text-xs font-sans mb-4">
                Share your explanations for &ldquo;{topic}&rdquo;
              </p>

              {/* Level preview */}
              <div className="flex gap-1.5 mb-4">
                {[1, 2, 3, 4, 5].map((l) => (
                  <div
                    key={l}
                    className="flex-1 h-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        l <= maxLevel
                          ? LEVEL_META[l - 1].color
                          : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
              <p className="text-white/20 font-mono text-[10px] mb-4">
                Sharing {completedLevels.length} level
                {completedLevels.length !== 1 ? "s" : ""}
              </p>

              {/* Personal message */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message (optional)"
                maxLength={280}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-sans text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 mb-1 resize-none"
              />
              <p className="text-white/10 font-mono text-[10px] text-right mb-4">
                {message.length}/280
              </p>

              {error && (
                <p className="text-red-400/60 font-mono text-xs mb-3">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/30 font-mono text-xs hover:bg-white/5 transition-all"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-amber-500/40 text-amber-300 font-mono text-xs bg-amber-500/5 hover:bg-amber-500/10 transition-all"
                >
                  CREATE LINK
                </button>
              </div>
            </div>
          )}

          {step === "creating" && (
            <div className="text-center py-4">
              <div className="text-white/30 font-mono text-sm animate-pulse">
                Creating share link...
              </div>
            </div>
          )}

          {step === "share" && (
            <div className="text-center">
              <h3 className="font-mono text-sm tracking-wider text-amber-400 mb-1">
                LINK CREATED!
              </h3>
              <p className="text-white/30 text-xs font-sans mb-4">
                Your friend will see your explanations
              </p>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                <p className="text-white/20 font-mono text-xs truncate">
                  {shareUrl}
                </p>
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={handleCopy}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 font-mono text-xs hover:bg-white/5 transition-all"
                >
                  {copied ? "COPIED!" : "COPY LINK"}
                </button>
                <button
                  onClick={handleNativeShare}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-amber-500/40 text-amber-300 font-mono text-xs bg-amber-500/5 hover:bg-amber-500/10 transition-all"
                >
                  SHARE
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full mt-2 py-2 text-white/20 text-xs font-sans hover:text-white/40 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
