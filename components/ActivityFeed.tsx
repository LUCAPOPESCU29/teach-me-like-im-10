"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface FeedItem {
  userId: string;
  displayName: string;
  amount: number;
  source: string;
  topicSlug: string | null;
  createdAt: string;
}

function sourceLabel(source: string): string {
  if (source === "level_complete") return "reached a new level on";
  if (source === "level") return "learned about";
  if (source === "quiz_ace" || source === "quiz") return "aced a quiz on";
  if (source === "topic") return "learned about";
  if (source === "streak") return "hit a streak milestone";
  if (source === "teachback_pass") return "taught back";
  if (source === "daily") return "completed daily challenge";
  return "earned XP from";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const POLL_INTERVAL = 30_000;

export default function ActivityFeed() {
  const router = useRouter();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const latestTimestamp = useRef<string | null>(null);
  const isScrolledDown = useRef(false);

  const fetchFeed = useCallback(async (isPolling = false) => {
    try {
      const res = await fetch("/api/friends/feed");
      if (!res.ok) return;
      const data = await res.json();
      const feed: FeedItem[] = data.feed || [];

      if (isPolling && latestTimestamp.current && feed.length > 0) {
        const newItems = feed.filter(
          (item) => item.createdAt > latestTimestamp.current!
        );
        if (newItems.length > 0 && isScrolledDown.current) {
          setNewCount((prev) => prev + newItems.length);
        }
      }

      if (feed.length > 0) {
        latestTimestamp.current = feed[0].createdAt;
      }

      setItems(feed);
    } catch {
      // silently fail on poll
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(false);
    const interval = setInterval(() => fetchFeed(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      isScrolledDown.current = container.scrollTop > 60;
      if (container.scrollTop <= 10) {
        setNewCount(0);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setNewCount(0);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/[0.06]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
                <div className="h-2.5 w-1/3 rounded bg-white/[0.04]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-3xl mb-3 opacity-40">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto opacity-30"
          >
            <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="1.5" className="text-white" />
            <path d="M24 14v10l6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-emerald-400" />
          </svg>
        </div>
        <p className="text-white/40 text-sm font-sans mb-1">
          No activity yet
        </p>
        <p className="text-white/25 text-xs font-sans max-w-[240px] mx-auto mb-4">
          Follow some learners to see their activity here!
        </p>
        <button
          onClick={() => router.push("/leaderboard")}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-sans hover:bg-white/10 hover:text-white/60 transition-colors"
        >
          Find learners
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* New activity pill */}
      <AnimatePresence>
        {newCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            onClick={scrollToTop}
            className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-sans backdrop-blur-sm hover:bg-emerald-500/30 transition-colors"
          >
            {newCount} new activit{newCount === 1 ? "y" : "ies"}
          </motion.button>
        )}
      </AnimatePresence>

      <div ref={containerRef} className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-none">
        {items.map((item, i) => (
          <motion.div
            key={`${item.userId}-${item.createdAt}-${i}`}
            className="p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] flex items-start gap-3 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
          >
            {/* Avatar */}
            <button
              onClick={() => router.push(`/profile/${item.userId}`)}
              className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 hover:bg-emerald-500/20 transition-colors"
            >
              <span className="text-emerald-400 text-sm font-display">
                {item.displayName.charAt(0).toUpperCase()}
              </span>
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-sans leading-relaxed">
                <button
                  onClick={() => router.push(`/profile/${item.userId}`)}
                  className="text-white/70 font-medium hover:text-white transition-colors"
                >
                  {item.displayName}
                </button>
                <span className="text-white/35">
                  {" "}{sourceLabel(item.source)}
                  {item.source === "streak" ? "" : " "}
                </span>
                {item.topicSlug && item.source !== "streak" && (
                  <button
                    onClick={() => router.push(`/learn/${item.topicSlug}`)}
                    className="text-emerald-400/70 hover:text-emerald-400 transition-colors capitalize"
                  >
                    {item.topicSlug.replace(/-/g, " ")}
                  </button>
                )}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-emerald-400/50 text-xs font-mono">
                  +{item.amount} XP
                </span>
                <span className="text-white/15 text-[11px] font-sans">
                  {timeAgo(item.createdAt)}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
