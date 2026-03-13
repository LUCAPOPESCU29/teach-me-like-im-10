"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  topic: string;
  slug: string;
  level: number;
}

export default function ShareButton({ topic, slug, level }: Props) {
  const [showCard, setShowCard] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/learn/${slug}`;
  const shareText = `I just learned about ${topic} at Level ${level} on Teach Me Like I'm 10! 🧠`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${topic} — Teach Me Like I'm 10`, text: shareText, url: shareUrl });
      } catch {}
    } else {
      setShowCard(true);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <>
      <motion.button
        onClick={handleShare}
        className="group relative px-5 py-2.5 rounded-xl font-mono text-sm tracking-wider overflow-hidden"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="absolute inset-0 border border-emerald-500/30 rounded-xl" />
        <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
        <span className="relative z-10 text-emerald-400 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          SHARE
        </span>
      </motion.button>

      <AnimatePresence>
        {showCard && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCard(false)}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a1020] p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Share card preview */}
              <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-purple-500/10 border border-white/10 p-5 mb-4">
                <div className="text-center">
                  <p className="text-emerald-400 font-mono text-xs mb-2">TEACH ME LIKE I&apos;M 10</p>
                  <h3 className="text-white text-xl font-display mb-1">{topic}</h3>
                  <p className="text-white/40 text-sm font-sans">
                    Reached Level {level} of 5
                  </p>
                  <div className="flex justify-center gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map((l) => (
                      <div
                        key={l}
                        className={`w-8 h-1.5 rounded-full ${
                          l <= level ? "bg-emerald-400" : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleCopy}
                className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-sans text-sm hover:bg-emerald-500/20 transition-colors"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>

              <button
                onClick={() => setShowCard(false)}
                className="w-full mt-2 py-2 text-white/30 text-sm font-sans hover:text-white/50 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
