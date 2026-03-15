"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LEVEL_META } from "@/lib/utils";
import StreamingText from "@/components/StreamingText";

interface LevelData {
  level: number;
  content: string;
  complete: boolean;
}

interface ShareData {
  shareCode: string;
  sharerName: string;
  topicSlug: string;
  topicName: string;
  lang: string;
  levels: LevelData[];
  maxLevel: number;
  personalMessage: string | null;
  createdAt: string;
}

export default function SharedTopicPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [data, setData] = useState<ShareData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/share/${code}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white/30 font-mono text-sm animate-pulse">
          Loading shared topic...
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400/60 font-mono text-sm">
            {error || "Share not found"}
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-white/30 text-sm font-sans hover:text-white/50"
          >
            Go home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24">
      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-white/20 font-mono text-[10px] tracking-[0.2em] uppercase mb-3">
          Shared Learning
        </div>

        <p className="text-white/40 font-sans text-sm mb-2">
          <span className="text-emerald-400/70">{data.sharerName}</span>{" "}
          learned about...
        </p>

        <h1 className="font-display text-3xl sm:text-4xl text-white mb-2">
          {data.topicName}
        </h1>

        {/* Level progress bar */}
        <div className="flex justify-center gap-1.5 mt-3 mb-2">
          {[1, 2, 3, 4, 5].map((l) => (
            <div
              key={l}
              className="w-10 h-1.5 rounded-full"
              style={{
                backgroundColor:
                  l <= data.maxLevel
                    ? LEVEL_META[l - 1].color
                    : "rgba(255,255,255,0.1)",
              }}
            />
          ))}
        </div>
        <p className="text-white/20 font-mono text-xs">
          Level {data.maxLevel} of 5
        </p>

        {/* Personal message */}
        {data.personalMessage && (
          <motion.div
            className="mt-6 mx-auto max-w-md p-4 rounded-xl bg-white/[0.03] border border-white/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-white/50 font-serif text-sm italic leading-relaxed">
              &ldquo;{data.personalMessage}&rdquo;
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Level cards (read-only) */}
      <div className="space-y-6">
        {data.levels.map((level) => {
          const meta = LEVEL_META[level.level - 1];
          return (
            <motion.div
              key={level.level}
              className="relative rounded-2xl border bg-white/[0.02] overflow-hidden"
              style={{ borderColor: `${meta.color}12` }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: level.level * 0.1 }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
                style={{
                  background: `linear-gradient(to bottom, ${meta.color}, ${meta.color}40)`,
                }}
              />
              <div className="p-6 sm:p-8 pl-7 sm:pl-10">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-2xl">{meta.emoji}</span>
                  <h2
                    className="text-lg font-display font-semibold"
                    style={{ color: meta.color }}
                  >
                    Level {level.level}: {meta.label}
                  </h2>
                </div>
                <StreamingText content={level.content} isStreaming={false} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CTA: Learn it yourself */}
      <motion.div
        className="mt-10 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-white/30 font-sans text-sm mb-4">
          Want to explore this topic at your own pace?
        </p>
        <button
          onClick={() => {
            const params = new URLSearchParams();
            if (data.lang !== "en") params.set("lang", data.lang);
            const qs = params.toString();
            router.push(`/learn/${data.topicSlug}${qs ? `?${qs}` : ""}`);
          }}
          className="px-8 py-3 rounded-xl font-mono text-sm tracking-wider border border-emerald-500/40 text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all"
        >
          LEARN IT YOURSELF &rarr;
        </button>
        <div className="mt-4">
          <button
            onClick={() => router.push("/")}
            className="text-white/20 text-xs font-sans hover:text-white/40 transition-colors"
          >
            or explore other topics
          </button>
        </div>
      </motion.div>
    </main>
  );
}
