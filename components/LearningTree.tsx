"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  type LearningTreeData,
  type LearningTreeNode,
  computeDynamicLayout,
  edgePath,
  getCategoryById,
  TREE_W,
  TREE_H,
} from "@/lib/learning-tree";
import type { TopicHistoryItem } from "@/lib/data";

const NODE_R = 22;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "\u2026" : str;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? "1" : "0";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

const LEVEL_COLORS = ["#4ade80", "#fbbf24", "#f97316", "#f43f5e", "#a855f7"];

interface Props {
  data: LearningTreeData;
  topicHistory: TopicHistoryItem[];
  selectedNodeId: string | null;
  onSelectNode: (node: LearningTreeNode) => void;
}

export default function LearningTree({
  data,
  topicHistory,
  selectedNodeId,
  onSelectNode,
}: Props) {
  const layout = useMemo(() => computeDynamicLayout(data.nodes), [data.nodes]);
  const posMap = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const ln of layout) m.set(ln.id, { x: ln.x, y: ln.y });
    return m;
  }, [layout]);

  const historyMap = useMemo(() => {
    const m = new Map<string, TopicHistoryItem>();
    for (const t of topicHistory) m.set(t.slug, t);
    return m;
  }, [topicHistory]);

  const stars = useMemo(() => {
    const rng = seededRandom(99);
    return Array.from({ length: 80 }, () => ({
      x: rng() * TREE_W,
      y: rng() * TREE_H,
      r: 0.4 + rng() * 1.2,
      opacity: 0.02 + rng() * 0.05,
    }));
  }, []);

  // Compute tier labels from actual tiers
  const tierLabels = useMemo(() => {
    const tiers = [...new Set(data.nodes.map((n) => n.tier))].sort((a, b) => a - b);
    if (tiers.length < 3) return [];
    const labels = ["Foundations", "Basics", "Core", "Intermediate", "Advanced", "Expert"];
    return tiers.map((t, i) => ({
      tier: t,
      label: labels[Math.min(i, labels.length - 1)],
      x: layout.find((ln) => ln.node.tier === t)?.x ?? 0,
    }));
  }, [data.nodes, layout]);

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <svg
        viewBox={`0 0 ${TREE_W} ${TREE_H}`}
        className="w-full min-w-[900px]"
        style={{ maxHeight: "600px" }}
      >
        <defs>
          <filter id="ltree-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background stars */}
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.opacity} />
        ))}

        {/* Tier labels */}
        {tierLabels.map(({ label, x }) => (
          <text
            key={label}
            x={x}
            y={24}
            textAnchor="middle"
            fill="rgba(255,255,255,0.12)"
            fontSize="9"
            fontFamily="var(--font-sans), system-ui, sans-serif"
            letterSpacing="0.15em"
          >
            {label.toUpperCase()}
          </text>
        ))}

        {/* Edges */}
        {data.edges.map((edge) => {
          const from = posMap.get(edge.from);
          const to = posMap.get(edge.to);
          if (!from || !to) return null;

          const connectedToSelected = edge.from === selectedNodeId || edge.to === selectedNodeId;
          const toNode = data.nodes.find((n) => n.id === edge.to);
          const cat = toNode ? getCategoryById(toNode.categoryId, data.categories) : undefined;
          const color = cat?.color ?? "#ffffff";

          const isRelated = edge.type === "related";

          let strokeColor = "rgba(255,255,255,0.04)";
          let strokeWidth = 1;
          let opacity = 1;
          let dashArray: string | undefined;

          if (connectedToSelected) {
            strokeColor = color;
            strokeWidth = 2.5;
            opacity = 0.5;
          } else if (edge.type === "prerequisite") {
            strokeColor = color;
            strokeWidth = 1.5;
            opacity = 0.2;
          } else if (edge.type === "builds-on") {
            strokeColor = color;
            strokeWidth = 1.2;
            opacity = 0.15;
          } else {
            strokeColor = color;
            strokeWidth = 1;
            opacity = 0.1;
          }

          if (isRelated && !connectedToSelected) {
            dashArray = "4 4";
          }

          return (
            <motion.path
              key={`${edge.from}-${edge.to}`}
              d={edgePath(from.x, from.y, to.x, to.y)}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              opacity={opacity}
              strokeDasharray={dashArray}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          );
        })}

        {/* Nodes */}
        {layout.map((ln, index) => {
          const { id, node, x, y } = ln;
          const cat = getCategoryById(node.categoryId, data.categories);
          const color = cat?.color ?? "#888888";
          const isSelected = id === selectedNodeId;
          const histItem = historyMap.get(id);
          const maxLevel = histItem?.maxLevel ?? 0;

          const fillOpacity = isSelected ? 0.22 : maxLevel > 0 ? 0.15 : 0.08;
          const strokeOpacity = isSelected ? 0.8 : maxLevel > 0 ? 0.5 : 0.2;
          const labelOpacity = isSelected ? 0.9 : maxLevel > 0 ? 0.7 : 0.4;
          const glowOpacity = isSelected ? 0.15 : maxLevel > 0 ? 0.06 : 0.02;
          const arcRadius = NODE_R + 4;

          return (
            <motion.g
              key={id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: isSelected ? 1.15 : 1 }}
              transition={{
                delay: 0.1 + node.tier * 0.12 + index * 0.02,
                duration: 0.4,
                type: "spring",
                stiffness: 200,
              }}
              style={{ cursor: "pointer", transformOrigin: `${x}px ${y}px` }}
              onClick={() => onSelectNode(node)}
            >
              {/* Glow */}
              <motion.circle
                cx={x}
                cy={y}
                r={NODE_R * 2.2}
                fill={color}
                opacity={glowOpacity}
                filter="url(#ltree-glow)"
                {...(isSelected
                  ? {
                      animate: { opacity: [0.08, 0.2, 0.08] },
                      transition: { duration: 2.5, repeat: Infinity },
                    }
                  : {})}
              />

              {/* Node circle */}
              <circle
                cx={x}
                cy={y}
                r={NODE_R}
                fill={color}
                fillOpacity={fillOpacity}
                stroke={color}
                strokeOpacity={strokeOpacity}
                strokeWidth={isSelected ? 2 : 1.5}
              />

              {/* Level arc segments */}
              {maxLevel > 0 &&
                [0, 1, 2, 3, 4].map((lvl) => {
                  const gap = 3;
                  const segAngle = (360 - gap * 5) / 5;
                  const start = lvl * (segAngle + gap);
                  const end = start + segAngle;
                  const completed = maxLevel > lvl;
                  const segColor = completed ? LEVEL_COLORS[lvl] : "rgba(255,255,255,0.06)";

                  return (
                    <path
                      key={lvl}
                      d={describeArc(x, y, arcRadius, start, end)}
                      fill="none"
                      stroke={segColor}
                      strokeWidth={completed ? 2.5 : 1}
                      strokeLinecap="round"
                    />
                  );
                })}

              {/* Center initial */}
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="11"
                fill={color}
                opacity={maxLevel > 0 ? 0.7 : 0.35}
                style={{ pointerEvents: "none" }}
              >
                {node.name.charAt(0).toUpperCase()}
              </text>

              {/* Label */}
              <text
                x={x}
                y={y + (maxLevel > 0 ? arcRadius + 14 : NODE_R + 14)}
                textAnchor="middle"
                fill="white"
                opacity={labelOpacity}
                fontSize="9.5"
                fontFamily="var(--font-sans), system-ui, sans-serif"
                style={{ pointerEvents: "none" }}
              >
                {truncate(node.name, 18)}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
