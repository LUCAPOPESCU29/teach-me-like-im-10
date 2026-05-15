"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface ProUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  featureName: string;
  featureEmoji?: string;
  featureDescription?: string;
}

const EASING = [0.32, 0.72, 0, 1] as const;

export default function ProUpgradeModal({
  open,
  onClose,
  featureName,
  featureEmoji = "⚡",
  featureDescription,
}: ProUpgradeModalProps) {
  const router = useRouter();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="pro-modal-backdrop"
            className="fixed inset-0 z-50"
            style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="pro-modal-panel"
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          >
            <motion.div
              className="relative w-full max-w-sm pointer-events-auto rounded-3xl overflow-hidden"
              style={{
                background: "rgba(7, 11, 20, 0.97)",
                border: "1px solid rgba(52,211,153,0.18)",
                boxShadow:
                  "0 0 0 1px rgba(52,211,153,0.06), 0 32px 64px rgba(0,0,0,0.6), 0 0 60px rgba(52,211,153,0.06)",
              }}
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.28, ease: EASING }}
            >
              {/* Ambient glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.1) 0%, transparent 60%)",
                }}
              />

              {/* Dot pattern overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(52,211,153,0.3) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                  maskImage:
                    "radial-gradient(ellipse at 50% 0%, black 0%, transparent 70%)",
                }}
              />

              <div className="relative px-6 pt-7 pb-6">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.35)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)";
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </button>

                {/* Icon chip */}
                <motion.div
                  className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(52,211,153,0.12) 0%, rgba(16,185,129,0.06) 100%)",
                    border: "1px solid rgba(52,211,153,0.2)",
                    boxShadow: "0 0 20px rgba(52,211,153,0.12)",
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 350, damping: 22 }}
                >
                  {featureEmoji}
                </motion.div>

                {/* Pro badge */}
                <motion.div
                  className="mx-auto mb-3 w-fit px-3 py-0.5 rounded-full flex items-center gap-1.5"
                  style={{
                    background: "rgba(52,211,153,0.08)",
                    border: "1px solid rgba(52,211,153,0.2)",
                  }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: "#34d399",
                      boxShadow: "0 0 6px rgba(52,211,153,0.9)",
                    }}
                  />
                  <span
                    className="text-[10px] font-sans font-semibold tracking-[0.14em] uppercase"
                    style={{ color: "rgba(52,211,153,0.75)" }}
                  >
                    Pro Feature
                  </span>
                </motion.div>

                {/* Heading */}
                <motion.h2
                  className="text-center font-sans text-base font-bold text-white mb-2"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                >
                  {featureName} is Pro-only
                </motion.h2>

                {/* Description */}
                <motion.p
                  className="text-center text-sm font-sans mb-6"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.21 }}
                >
                  {featureDescription ??
                    `Upgrade to Pro to unlock ${featureName} and all other premium features.`}
                </motion.p>

                {/* Perks list */}
                <motion.ul
                  className="space-y-2 mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.24 }}
                >
                  {[
                    { emoji: "🔊", label: "Audio narration for every level" },
                    { emoji: "📝", label: "Teach-it-back AI grading" },
                    { emoji: "🏠", label: "Create private study rooms" },
                    { emoji: "♾️", label: "Unlimited topics (no cooldown)" },
                  ].map((perk, i) => (
                    <motion.li
                      key={perk.label}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.26 + i * 0.05 }}
                    >
                      <span className="text-base w-5 text-center">{perk.emoji}</span>
                      <span className="text-[12px] font-sans" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {perk.label}
                      </span>
                      <div className="ml-auto">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5.5L4.2 7.5L8 3" stroke="#34d399" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>

                {/* CTA */}
                <motion.button
                  onClick={() => { onClose(); router.push("/pro"); }}
                  className="relative w-full h-11 rounded-2xl font-sans font-semibold text-sm overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
                    color: "#000",
                    boxShadow: "0 4px 20px rgba(52,211,153,0.35), 0 1px 0 rgba(255,255,255,0.2) inset",
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Shimmer */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "linear", repeatDelay: 1.2 }}
                  />
                  <span className="relative flex items-center justify-center gap-2">
                    Upgrade to Pro
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.15)" }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4H6.5M6.5 4L4.5 2M6.5 4L4.5 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </span>
                </motion.button>

                <p
                  className="text-center text-[10px] font-sans mt-3"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  Starting at just $5 · Cancel anytime
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
