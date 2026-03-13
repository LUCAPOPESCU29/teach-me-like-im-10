"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import { MATH_TREE_NODES, buildEdges, type MathTreeNode } from "@/lib/math-tree";
import { useAuth } from "@/components/AuthProvider";
import MathAncestryTree from "@/components/MathAncestryTree";
import TreeNodeDetail from "@/components/TreeNodeDetail";
import XPBadge from "@/components/XPBadge";
import UserMenu from "@/components/UserMenu";

const edges = buildEdges(MATH_TREE_NODES);

export default function MathTreePage() {
  const router = useRouter();
  const { data: dataLayer } = useAuth();
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<MathTreeNode | null>(null);

  useEffect(() => {
    dataLayer.getTopicHistory().then((history) => {
      setCompletedSlugs(new Set(history.map((t) => t.slug)));
    });
  }, [dataLayer]);

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-16 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/[0.05] blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-violet-500/[0.04] blur-[100px] pointer-events-none" />

      {/* Top bar */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <XPBadge />
        <UserMenu />
      </div>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => router.push("/math")}
          className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] hover:border-white/10 font-sans text-xs transition-all duration-300"
        >
          Math Home
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
          Math{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            Ancestry Tree
          </span>
        </h1>
        <p className="text-white/30 text-sm font-serif max-w-md mx-auto">
          See how math concepts connect and build on each other.
          Click any node to explore.
        </p>
      </motion.div>

      {/* Legend */}
      <motion.div
        className="flex flex-wrap justify-center gap-3 mb-6 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {[
          { id: "numbers", label: "Numbers" },
          { id: "algebra", label: "Algebra" },
          { id: "geometry", label: "Geometry" },
          { id: "statistics", label: "Statistics" },
          { id: "calculus", label: "Calculus" },
        ].map(({ id, label }) => {
          const color =
            id === "numbers" ? "#60a5fa"
            : id === "algebra" ? "#a78bfa"
            : id === "geometry" ? "#34d399"
            : id === "statistics" ? "#fbbf24"
            : "#f472b6";
          return (
            <div key={id} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color, opacity: 0.7 }}
              />
              <span className="text-white/30 text-[10px] font-sans">{label}</span>
            </div>
          );
        })}
      </motion.div>

      {/* Tree */}
      <motion.div
        className="w-full max-w-6xl relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <MathAncestryTree
          nodes={MATH_TREE_NODES}
          edges={edges}
          completedSlugs={completedSlugs}
          selectedNodeId={selectedNode?.id ?? null}
          onSelectNode={setSelectedNode}
        />
      </motion.div>

      {/* Detail panel */}
      <TreeNodeDetail
        node={selectedNode}
        nodes={MATH_TREE_NODES}
        completedSlugs={completedSlugs}
        onClose={() => setSelectedNode(null)}
        onSelectNode={setSelectedNode}
        onNavigate={(name) => router.push(`/learn/${slugify(name)}?mode=math`)}
      />

      {/* Back link */}
      <motion.button
        onClick={() => router.push("/math")}
        className="mt-10 text-white/20 hover:text-white/50 transition-colors text-sm font-sans relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Back to Math Edition
      </motion.button>
    </main>
  );
}
