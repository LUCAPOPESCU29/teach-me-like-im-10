"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { LEVEL_META } from "@/lib/utils";
import type { TopicHistoryItem } from "@/lib/data";

const VIEW_W = 800;
const VIEW_H = 500;
const MIN_DIST = 70;

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

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "\u2026" : str;
}

interface NodeData {
  topic: TopicHistoryItem;
  x: number;
  y: number;
  radius: number;
}

function computePositions(topics: TopicHistoryItem[]): NodeData[] {
  const nodes: NodeData[] = [];

  for (const topic of topics) {
    const h = hashSlug(topic.slug);
    let x = 0.10 + ((h & 0xffff) / 0xffff) * 0.80;
    let y = 0.10 + (((h >>> 16) & 0xffff) / 0xffff) * 0.80;
    const radius = topic.maxLevel > 0 ? 18 + topic.maxLevel * 3 : 16;

    // Convert to pixel space
    let px = x * VIEW_W;
    let py = y * VIEW_H;

    // Push apart from existing nodes
    for (let pass = 0; pass < 5; pass++) {
      for (const other of nodes) {
        const dx = px - other.x;
        const dy = py - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minRequired = radius + other.radius + 20;
        if (dist < minRequired && dist > 0) {
          const push = (minRequired - dist) / 2 + 1;
          const angle = Math.atan2(dy, dx);
          px += Math.cos(angle) * push;
          py += Math.sin(angle) * push;
        }
      }
    }

    // Clamp to viewBox with padding
    px = Math.max(radius + 20, Math.min(VIEW_W - radius - 20, px));
    py = Math.max(radius + 15, Math.min(VIEW_H - radius - 25, py));

    nodes.push({ topic, x: px, y: py, radius });
  }

  return nodes;
}

export default function TopicConstellation({
  topics,
}: {
  topics: TopicHistoryItem[];
}) {
  const router = useRouter();

  const nodes = useMemo(() => computePositions(topics), [topics]);

  // Generate background stars with a fixed seed
  const stars = useMemo(() => {
    const rng = seededRandom(42);
    return Array.from({ length: 60 }, () => ({
      x: rng() * VIEW_W,
      y: rng() * VIEW_H,
      r: 0.5 + rng() * 1.5,
      opacity: 0.03 + rng() * 0.06,
    }));
  }, []);

  // Find most recent topic for pulse effect
  const mostRecent = useMemo(() => {
    if (topics.length === 0) return null;
    return [...topics].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0].slug;
  }, [topics]);

  if (topics.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center gap-2 mb-4">
          {LEVEL_META.map((m, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: m.color }}
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
        <p className="text-white/30 text-sm font-sans">
          Start exploring topics to build your constellation
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-2">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full min-w-[500px]"
        style={{ maxHeight: "420px" }}
      >
        {/* Background stars */}
        {stars.map((star, i) => (
          <circle
            key={`star-${i}`}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill="white"
            opacity={star.opacity}
          />
        ))}

        {/* Topic nodes */}
        {nodes.map((node, index) => {
          const { topic, x, y, radius } = node;
          const color =
            topic.maxLevel > 0
              ? LEVEL_META[Math.min(topic.maxLevel - 1, 4)].color
              : "#ffffff";
          const glowOpacity =
            topic.maxLevel > 0 ? 0.05 + topic.maxLevel * 0.04 : 0.02;
          const isPulsing = topic.slug === mostRecent;
          const arcRadius = radius + 4;

          return (
            <motion.g
              key={topic.slug}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: index * 0.06,
                duration: 0.4,
                type: "spring",
                stiffness: 200,
              }}
              style={{ cursor: "pointer", transformOrigin: `${x}px ${y}px` }}
              onClick={() => router.push(`/learn/${topic.slug}`)}
            >
              {/* Glow */}
              <motion.circle
                cx={x}
                cy={y}
                r={radius * 2}
                fill={color}
                opacity={glowOpacity}
                filter="url(#glow)"
                {...(isPulsing
                  ? {
                      animate: {
                        opacity: [
                          glowOpacity * 0.6,
                          glowOpacity * 1.4,
                          glowOpacity * 0.6,
                        ],
                      },
                      transition: { duration: 3, repeat: Infinity },
                    }
                  : {})}
              />

              {/* Center fill */}
              <circle
                cx={x}
                cy={y}
                r={radius - 4}
                fill={color}
                opacity={topic.maxLevel > 0 ? 0.12 + topic.maxLevel * 0.03 : 0.04}
              />

              {/* Arc segments (5 levels) */}
              {[0, 1, 2, 3, 4].map((lvl) => {
                const gap = 3;
                const segAngle = (360 - gap * 5) / 5;
                const start = lvl * (segAngle + gap);
                const end = start + segAngle;
                const completed = topic.maxLevel > lvl;
                const segColor = completed
                  ? LEVEL_META[lvl].color
                  : "rgba(255,255,255,0.08)";

                return (
                  <path
                    key={lvl}
                    d={describeArc(x, y, arcRadius, start, end)}
                    fill="none"
                    stroke={segColor}
                    strokeWidth={completed ? 2.5 : 1.5}
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Label */}
              <text
                x={x}
                y={y + arcRadius + 14}
                textAnchor="middle"
                fill="rgba(255,255,255,0.5)"
                fontSize="10"
                fontFamily="var(--font-sans), system-ui, sans-serif"
              >
                {truncate(topic.topicName, 18)}
              </text>
            </motion.g>
          );
        })}

        {/* SVG filter for glow */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
}
