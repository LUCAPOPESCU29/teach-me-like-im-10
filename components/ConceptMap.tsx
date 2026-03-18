"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { LEVEL_META } from "@/lib/utils";
import type { TopicHistoryItem } from "@/lib/data";

const VIEW_W = 900;
const VIEW_H = 600;
const NODE_R = 24;
const MIN_DIST = 90;

function hashSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// Simple keyword extraction for finding connections
function getKeywords(name: string): string[] {
  const stops = new Set([
    "the", "a", "an", "of", "in", "to", "and", "or", "for", "is",
    "how", "what", "why", "when", "where", "with", "from",
  ]);
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stops.has(w));
}

// Compute similarity between two topics
function similarity(a: string, b: string): number {
  const kwA = getKeywords(a);
  const kwB = getKeywords(b);
  if (kwA.length === 0 || kwB.length === 0) return 0;

  let shared = 0;
  for (const w of kwA) {
    for (const w2 of kwB) {
      if (w === w2) shared += 1;
      else if (w.length > 4 && w2.length > 4 && (w.includes(w2) || w2.includes(w)))
        shared += 0.5;
    }
  }
  return shared / Math.max(kwA.length, kwB.length);
}

interface NodeData {
  topic: TopicHistoryItem;
  x: number;
  y: number;
  r: number;
}

interface EdgeData {
  from: number;
  to: number;
  strength: number;
}

function computeLayout(
  topics: TopicHistoryItem[]
): { nodes: NodeData[]; edges: EdgeData[] } {
  const nodes: NodeData[] = [];

  // Position nodes with hash-seeded random
  for (const topic of topics) {
    const h = hashSlug(topic.slug);
    const rng = seededRandom(h);
    const r = NODE_R + (topic.maxLevel || 1) * 2;
    let x = 0.1 * VIEW_W + rng() * 0.8 * VIEW_W;
    let y = 0.1 * VIEW_H + rng() * 0.8 * VIEW_H;
    nodes.push({ topic, x, y, r });
  }

  // Collision separation (6 passes)
  for (let pass = 0; pass < 6; pass++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < MIN_DIST) {
          const push = (MIN_DIST - dist) / 2;
          const nx = (dx / dist) * push;
          const ny = (dy / dist) * push;
          nodes[i].x -= nx;
          nodes[i].y -= ny;
          nodes[j].x += nx;
          nodes[j].y += ny;
        }
      }
    }
    // Clamp to bounds
    for (const n of nodes) {
      n.x = Math.max(n.r + 10, Math.min(VIEW_W - n.r - 10, n.x));
      n.y = Math.max(n.r + 10, Math.min(VIEW_H - n.r - 10, n.y));
    }
  }

  // Compute edges from similarity
  const edges: EdgeData[] = [];
  for (let i = 0; i < topics.length; i++) {
    for (let j = i + 1; j < topics.length; j++) {
      const s = similarity(topics[i].topicName, topics[j].topicName);
      if (s > 0.15) {
        edges.push({ from: i, to: j, strength: Math.min(s, 1) });
      }
    }
  }

  // Also connect by proximity (nearby = related cluster)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (
        dist < 180 &&
        !edges.some(
          (e) =>
            (e.from === i && e.to === j) || (e.from === j && e.to === i)
        )
      ) {
        // Weak proximity edge
        edges.push({ from: i, to: j, strength: 0.1 });
      }
    }
  }

  return { nodes, edges };
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? "1" : "0";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export default function ConceptMap({
  topics,
}: {
  topics: TopicHistoryItem[];
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState<number | null>(null);
  const { nodes, edges } = useMemo(() => computeLayout(topics), [topics]);

  if (topics.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-white/20 text-sm font-sans">
          Explore some topics to build your concept map
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full max-w-[900px] mx-auto"
        style={{ minWidth: 500 }}
      >
        {/* Edges */}
        {edges.map((edge, i) => {
          const a = nodes[edge.from];
          const b = nodes[edge.to];
          const isHighlighted =
            hovered === edge.from || hovered === edge.to;
          return (
            <motion.line
              key={`edge-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={
                isHighlighted
                  ? "rgba(52,211,153,0.4)"
                  : "rgba(255,255,255,0.06)"
              }
              strokeWidth={isHighlighted ? 2 : 1}
              strokeDasharray={edge.strength < 0.15 ? "4 4" : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const lvl = node.topic.maxLevel || 0;
          const color = lvl > 0 ? LEVEL_META[Math.min(lvl - 1, 4)].color : "#4ade80";
          const isHovered = hovered === i;
          const segmentAngle = 360 / 5;
          const gap = 4;

          return (
            <g
              key={node.topic.slug}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => router.push(`/learn/${node.topic.slug}`)}
              className="cursor-pointer"
            >
              {/* Outer ring segments */}
              {[1, 2, 3, 4, 5].map((seg) => {
                const startA = (seg - 1) * segmentAngle + gap;
                const endA = seg * segmentAngle - gap;
                const filled = seg <= lvl;
                return (
                  <motion.path
                    key={seg}
                    d={describeArc(node.x, node.y, node.r + 4, startA, endA)}
                    fill="none"
                    stroke={
                      filled
                        ? LEVEL_META[seg - 1].color
                        : "rgba(255,255,255,0.06)"
                    }
                    strokeWidth={3}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 + seg * 0.05 }}
                  />
                );
              })}

              {/* Center circle */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill={isHovered ? `${color}30` : `${color}10`}
                stroke={isHovered ? `${color}80` : `${color}25`}
                strokeWidth={1.5}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: i * 0.05,
                }}
              />

              {/* Level number */}
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill={color}
                fontSize="14"
                fontWeight="600"
                fontFamily="monospace"
                className="pointer-events-none select-none"
              >
                {lvl || "?"}
              </text>

              {/* Label */}
              <text
                x={node.x}
                y={node.y + node.r + 16}
                textAnchor="middle"
                fill={isHovered ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)"}
                fontSize="11"
                fontFamily="Inter, sans-serif"
                className="pointer-events-none select-none"
              >
                {node.topic.topicName.length > 18
                  ? node.topic.topicName.slice(0, 17) + "\u2026"
                  : node.topic.topicName}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
