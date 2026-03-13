"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { LEVEL_META, slugify } from "@/lib/utils";
import { MATH_CATEGORIES } from "@/lib/math-topics";
import type { TopicHistoryItem } from "@/lib/data";

const VIEW_SIZE = 800;
const CENTER = VIEW_SIZE / 2;
const ORBIT_RADII = [100, 155, 210, 265, 320];

const MATH_SLUGS = new Set(
  MATH_CATEGORIES.flatMap((c) => c.topics.map((t) => slugify(t)))
);

function getMathCategory(slug: string) {
  return MATH_CATEGORIES.find((cat) =>
    cat.topics.some((t) => slugify(t) === slug)
  );
}

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

interface PlanetData {
  topic: TopicHistoryItem;
  isMath: boolean;
  mathColor?: string;
  px: number;
  py: number;
  planetSize: number;
  color: string;
  orbitIndex: number;
}

function computePlanets(topics: TopicHistoryItem[]): PlanetData[] {
  // Group by maxLevel
  const byLevel = new Map<number, TopicHistoryItem[]>();
  for (const t of topics) {
    const lvl = Math.max(t.maxLevel, 1);
    const group = byLevel.get(lvl) || [];
    group.push(t);
    byLevel.set(lvl, group);
  }

  const planets: PlanetData[] = [];

  for (const [level, group] of byLevel) {
    const orbitIndex = level - 1;
    const orbitRadius = ORBIT_RADII[orbitIndex];
    const count = group.length;
    const baseOffset = hashSlug(`orbit-${level}`) % 360;

    group.forEach((topic, i) => {
      const isMath = MATH_SLUGS.has(topic.slug);
      const mathCat = isMath ? getMathCategory(topic.slug) : undefined;

      const evenAngle = (360 / count) * i;
      const jitter = (hashSlug(topic.slug) % 20) - 10;
      const angle = baseOffset + evenAngle + jitter;

      const baseSize = 8 + level * 1.5;
      const planetSize = isMath ? baseSize + 2 : baseSize;

      const color =
        isMath && mathCat
          ? mathCat.color
          : LEVEL_META[Math.min(level - 1, 4)].color;

      const pos = polarToCartesian(CENTER, CENTER, orbitRadius, angle);

      planets.push({
        topic,
        isMath,
        mathColor: mathCat?.color,
        px: pos.x,
        py: pos.y,
        planetSize,
        color,
        orbitIndex,
      });
    });
  }

  return planets;
}

interface SolarSystemProps {
  topics: TopicHistoryItem[];
  userLevel: number;
  userTitle: string;
  totalXP: number;
}

