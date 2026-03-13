"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  type MathTreeNode,
  getUnlockedBy,
  getPrerequisitesOf,
  getCategoryColor,
  getCategoryIcon,
  getCategoryName,
} from "@/lib/math-tree";

interface Props {
  node: MathTreeNode | null;
  nodes: MathTreeNode[];
  completedSlugs: Set<string>;
  onClose: () => void;
  onSelectNode: (node: MathTreeNode) => void;
  onNavigate: (topicName: string) => void;
}

export default function TreeNodeDetail({
  node,
  nodes,
  completedSlugs,
  onClose,
  onSelectNode,
  onNavigate,
}: Props) {
  return (
    <AnimatePresence>
      {node && (
        <motion.div
          key={node.id}
          // Desktop: right panel. Mobile: bottom sheet
          className="fixed z-50 right-0 bottom-0 sm:top-0 sm:bottom-0 w-full sm:w-[340px] max-h-[65vh] sm:max-h-full overflow-y-auto"
          initial={{ opacity: 0, x: 40, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="h-full p-5 sm:p-6 bg-[#0c1220]/95 backdrop-blur-xl border-l border-t sm:border-t-0 border-white/[0.06]">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors text-lg"
            >
              ✕
            </button>

            {/* Category badge */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-sans mb-4"
              style={{
                backgroundColor: `${getCategoryColor(node.categoryId)}10`,
                border: `1px solid ${getCategoryColor(node.categoryId)}25`,
                color: getCategoryColor(node.categoryId),
              }}
            >
              <span>{getCategoryIcon(node.categoryId)}</span>
              {getCategoryName(node.categoryId)}
            </div>

            {/* Topic name */}
            <h2 className="font-display text-2xl text-white/90 mb-2 pr-6">{node.name}</h2>

            {/* Completed badge */}
            {completedSlugs.has(node.id) && (
              <div className="inline-flex items-center gap-1 text-emerald-400/70 text-xs font-sans mb-3">
                <span>✓</span> Completed
              </div>
            )}

            {/* Description */}
            <p className="text-white/40 text-sm font-serif leading-relaxed mb-6">
              {node.description}
            </p>

            {/* Prerequisites */}
            <TopicSection
              title="Prerequisites"
              emptyText="No prerequisites — start here!"
              topics={getPrerequisitesOf(node.id, nodes)}
              completedSlugs={completedSlugs}
              onSelect={onSelectNode}
            />

            {/* Unlocks */}
            <TopicSection
              title="Unlocks"
              emptyText="This is an advanced topic"
              topics={getUnlockedBy(node.id, nodes)}
              completedSlugs={completedSlugs}
              onSelect={onSelectNode}
            />

            {/* Learn button */}
            <button
              onClick={() => onNavigate(node.name)}
              className="w-full mt-6 px-5 py-3 bg-indigo-500/90 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/20"
            >
              Learn This Topic
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TopicSection({
  title,
  emptyText,
  topics,
  completedSlugs,
  onSelect,
}: {
  title: string;
  emptyText: string;
  topics: MathTreeNode[];
  completedSlugs: Set<string>;
  onSelect: (node: MathTreeNode) => void;
}) {
  return (
    <div className="mb-5">
      <h3 className="text-white/20 text-[10px] font-mono tracking-[0.2em] uppercase mb-2">
        {title}
      </h3>
      {topics.length === 0 ? (
        <p className="text-white/25 text-xs font-sans italic">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {topics.map((t) => {
            const color = getCategoryColor(t.categoryId);
            const done = completedSlugs.has(t.id);
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
                {done && <span className="mr-1 text-emerald-400 opacity-70">✓</span>}
                {t.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
