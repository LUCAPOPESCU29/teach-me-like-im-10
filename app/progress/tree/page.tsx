"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import {
  type LearningTreeData,
  type LearningTreeNode,
  computeTreeCacheKey,
  getCachedTree,
  setCachedTree,
} from "@/lib/learning-tree";
import type { TopicHistoryItem } from "@/lib/data";
import LearningTree from "@/components/LearningTree";
import LearningTreeDetail from "@/components/LearningTreeDetail";
import XPBadge from "@/components/XPBadge";
import UserMenu from "@/components/UserMenu";

export default function ProgressTreePage() {
  const router = useRouter();
  const { data: dataLayer } = useAuth();
  const [topicHistory, setTopicHistory] = useState<TopicHistoryItem[]>([]);
  const [treeData, setTreeData] = useState<LearningTreeData | null>(null);
  const [selectedNode, setSelectedNode] = useState<LearningTreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = useCallback(async (history: TopicHistoryItem[]) => {
    const slugs = history.map((t) => t.slug);
    const cacheKey = computeTreeCacheKey(slugs, "tmi10_tree_");
    const cached = getCachedTree(cacheKey);
    if (cached) {
      setTreeData(cached);
      setLoading(false);
      return;
    }

    try {
      const topicNames = history.slice(0, 30).map((t) => t.topicName);
      const res = await fetch("/api/topics/tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics: topicNames, mode: "general" }),
      });

      if (!res.ok) throw new Error("Failed to generate tree");

      const data: LearningTreeData = await res.json();
      setCachedTree(cacheKey, data);
      setTreeData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    dataLayer.getTopicHistory().then((history) => {
      setTopicHistory(history);
      if (history.length >= 3) {
        fetchTree(history);
      } else {
        setLoading(false);
      }
    });
  }, [dataLayer, fetchTree]);

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-16 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.05] blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-500/[0.04] blur-[100px] pointer-events-none" />

      {/* Top bar */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <XPBadge />
        <UserMenu />
      </div>
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => router.push("/progress")}
          className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] hover:border-white/10 font-sans text-xs transition-all duration-300"
        >
          Progress
        </button>
      </div>

      {/* Header */}
      <motion.div
        className="text-center mb-8 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-display text-4xl sm:text-5xl text-white mb-2">
          My{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            Learning Tree
          </span>
        </h1>
        <p className="text-white/30 text-sm font-serif max-w-md mx-auto">
          See how your explored topics connect to each other.
        </p>
      </motion.div>

      {/* Content */}
      {loading ? (
        <motion.div
          className="text-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex justify-center gap-2 mb-4">
            {["#4ade80", "#fbbf24", "#f97316", "#f43f5e", "#a855f7"].map((color, i) => (
              <motion.div
                key={color}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
          <p className="text-white/30 text-sm font-sans">
            Mapping your knowledge connections...
          </p>
        </motion.div>
      ) : topicHistory.length < 3 ? (
        <motion.div
          className="text-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-white/40 text-sm font-sans mb-2">
            Explore at least 3 topics to build your learning tree.
          </p>
          <p className="text-white/25 text-xs font-sans">
            You&apos;ve explored {topicHistory.length} topic{topicHistory.length !== 1 ? "s" : ""} so far.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-sans hover:bg-emerald-500/20 transition-colors"
          >
            Start Exploring
          </button>
        </motion.div>
      ) : error ? (
        <motion.div
          className="text-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-white/40 text-sm font-sans">{error}</p>
        </motion.div>
      ) : treeData ? (
        <>
          {/* Legend */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-6 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {treeData.categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color, opacity: 0.7 }}
                />
                <span className="text-white/30 text-[10px] font-sans">{cat.name}</span>
              </div>
            ))}
          </motion.div>

          {/* Tree */}
          <motion.div
            className="w-full max-w-6xl relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <LearningTree
              data={treeData}
              topicHistory={topicHistory}
              selectedNodeId={selectedNode?.id ?? null}
              onSelectNode={setSelectedNode}
            />
          </motion.div>

          <LearningTreeDetail
            node={selectedNode}
            data={treeData}
            topicHistory={topicHistory}
            onClose={() => setSelectedNode(null)}
            onSelectNode={setSelectedNode}
            onNavigate={(name) => router.push(`/learn/${slugify(name)}`)}
            themeColor="emerald"
          />
        </>
      ) : null}

      {/* Back link */}
      <motion.button
        onClick={() => router.push("/progress")}
        className="mt-10 text-white/20 hover:text-white/50 transition-colors text-sm font-sans relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Back to Progress
      </motion.button>
    </main>
  );
}
