"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  type LearningTreeNode,
  type LearningTreeData,
  getEdgesFrom,
  getEdgesTo,
  getCategoryById,
} from "@/lib/learning-tree";
import type { TopicHistoryItem } from "@/lib/data";

const LEVEL_COLORS = ["#4ade80", "#fbbf24", "#f97316", "#f43f5e", "#a855f7"];
const LEVEL_NAMES = ["Basics", "Deeper", "Full Picture", "Expert", "Frontier"];

interface Props {
  node: LearningTreeNode | null;
  data: LearningTreeData;
  topicHistory: TopicHistoryItem[];
  onClose: () => void;
  onSelectNode: (node: LearningTreeNode) => void;
  onNavigate: (topicName: string) => void;
  themeColor?: "emerald" | "indigo";
}

export default function LearningTreeDetail({
  node,
  data,
  topicHistory,
  onClose,
  onSelectNode,
  onNavigate,
  themeColor = "emerald",
}: Props) {
  const btnClass = themeColor === "indigo"
    ? "bg-indigo-500/90 hover:bg-indigo-500 hover:shadow-indigo-500/20"
    : "bg-emerald-500/90 hover:bg-emerald-500 hover:shadow-emerald-500/20";

  return (
    <AnimatePresence>
      {node && (
        <DetailContent
          key={node.id}
          node={node}
          data={data}
          topicHistory={topicHistory}
          onClose={onClose}
          onSelectNode={onSelectNode}
          onNavigate={onNavigate}
          btnClass={btnClass}
        />
      )}
    </AnimatePresence>
  );
}

function DetailContent({
  node,
  data,
  topicHistory,
  onClose,
  onSelectNode,
  onNavigate,
  btnClass,
}: {
  node: LearningTreeNode;
  data: LearningTreeData;
  topicHistory: TopicHistoryItem[];
  onClose: () => void;
  onSelectNode: (node: LearningTreeNode) => void;
  onNavigate: (topicName: string) => void;
  btnClass: string;
}) {
  const cat = getCategoryById(node.categoryId, data.categories);
  const color = cat?.color ?? "#888";
  const histItem = topicHistory.find((t) => t.slug === node.id);
  const maxLevel = histItem?.maxLevel ?? 0;

  // Edges pointing to this node = prerequisites
  const inEdges = getEdgesTo(node.id, data.edges);
  const prereqNodes = inEdges
    .filter((e) => e.type === "prerequisite" || e.type === "builds-on")
    .map((e) => data.nodes.find((n) => n.id === e.from))
    .filter(Boolean) as LearningTreeNode[];

  // Edges from this node = unlocks
  const outEdges = getEdgesFrom(node.id, data.edges);
  const unlockNodes = outEdges
    .filter((e) => e.type === "prerequisite" || e.type === "builds-on")
    .map((e) => data.nodes.find((n) => n.id === e.to))
    .filter(Boolean) as LearningTreeNode[];

  // Related (either direction)
  const allEdges = [...inEdges, ...outEdges];
  const relatedNodes = allEdges
    .filter((e) => e.type === "related")
    .map((e) => {
      const otherId = e.from === node.id ? e.to : e.from;
      return data.nodes.find((n) => n.id === otherId);
    })
    .filter(Boolean) as LearningTreeNode[];

  return (
    <motion.div
      className="fixed z-50 right-0 bottom-0 sm:top-0 sm:bottom-0 w-full sm:w-[340px] max-h-[65vh] sm:max-h-full overflow-y-auto"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="h-full p-5 sm:p-6 bg-[#0c1220]/95 backdrop-blur-xl border-l border-t sm:border-t-0 border-white/[0.06]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors text-lg"
        >
          ✕
        </button>

        {/* Category badge */}
        {cat && (
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-sans mb-4"
            style={{
              backgroundColor: `${color}10`,
              border: `1px solid ${color}25`,
              color,
            }}
          >
            {cat.name}
          </div>
        )}

        {/* Topic name */}
        <h2 className="font-display text-2xl text-white/90 mb-2 pr-6">{node.name}</h2>

        {/* Level indicator */}
        {maxLevel > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((lvl) => (
                <div
                  key={lvl}
                  className="w-5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: maxLevel > lvl ? LEVEL_COLORS[lvl] : "rgba(255,255,255,0.06)",
                  }}
                />
              ))}
            </div>
            <span className="text-white/30 text-xs font-sans">
              Level {maxLevel} — {LEVEL_NAMES[Math.min(maxLevel - 1, 4)]}
            </span>
          </div>
        )}

        {/* Prerequisites */}
        {prereqNodes.length > 0 && (
          <TopicSection
            title="Prerequisites"
            topics={prereqNodes}
            data={data}
            topicHistory={topicHistory}
            onSelect={onSelectNode}
          />
        )}

        {/* Unlocks */}
        {unlockNodes.length > 0 && (
          <TopicSection
            title="Unlocks"
            topics={unlockNodes}
            data={data}
            topicHistory={topicHistory}
            onSelect={onSelectNode}
          />
        )}

        {/* Related */}
        {relatedNodes.length > 0 && (
          <TopicSection
            title="Related"
            topics={relatedNodes}
            data={data}
            topicHistory={topicHistory}
            onSelect={onSelectNode}
          />
        )}

        {prereqNodes.length === 0 && unlockNodes.length === 0 && relatedNodes.length === 0 && (
          <p className="text-white/25 text-xs font-sans italic mb-4">
            No connections found for this topic
          </p>
        )}

        {/* Navigate button */}
        <button
          onClick={() => onNavigate(node.name)}
          className={`w-full mt-6 px-5 py-3 text-white rounded-xl font-medium text-sm transition-all duration-200 hover:shadow-lg ${btnClass}`}
        >
          {maxLevel > 0 ? "Continue Learning" : "Start Learning"}
        </button>
      </div>
    </motion.div>
  );
}

function TopicSection({
  title,
  topics,
  data,
  topicHistory,
  onSelect,
}: {
  title: string;
  topics: LearningTreeNode[];
  data: LearningTreeData;
  topicHistory: TopicHistoryItem[];
  onSelect: (node: LearningTreeNode) => void;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-white/20 text-[10px] font-mono tracking-[0.2em] uppercase mb-2">
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {topics.map((t) => {
          const cat = getCategoryById(t.categoryId, data.categories);
          const color = cat?.color ?? "#888";
          const hist = topicHistory.find((h) => h.slug === t.id);
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="px-2.5 py-1 rounded-lg text-xs font-sans transition-all duration-200 hover:scale-[1.03]"
              style={{
                backgroundColor: `${color}10`,
                border: `1px solid ${color}20`,
                color: `${color}cc`,
              }}
            >
              {hist && hist.maxLevel > 0 && (
                <span className="mr-1 text-emerald-400 opacity-70">✓</span>
              )}
              {t.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
