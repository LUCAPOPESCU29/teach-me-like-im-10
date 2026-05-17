"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import type { TopicHistoryItem } from "@/lib/data";
import PageTransition from "@/components/PageTransition";

type Tab = "bookmarks" | "history";

export default function LibraryPage() {
  const { data: dataLayer } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("bookmarks");
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<{ slug: string; topicName: string; lang: string; createdAt: string }[]>([]);
  const [history, setHistory] = useState<TopicHistoryItem[]>([]);
  const [ratings, setRatings] = useState<Record<string, { avg: number; total: number }>>({});

  useEffect(() => {
    async function load() {
      const [bm, hist] = await Promise.all([
        dataLayer.getBookmarks(),
        dataLayer.getTopicHistory(),
      ]);
      setBookmarks(bm);
      setHistory(hist);
      setLoading(false);

      // Fetch ratings for all unique slugs
      const allSlugs = [...new Set([...bm.map((b) => b.slug), ...hist.map((h) => h.slug)])];
      const ratingMap: Record<string, { avg: number; total: number }> = {};
      await Promise.all(
        allSlugs.map(async (s) => {
          try {
            const res = await fetch(`/api/topics/rating?slug=${encodeURIComponent(s)}`);
            const data = await res.json();
            if (data.avgRating !== null && data.totalRatings > 0) {
              ratingMap[s] = { avg: data.avgRating, total: data.totalRatings };
            }
          } catch {}
        })
      );
      setRatings(ratingMap);
    }
    load();
  }, [dataLayer]);

  const isEmpty = tab === "bookmarks" ? bookmarks.length === 0 : history.length === 0;

  const levelColors = ["#4ade80", "#facc15", "#fb923c", "#f472b6", "#a78bfa"];

  return (
    <PageTransition>
    <main className="min-h-screen max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => router.push("/")}
          className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans mb-4 inline-block"
        >
          ← Home
        </button>
        <h1 className="font-display text-3xl sm:text-4xl text-white">My Library</h1>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/5 w-fit">
        <button
          onClick={() => setTab("bookmarks")}
          className={`px-4 py-2 rounded-lg font-sans text-sm transition-all ${
            tab === "bookmarks"
              ? "bg-white/10 text-white"
              : "text-white/30 hover:text-white/50"
          }`}
        >
          Bookmarks
          {bookmarks.length > 0 && (
            <span className="ml-1.5 text-xs text-white/20">{bookmarks.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 rounded-lg font-sans text-sm transition-all ${
            tab === "history"
              ? "bg-white/10 text-white"
              : "text-white/30 hover:text-white/50"
          }`}
        >
          History
          {history.length > 0 && (
            <span className="ml-1.5 text-xs text-white/20">{history.length}</span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/20 font-mono text-sm py-8">
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            ···
          </motion.span>
        </div>
      ) : isEmpty ? (
        <motion.div
          className="flex flex-col items-center py-20 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        >
          {tab === "bookmarks" ? (
            /* Bookmarks empty state — floating bookmark icon */
            <div className="relative mb-8 w-28 h-28">
              {/* Glow */}
              <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 70%)" }} />
              {/* Orbiting dots */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ["#fbbf24","#34d399","#a78bfa"][i],
                    transformOrigin: "0 0",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 4 + i * 1.5,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.8,
                  }}
                  initial={false}
                >
                  <div
                    className="absolute"
                    style={{
                      top: -3,
                      left: -(40 + i * 12),
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: ["#fbbf24","#34d399","#a78bfa"][i],
                      opacity: 0.7,
                    }}
                  />
                </motion.div>
              ))}
              {/* Centre icon */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(251,191,36,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </motion.div>
            </div>
          ) : (
            /* History empty state — open book / sparkle */
            <div className="relative mb-8 w-28 h-28">
              <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.16) 0%, transparent 70%)" }} />
              {/* Sparkle dots */}
              {[
                { x: -32, y: -20, size: 6, color: "#34d399", delay: 0 },
                { x: 32, y: -24, size: 4, color: "#6ee7b7", delay: 0.6 },
                { x: 36, y: 20, size: 5, color: "#a7f3d0", delay: 1.2 },
                { x: -36, y: 22, size: 4, color: "#34d399", delay: 1.8 },
              ].map((dot, i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 rounded-full"
                  style={{
                    width: dot.size,
                    height: dot.size,
                    backgroundColor: dot.color,
                    marginLeft: dot.x - dot.size / 2,
                    marginTop: dot.y - dot.size / 2,
                  }}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: dot.delay,
                    ease: "easeInOut",
                  }}
                />
              ))}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(52,211,153,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </motion.div>
            </div>
          )}

          <p className="text-white/60 font-sans text-base font-medium mb-2">
            {tab === "bookmarks" ? "Nothing saved yet" : "No learning history yet"}
          </p>
          <p className="text-white/25 font-sans text-sm max-w-[260px] leading-relaxed mb-8">
            {tab === "bookmarks"
              ? "Tap the bookmark icon on any topic to save it here for later."
              : "Start exploring topics and your history will show up here."}
          </p>
          <motion.button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 rounded-xl font-sans text-sm font-medium text-white/70 hover:text-white transition-colors"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.06)" }}
            whileTap={{ scale: 0.98 }}
          >
            Explore topics →
          </motion.button>
        </motion.div>
      ) : tab === "bookmarks" ? (
        <div className="space-y-2">
          {bookmarks.map((item, i) => (
            <motion.button
              key={`${item.slug}-${i}`}
              onClick={() => router.push(`/learn/${item.slug}`)}
              className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all flex items-center gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <span className="text-amber-400 text-lg">♥</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-sans text-sm capitalize truncate">
                  {item.topicName.replace(/-/g, " ")}
                </p>
              </div>
              {ratings[item.slug] && (
                <span className="text-white/30 text-xs font-sans flex items-center gap-1 shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {ratings[item.slug].avg.toFixed(1)}
                </span>
              )}
              <span className="text-white/20 text-xs font-sans">→</span>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item, i) => (
            <motion.button
              key={`${item.slug}-${i}`}
              onClick={() => router.push(`/learn/${item.slug}`)}
              className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all flex items-center gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {item.maxLevel > 0 && (
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((l) => (
                    <div
                      key={l}
                      className="w-1.5 h-6 rounded-full"
                      style={{
                        backgroundColor: l <= item.maxLevel ? levelColors[l - 1] : "rgba(255,255,255,0.05)",
                      }}
                    />
                  ))}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-sans text-sm capitalize truncate">
                  {item.topicName.replace(/-/g, " ")}
                </p>
                {item.maxLevel > 0 && (
                  <p className="text-white/20 text-xs font-mono mt-0.5">
                    Level {item.maxLevel} of 5
                  </p>
                )}
              </div>
              {ratings[item.slug] && (
                <span className="text-white/30 text-xs font-sans flex items-center gap-1 shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {ratings[item.slug].avg.toFixed(1)}
                </span>
              )}
              <span className="text-white/20 text-xs font-sans">→</span>
            </motion.button>
          ))}
        </div>
      )}
    </main>
  </PageTransition>
  );
}