export default function SolarSystem({
  topics,
  userLevel,
  userTitle,
}: SolarSystemProps) {
  const router = useRouter();
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  const planets = useMemo(() => computePlanets(topics), [topics]);

  const stars = useMemo(() => {
    const rng = seededRandom(77);
    return Array.from({ length: 80 }, () => ({
      x: rng() * VIEW_SIZE,
      y: rng() * VIEW_SIZE,
      r: 0.4 + rng() * 1.2,
      opacity: 0.02 + rng() * 0.05,
    }));
  }, []);

  const recentSlugs = useMemo(() => {
    return [...topics]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((t) => t.slug);
  }, [topics]);

  const mostRecent = recentSlugs[0] || null;

  if (topics.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center gap-2 mb-4">
          {LEVEL_META.map((m, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: m.color }}
              animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
        <p className="text-white/30 text-sm font-sans">
          Start exploring topics to populate your solar system
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto -mx-2">
        <svg
          viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
          className="w-full min-w-[400px]"
          style={{ maxHeight: "600px" }}
        >
          <defs>
            <filter id="sun-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="15" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="planet-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="sun-gradient">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
              <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>

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

          {/* Orbit rings */}
          {ORBIT_RADII.map((r, i) => (
            <g key={`orbit-${i}`}>
              <circle
                cx={CENTER}
                cy={CENTER}
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={1}
                strokeDasharray="4 8"
              />
              <text
                x={CENTER + r + 6}
                y={CENTER + 3}
                fill="rgba(255,255,255,0.12)"
                fontSize="8"
                fontFamily="var(--font-sans), system-ui, sans-serif"
              >
                L{i + 1}
              </text>
            </g>
          ))}

          {/* Sun outer glow */}
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={60}
            fill="url(#sun-gradient)"
            filter="url(#sun-glow)"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Sun body */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={38}
            fill="#fbbf24"
            fillOpacity={0.12}
            stroke="#fbbf24"
            strokeOpacity={0.35}
            strokeWidth={2}
          />

          {/* Sun inner core */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={20}
            fill="#fbbf24"
            fillOpacity={0.2}
          />

          {/* Sun level number */}
          <text
            x={CENTER}
            y={CENTER + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fbbf24"
            fontSize="18"
            fontFamily="var(--font-display), serif"
            opacity={0.9}
          >
            {userLevel}
          </text>

          {/* Title below sun */}
          <text
            x={CENTER}
            y={CENTER + 54}
            textAnchor="middle"
            fill="rgba(255,255,255,0.25)"
            fontSize="9"
            fontFamily="var(--font-sans), system-ui, sans-serif"
          >
            {userTitle}
          </text>

          {/* Planets */}
          {planets.map((planet, index) => {
            const { topic, px, py, planetSize, color, isMath } = planet;
            const isHovered = hoveredSlug === topic.slug;
            const isRecent = recentSlugs.includes(topic.slug);
            const isPulsing = topic.slug === mostRecent;
            const glowOpacity = 0.04 + planet.orbitIndex * 0.03;
            const arcRadius = planetSize + 3;
            const bobDuration = 3 + (hashSlug(topic.slug) % 20) / 10;

            return (
              <motion.g
                key={topic.slug}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.3 + index * 0.05,
                  duration: 0.4,
                  type: "spring",
                  stiffness: 200,
                }}
                style={{ cursor: "pointer", transformOrigin: `${px}px ${py}px` }}
                onClick={() =>
                  router.push(`/learn/${topic.slug}${isMath ? "?mode=math" : ""}`)
                }
                onMouseEnter={() => setHoveredSlug(topic.slug)}
                onMouseLeave={() => setHoveredSlug(null)}
              >
                {/* Planet glow */}
                <motion.circle
                  cx={px}
                  cy={py}
                  r={planetSize * 2.2}
                  fill={color}
                  opacity={isHovered ? glowOpacity * 2 : glowOpacity}
                  filter="url(#planet-glow)"
                  {...(isPulsing
                    ? {
                        animate: {
                          opacity: [glowOpacity * 0.6, glowOpacity * 1.6, glowOpacity * 0.6],
                        },
                        transition: { duration: 3, repeat: Infinity },
                      }
                    : {})}
                />

                {/* Floating bob */}
                <motion.g
                  animate={{ y: [0, -2.5, 0] }}
                  transition={{ duration: bobDuration, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* Planet body */}
                  <circle
                    cx={px}
                    cy={py}
                    r={planetSize - 2}
                    fill={color}
                    opacity={0.15 + planet.orbitIndex * 0.04}
                  />

                  {/* Saturn ring for math topics */}
                  {isMath && (
                    <ellipse
                      cx={px}
                      cy={py}
                      rx={planetSize + 5}
                      ry={planetSize * 0.3}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.5}
                      opacity={isHovered ? 0.7 : 0.4}
                      transform={`rotate(-20, ${px}, ${py})`}
                    />
                  )}

                  {/* Arc segments (5 levels) */}
                  {[0, 1, 2, 3, 4].map((lvl) => {
                    const gap = 3;
                    const segAngle = (360 - gap * 5) / 5;
                    const start = lvl * (segAngle + gap);
                    const end = start + segAngle;
                    const completed = topic.maxLevel > lvl;
                    const segColor = completed
                      ? LEVEL_META[lvl].color
                      : "rgba(255,255,255,0.06)";

                    return (
                      <path
                        key={lvl}
                        d={describeArc(px, py, arcRadius, start, end)}
                        fill="none"
                        stroke={segColor}
                        strokeWidth={completed ? 2 : 1}
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Label */}
                  <text
                    x={px}
                    y={py + arcRadius + 13}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.5)"
                    fontSize="9"
                    fontFamily="var(--font-sans), system-ui, sans-serif"
                    opacity={isHovered || isRecent ? 1 : 0}
                    style={{ transition: "opacity 0.2s" }}
                  >
                    {truncate(topic.topicName, 16)}
                  </text>
                </motion.g>
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-[10px] text-white/25 font-sans">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-400/30 border border-emerald-400/50" />
          <span>Regular topic</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative w-5 h-3 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-indigo-400/30 border border-indigo-400/50" />
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-indigo-400/40 rounded-full" />
          </div>
          <span>Math topic</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Inner orbit = L1</span>
          <span className="mx-0.5 text-white/15">&middot;&middot;&middot;</span>
          <span>Outer orbit = L5</span>
        </div>
      </div>
    </div>
  );
}
