"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareTopicCardProps {
  topicSlug: string;
  topicName: string;
  level: number;
  xp: number;
}

function drawShareCard(
  canvas: HTMLCanvasElement,
  topicName: string,
  level: number,
  xp: number
) {
  const W = 600;
  const H = 400;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Gradient background: emerald to purple
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#059669"); // emerald-600
  bg.addColorStop(0.5, "#7c3aed"); // violet-600
  bg.addColorStop(1, "#9333ea"); // purple-600
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 24);
  ctx.fill();

  // Subtle overlay pattern - diagonal lines
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }
  ctx.restore();

  // Inner card area
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.roundRect(30, 30, W - 60, H - 60, 16);
  ctx.fill();
  ctx.restore();

  // Inner border
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(30, 30, W - 60, H - 60, 16);
  ctx.stroke();
  ctx.restore();

  // Topic name
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Measure and fit topic name
  let fontSize = 36;
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
  while (ctx.measureText(topicName).width > W - 120 && fontSize > 18) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
  }
  ctx.fillText(topicName, W / 2, 120);

  // Level indicator
  ctx.font = "600 18px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(`Level ${level}/5`, W / 2, 170);

  // Level progress bar
  const barW = 200;
  const barH = 8;
  const barX = (W - barW) / 2;
  const barY = 192;

  // Bar background
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 4);
  ctx.fill();

  // Bar fill
  const fillW = (level / 5) * barW;
  const barGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
  barGrad.addColorStop(0, "#34d399"); // emerald-400
  barGrad.addColorStop(1, "#6ee7b7"); // emerald-300
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(barX, barY, fillW, barH, 4);
  ctx.fill();

  // XP earned
  ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#6ee7b7"; // emerald-300
  ctx.fillText(`${xp} XP`, W / 2, 242);

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 80, 280);
  ctx.lineTo(W / 2 + 80, 280);
  ctx.stroke();

  // Branding
  ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("Teach Me Like I'm 10", W / 2, 310);

  ctx.font = "12px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText("learn anything, simply", W / 2, 335);
}

export default function ShareTopicCard({
  topicSlug,
  topicName,
  level,
  xp,
}: ShareTopicCardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawnRef = useRef(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/learn/${topicSlug}`
      : `/learn/${topicSlug}`;

  const drawCard = useCallback(() => {
    if (canvasRef.current && !drawnRef.current) {
      drawShareCard(canvasRef.current, topicName, level, xp);
      drawnRef.current = true;
    }
  }, [topicName, level, xp]);

  function handleOpen() {
    drawnRef.current = false;
    setOpen(true);
    // Draw after the canvas is mounted
    requestAnimationFrame(() => {
      requestAnimationFrame(drawCard);
    });
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${topicSlug}-level-${level}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function handleWebShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const shareData: ShareData = {
      title: `${topicName} - Teach Me Like I'm 10`,
      text: `I reached Level ${level}/5 on "${topicName}" and earned ${xp} XP!`,
      url: shareUrl,
    };

    // Try sharing with image if supported
    try {
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, "image/png")
      );
      if (blob && navigator.canShare) {
        const file = new File([blob], `${topicSlug}.png`, {
          type: "image/png",
        });
        const dataWithFile = { ...shareData, files: [file] };
        if (navigator.canShare(dataWithFile)) {
          await navigator.share(dataWithFile);
          return;
        }
      }
    } catch {}

    // Fallback: share without image
    try {
      await navigator.share(shareData);
    } catch {}
  }

  return (
    <>
      <motion.button
        onClick={handleOpen}
        className="group relative px-4 sm:px-5 py-2.5 rounded-xl font-mono text-sm tracking-wider overflow-hidden"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="absolute inset-0 border border-emerald-500/30 rounded-xl" />
        <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
        <span className="relative z-10 text-emerald-400 flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          SHARE
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a1020] p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-white font-sans text-lg font-semibold mb-4">
                Share your progress
              </h2>

              {/* Canvas card preview */}
              <div className="rounded-xl overflow-hidden border border-white/10 mb-5">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto"
                  style={{ display: "block" }}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-sans text-sm hover:bg-emerald-500/20 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </button>

                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-sans text-sm hover:bg-white/10 hover:text-white/90 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  {copied ? "Copied!" : "Copy link"}
                </button>

                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button
                    onClick={handleWebShare}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 font-sans text-sm hover:bg-purple-500/20 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 19V5m0 0l-4 4m4-4l4 4"
                      />
                    </svg>
                    Share
                  </button>
                )}
              </div>

              <button
                onClick={() => setOpen(false)}
                className="w-full mt-3 py-2 text-white/30 text-sm font-sans hover:text-white/50 transition-colors"
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
