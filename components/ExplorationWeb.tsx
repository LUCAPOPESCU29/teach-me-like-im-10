"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

export interface ExploreNode {
  slug: string;
  name: string;
  depth: number;
  parentSlug: string | null;
}

interface ExplorationWebProps {
  nodes: ExploreNode[];
  currentSlug: string | null;
}

const DEPTH_COLORS = [
  "#4ade80", // green
  "#fbbf24", // yellow
  "#f97316", // orange
  "#f43f5e", // rose
  "#a855f7", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#10b981", // emerald
];

interface LayoutNode {
  slug: string;
  name: string;
  depth: number;
  x: number;
  y: number;
  color: string;
}

interface LayoutEdge {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export default function ExplorationWeb({
  nodes,
  currentSlug,
}: ExplorationWebProps) {
  const { layoutNodes, edges, viewBox } = useMemo(() => {
    if (nodes.length === 0)
      return { layoutNodes: [], edges: [], viewBox: "0 0 600 400" };

    const WIDTH = 600;
    const LEVEL_HEIGHT = 100;
    const NODE_RADIUS = 24;

    // Group nodes by depth
    const byDepth: Map<number, ExploreNode[]> = new Map();
    for (const node of nodes) {
      const list = byDepth.get(node.depth) || [];
      list.push(node);
      byDepth.set(node.depth, list);
    }

    const maxDepth = Math.max(...nodes.map((n) => n.depth));
    const totalHeight = Math.max((maxDepth + 1) * LEVEL_HEIGHT + 60, 200);

    // Position nodes
    const posMap = new Map<string, { x: number; y: number }>();
    const laid: LayoutNode[] = [];

    for (let d = 0; d <= maxDepth; d++) {
      const group = byDepth.get(d) || [];
      const count = group.length;
      const spacing = WIDTH / (count + 1);

      group.forEach((node, i) => {
        const x = spacing * (i + 1);
        const y = d * LEVEL_HEIGHT + 50;
        posMap.set(node.slug, { x, y });
        laid.push({
          slug: node.slug,
          name: node.name,
          depth: node.depth,
          x,
          y,
          color: DEPTH_COLORS[d % DEPTH_COLORS.length],
        });
      });
    }

    // Build edges
    const edgeList: LayoutEdge[] = [];
    for (const node of nodes) {
      if (node.parentSlug) {
        const from = posMap.get(node.parentSlug);
        const to = posMap.get(node.slug);
        if (from && to) {
          edgeList.push({ from, to });
        }
      }
    }

    return {
      layoutNodes: laid,
      edges: edgeList,
      viewBox: `0 0 ${WIDTH} ${totalHeight}`,
    };
  }, [nodes]);

  if (nodes.length === 0) {
    return (
      <div className="text-center text-white/20 font-sans text-sm py-8">
        Start exploring to build your knowledge web
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={viewBox}
        className="w-full min-w-[400px] max-h-[500px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Edges */}
        {edges.map((edge, i) => (
          <motion.line
            key={`edge-${i}`}
            x1={edge.from.x}
            y1={edge.from.y}
            x2={edge.to.x}
            y2={edge.to.y}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={2}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          />
        ))}

        {/* Nodes */}
        {layoutNodes.map((node, i) => {
          const isCurrent = node.slug === currentSlug;
          const radius = isCurrent ? 28 : 22;

          return (
            <motion.g
              key={node.slug}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              {/* Glow for current */}
              {isCurrent && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius + 8}
                  fill="none"
                  stroke={node.color}
                  strokeWidth={2}
                  opacity={0.3}
                />
              )}

              {/* Node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={radius}
                fill={isCurrent ? node.color : `${node.color}33`}
                stroke={node.color}
                strokeWidth={isCurrent ? 3 : 2}
              />

              {/* Label */}
              <text
                x={node.x}
                y={node.y + radius + 16}
                textAnchor="middle"
                fill="rgba(255,255,255,0.6)"
                fontSize="11"
                fontFamily="sans-serif"
              >
                {node.name.length > 18
                  ? node.name.slice(0, 16) + "..."
                  : node.name}
              </text>

              {/* Depth number inside circle */}
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fill={isCurrent ? "#000" : "rgba(255,255,255,0.7)"}
                fontSize="12"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                {node.depth + 1}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
