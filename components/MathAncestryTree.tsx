"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  type MathTreeNode,
  type MathTreeEdge,
  computeTreeLayout,
  edgePath,
  getCategoryColor,
  TREE_W,
  TREE_H,
} from "@/lib/math-tree";

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

interface Props {
  nodes: MathTreeNode[];
  edges: MathTreeEdge[];
  completedSlugs: Set<string>;
  selectedNodeId: string | null;
  onSelectNode: (node: MathTreeNode) => void;
}

export default function MathAncestryTree({
  nodes,
  edges,
  completedSlugs,
  selectedNodeId,
  onSelectNode,
}: Props) {
  const layout = useMemo(() => computeTreeLayout(nodes), [nodes]);
  const posMap = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const ln of layout) m.set(ln.id, { x: ln.x, y: ln.y });
    return m;
  }, [layout]);

  const stars = useMemo(() => {
    const rng = seededRandom(77);
    return Array.from({ length: 80 }, () => ({
      x: rng() * TREE_W,
      y: rng() * TREE_H,
      r: 0.4 + rng() * 1.2,
      opacity: 0.02 + rng() * 0.05,
    }));
  }, []);

  const tierLabels = ["Foundations", "Building Blocks", "Core Skills", "Intermediate", "Advanced", "Calculus"];

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <svg
        viewBox={`0 0 ${TREE_W} ${TREE_H}`}
        className="w-full min-w-[900px]"
        style={{ maxHeight: "600px" }}
      >
        <defs>
          <filter id="tree-glow" x="-50%" y="-50%" width="200%" height="200%">
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
        {tierLabels.map((label, i) => {
          const x = 130 + i * ((TREE_W - 260) / 5);
          return (
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
          );
        })}

        {/* Edges */}
        {edges.map((edge) => {
          const from = posMap.get(edge.from);
          const to = posMap.get(edge.to);
          if (!from || !to) return null;

          const bothDone = completedSlugs.has(edge.from) && completedSlugs.has(edge.to);
          const sourceDone = completedSlugs.has(edge.from);
          const connectedToSelected = edge.from === selectedNodeId || edge.to === selectedNodeId;
          const toNode = nodes.find((n) => n.id === edge.to);
          const color = toNode ? getCategoryColor(toNode.categoryId) : "#ffffff";

          let strokeColor = "rgba(255,255,255,0.04)";
          let strokeWidth = 1;
          let opacity = 1;

          if (connectedToSelected) {
            strokeColor = color;
            strokeWidth = 2.5;
            opacity = 0.5;
          } else if (bothDone) {
            strokeColor = color;
            strokeWidth = 2;
            opacity = 0.3;
          } else if (sourceDone) {
            strokeColor = color;
            strokeWidth = 1.5;
            opacity = 0.12;
          }

          return (
            <motion.path
              key={`${edge.from}-${edge.to}`}
              d={edgePath(from.x, from.y, to.x, to.y)}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              opacity={opacity}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          );
        })}

        {/* Nodes */}
        {layout.map((ln, index) => {
          const { id, node, x, y } = ln;
          const color = getCategoryColor(node.categoryId);
          const isCompleted = completedSlugs.has(id);
          const isSelected = id === selectedNodeId;

          const fillOpacity = isSelected ? 0.22 : isCompleted ? 0.18 : 0.08;
          const strokeOpacity = isSelected ? 0.8 : isCompleted ? 0.55 : 0.2;
          const labelOpacity = isSelected ? 0.9 : isCompleted ? 0.75 : 0.4;
          const glowOpacity = isSelected ? 0.15 : isCompleted ? 0.08 : 0.02;

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
                filter="url(#tree-glow)"
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

              {/* Category symbol */}
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="12"
                fill={color}
                opacity={isCompleted ? 0.8 : 0.4}
                style={{ pointerEvents: "none" }}
              >
                {node.categoryId === "numbers"
                  ? "#"
                  : node.categoryId === "algebra"
                    ? "x"
                    : node.categoryId === "geometry"
                      ? "\u25B3"
                      : node.categoryId === "statistics"
                        ? "\u2684"
                        : node.categoryId === "calculus"
                          ? "\u222B"
                          : "\u2605"}
              </text>

              {/* Label */}
              <text
                x={x}
                y={y + NODE_R + 14}
                textAnchor="middle"
                fill="white"
                opacity={labelOpacity}
                fontSize="9.5"
                fontFamily="var(--font-sans), system-ui, sans-serif"
                style={{ pointerEvents: "none" }}
              >
                {truncate(node.name, 18)}
              </text>

              {/* Completed checkmark */}
              {isCompleted && (
                <g transform={`translate(${x + NODE_R - 4}, ${y - NODE_R + 2})`}>
                  <circle r="6" fill="#22c55e" opacity="0.9" />
                  <path
                    d="M-2.5 0 L-0.5 2 L3 -1.5"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              )}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
