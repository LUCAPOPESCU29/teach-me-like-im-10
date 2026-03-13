"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import type { TopicHistoryItem } from "@/lib/data";

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
        <div className="text-white/30 font-mono text-sm animate-pulse">Loading...</div>
      ) : isEmpty ? (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-4xl mb-4">{tab === "bookmarks" ? "💛" : "📖"}</p>
          <p className="text-white/30 font-sans text-sm">
            {tab === "bookmarks"
              ? "No bookmarks yet. Click the heart on a topic to save it here."
              : "No topics explored yet. Start learning something new!"}
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm font-sans hover:bg-white/10 transition-colors"
          >
            Explore topics
          </button>
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
  );
}
