"use client";

import { useRef, useMemo, useCallback, type ReactElement } from "react";
import type { TopicHistoryItem } from "@/lib/data";

// ---- Category detection from topic slug/name ----
const CATEGORY_MAP: Record<string, { label: string; color: string; hue: number }> = {
  science: { label: "Science", color: "#4ade80", hue: 142 },
  math: { label: "Math", color: "#38bdf8", hue: 199 },
  history: { label: "History", color: "#fbbf24", hue: 43 },
  art: { label: "Art", color: "#f472b6", hue: 330 },
  tech: { label: "Technology", color: "#a78bfa", hue: 263 },
  language: { label: "Language", color: "#fb923c", hue: 25 },
  nature: { label: "Nature", color: "#34d399", hue: 160 },
  philosophy: { label: "Philosophy", color: "#e879f9", hue: 292 },
  other: { label: "Other", color: "#94a3b8", hue: 215 },
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  science: ["physics", "chemistry", "biology", "atom", "quantum", "cell", "dna", "molecule", "gravity", "energy", "space", "planet", "star", "galaxy", "evolution", "gene", "electron", "relativity", "thermodynamic", "optic"],
  math: ["math", "algebra", "geometry", "calculus", "number", "equation", "fraction", "probability", "statistic", "trigonometry", "pi", "theorem", "logarithm", "derivative", "integral"],
  history: ["history", "war", "empire", "ancient", "medieval", "revolution", "dynasty", "civilization", "roman", "greek", "egypt", "renaissance", "colonial", "independence"],
  art: ["art", "music", "paint", "sculpt", "dance", "film", "cinema", "photograph", "design", "color", "composition", "symphony", "opera"],
  tech: ["computer", "programming", "software", "code", "algorithm", "internet", "web", "ai", "machine-learning", "data", "robot", "crypto", "blockchain", "neural", "javascript", "python"],
  language: ["language", "grammar", "writing", "literature", "poetry", "novel", "english", "spanish", "french", "latin", "word", "vocabulary", "linguistics"],
  nature: ["nature", "animal", "plant", "ocean", "forest", "climate", "weather", "ecosystem", "volcano", "earthquake", "mountain", "river", "wildlife"],
  philosophy: ["philosophy", "ethics", "logic", "mind", "consciousness", "existential", "morality", "metaphysic", "epistemology", "socrates", "plato", "aristotle"],
};

function categorize(slug: string): string {
  const lower = slug.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "other";
}

// ---- Learning style detection ----
export type LearningStyle = "Explorer" | "Deep Diver" | "Speedster" | "Consistent";

export interface LearningDNAData {
  topics: TopicHistoryItem[];
  totalXP: number;
  streak: number;
  topicsExplored: number;
  maxLevelReached: number;
  topicsPerWeek: number;
  categoryBreakdown: Record<string, number>;
  avgDepth: number;
  learningStyle: LearningStyle;
  dominantCategory: string;
}

export function computeDNAData(
  topics: TopicHistoryItem[],
  totalXP: number,
  streak: number,
): LearningDNAData {
  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  for (const t of topics) {
    const cat = categorize(t.slug);
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
  }

  // Average depth
  const avgDepth =
    topics.length > 0
      ? topics.reduce((sum, t) => sum + t.maxLevel, 0) / topics.length
      : 0;

  // Topics per week (approximate: look at date range of topics)
  let topicsPerWeek = 0;
  if (topics.length > 1) {
    const dates = topics.map((t) => new Date(t.updatedAt).getTime()).sort();
    const spanMs = dates[dates.length - 1] - dates[0];
    const spanWeeks = Math.max(spanMs / (7 * 24 * 60 * 60 * 1000), 1);
    topicsPerWeek = topics.length / spanWeeks;
  } else {
    topicsPerWeek = topics.length;
  }

  const maxLevelReached = Math.max(...topics.map((t) => t.maxLevel), 0);

  // Dominant category
  const dominantCategory =
    Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || "other";

  // Learning style
  let learningStyle: LearningStyle = "Explorer";
  if (avgDepth >= 3.5 && topics.length <= 5) {
    learningStyle = "Deep Diver";
  } else if (topicsPerWeek >= 4) {
    learningStyle = "Speedster";
  } else if (streak >= 7) {
    learningStyle = "Consistent";
  } else {
    learningStyle = "Explorer";
  }

  return {
    topics,
    totalXP,
    streak,
    topicsExplored: topics.length,
    maxLevelReached,
    topicsPerWeek: Math.round(topicsPerWeek * 10) / 10,
    categoryBreakdown,
    avgDepth: Math.round(avgDepth * 10) / 10,
    learningStyle,
    dominantCategory,
  };
}

// ---- Style descriptions ----
const STYLE_INFO: Record<LearningStyle, { tagline: string; icon: string }> = {
  Explorer: { tagline: "You love discovering new territories of knowledge", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
  "Deep Diver": { tagline: "You go deep — mastering topics from top to bottom", icon: "M12 2v20M12 22l-4-4M12 22l4-4M8 6l4-4 4 4" },
  Speedster: { tagline: "You blaze through topics at lightning speed", icon: "M13 2L3 14h9l-1 10 10-12h-9l1-10z" },
  Consistent: { tagline: "You show up every day — discipline is your superpower", icon: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" },
};

// ---- SVG Visualization ----

interface LearningDNAProps {
  dnaData: LearningDNAData;
  displayName: string;
  size?: number;
  showLabel?: boolean;
}

// Deterministic pseudo-random from seed
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function LearningDNA({ dnaData, displayName, size = 400, showLabel = true }: LearningDNAProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const visualization = useMemo(() => {
    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.42;
    const categories = Object.entries(dnaData.categoryBreakdown);
    const totalTopics = Math.max(dnaData.topicsExplored, 1);

    // Seed for deterministic randomness based on user data
    const seed = dnaData.totalXP * 7 + dnaData.topicsExplored * 13 + dnaData.streak * 31 + Math.round(dnaData.avgDepth * 100);
    const rand = seededRandom(seed);

    // --- Build the layers ---
    const elements: ReactElement[] = [];

    // 1. Background glow rings based on XP level
    const glowCount = Math.min(Math.floor(dnaData.totalXP / 200) + 2, 6);
    const domCat = CATEGORY_MAP[dnaData.dominantCategory] || CATEGORY_MAP.other;
    for (let i = 0; i < glowCount; i++) {
      const r = maxR * (0.3 + (i / glowCount) * 0.7);
      elements.push(
        <circle
          key={`glow-${i}`}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={domCat.color}
          strokeWidth={0.5}
          opacity={0.08 + (i / glowCount) * 0.06}
        />
      );
    }

    // 2. Radial petals — one per category, size = proportion of topics
    if (categories.length > 0) {
      const angleStep = (Math.PI * 2) / Math.max(categories.length, 1);
      categories.forEach(([cat, count], i) => {
        const catInfo = CATEGORY_MAP[cat] || CATEGORY_MAP.other;
        const proportion = count / totalTopics;
        const petalR = maxR * (0.3 + proportion * 0.7);
        const angle = angleStep * i - Math.PI / 2;
        const spread = angleStep * 0.35;

        // Each petal is a quadratic bezier "leaf" shape
        const tipX = cx + Math.cos(angle) * petalR;
        const tipY = cy + Math.sin(angle) * petalR;

        const leftAngle = angle - spread;
        const rightAngle = angle + spread;
        const baseR = maxR * 0.12;
        const leftX = cx + Math.cos(leftAngle) * baseR;
        const leftY = cy + Math.sin(leftAngle) * baseR;
        const rightX = cx + Math.cos(rightAngle) * baseR;
        const rightY = cy + Math.sin(rightAngle) * baseR;

        // Control points for the curves
        const ctrlR = petalR * 0.65;
        const ctrl1X = cx + Math.cos(angle - spread * 0.5) * ctrlR;
        const ctrl1Y = cy + Math.sin(angle - spread * 0.5) * ctrlR;
        const ctrl2X = cx + Math.cos(angle + spread * 0.5) * ctrlR;
        const ctrl2Y = cy + Math.sin(angle + spread * 0.5) * ctrlR;

        const d = `M ${leftX} ${leftY} Q ${ctrl1X} ${ctrl1Y} ${tipX} ${tipY} Q ${ctrl2X} ${ctrl2Y} ${rightX} ${rightY} Z`;

        elements.push(
          <path
            key={`petal-${cat}`}
            d={d}
            fill={catInfo.color}
            fillOpacity={0.12 + proportion * 0.15}
            stroke={catInfo.color}
            strokeWidth={1}
            strokeOpacity={0.4}
          />
        );

        // Depth indicator: small circles along the petal axis
        const depthTopics = dnaData.topics.filter((t) => categorize(t.slug) === cat);
        const avgCatDepth =
          depthTopics.length > 0
            ? depthTopics.reduce((s, t) => s + t.maxLevel, 0) / depthTopics.length
            : 0;

        const dotCount = Math.round(avgCatDepth);
        for (let d = 0; d < dotCount; d++) {
          const frac = 0.25 + (d / Math.max(dotCount, 1)) * 0.65;
          const dotX = cx + Math.cos(angle) * petalR * frac;
          const dotY = cy + Math.sin(angle) * petalR * frac;
          elements.push(
            <circle
              key={`dot-${cat}-${d}`}
              cx={dotX}
              cy={dotY}
              r={2.5 + d * 0.5}
              fill={catInfo.color}
              opacity={0.5 + d * 0.1}
            />
          );
        }
      });
    }

    // 3. Streak ring — concentric dashes, one per streak day (max 30)
    const streakDashes = Math.min(dnaData.streak, 30);
    if (streakDashes > 0) {
      const streakR = maxR * 0.22;
      const dashAngle = (Math.PI * 2) / Math.max(streakDashes, 1);
      for (let i = 0; i < streakDashes; i++) {
        const a = dashAngle * i - Math.PI / 2;
        const x1 = cx + Math.cos(a) * (streakR - 4);
        const y1 = cy + Math.sin(a) * (streakR - 4);
        const x2 = cx + Math.cos(a) * (streakR + 4);
        const y2 = cy + Math.sin(a) * (streakR + 4);
        elements.push(
          <line
            key={`streak-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#4ade80"
            strokeWidth={1.5}
            opacity={0.3 + (i / streakDashes) * 0.4}
            strokeLinecap="round"
          />
        );
      }
    }

    // 4. XP helix — twin sine waves wrapping around the center, representing total XP
    const helixSegments = Math.min(Math.floor(dnaData.totalXP / 50) + 4, 40);
    const helixR = maxR * 0.55;
    const helixAmplitude = maxR * 0.08;
    for (let strand = 0; strand < 2; strand++) {
      const points: string[] = [];
      for (let i = 0; i <= helixSegments; i++) {
        const t = i / helixSegments;
        const angle = t * Math.PI * 4 + strand * Math.PI;
        const r = helixR + Math.sin(angle) * helixAmplitude;
        const baseAngle = t * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(baseAngle) * r;
        const y = cy + Math.sin(baseAngle) * r;
        points.push(`${x},${y}`);
      }
      elements.push(
        <polyline
          key={`helix-${strand}`}
          points={points.join(" ")}
          fill="none"
          stroke={domCat.color}
          strokeWidth={1.2}
          opacity={0.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    // 5. "Rungs" connecting the two helix strands — one per topic
    const rungCount = Math.min(dnaData.topicsExplored, 20);
    for (let i = 0; i < rungCount; i++) {
      const t = (i + 0.5) / Math.max(rungCount, 1);
      const baseAngle = t * Math.PI * 2 - Math.PI / 2;
      const angle1 = t * Math.PI * 4;
      const angle2 = t * Math.PI * 4 + Math.PI;
      const r1 = helixR + Math.sin(angle1) * helixAmplitude;
      const r2 = helixR + Math.sin(angle2) * helixAmplitude;
      const x1 = cx + Math.cos(baseAngle) * r1;
      const y1 = cy + Math.sin(baseAngle) * r1;
      const x2 = cx + Math.cos(baseAngle) * r2;
      const y2 = cy + Math.sin(baseAngle) * r2;

      const topic = dnaData.topics[i % dnaData.topics.length];
      const topicCat = categorize(topic?.slug || "");
      const catInfo = CATEGORY_MAP[topicCat] || CATEGORY_MAP.other;

      elements.push(
        <line
          key={`rung-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={catInfo.color}
          strokeWidth={2}
          opacity={0.35}
          strokeLinecap="round"
        />
      );
    }

    // 6. Scattered particles for visual richness
    const particleCount = Math.min(dnaData.totalXP / 30 + 5, 50);
    for (let i = 0; i < particleCount; i++) {
      const angle = rand() * Math.PI * 2;
      const r = maxR * (0.15 + rand() * 0.8);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const catKeys = Object.keys(dnaData.categoryBreakdown);
      const pCat = catKeys[Math.floor(rand() * catKeys.length)] || "other";
      const pColor = CATEGORY_MAP[pCat]?.color || "#94a3b8";
      elements.push(
        <circle
          key={`particle-${i}`}
          cx={x}
          cy={y}
          r={1 + rand() * 2}
          fill={pColor}
          opacity={0.15 + rand() * 0.2}
        />
      );
    }

    // 7. Center emblem — learning style icon
    elements.push(
      <circle
        key="center-bg"
        cx={cx}
        cy={cy}
        r={maxR * 0.1}
        fill={domCat.color}
        fillOpacity={0.1}
        stroke={domCat.color}
        strokeWidth={1}
        strokeOpacity={0.3}
      />
    );

    return elements;
  }, [dnaData, size]);

  const downloadPNG = useCallback(async () => {
    const svg = svgRef.current;
    if (!svg) return;

    // Create a larger canvas for the shareable image
    const exportWidth = 800;
    const exportHeight = 1000;
    const canvas = document.createElement("canvas");
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = "#070b14";
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    // Serialize SVG and draw it
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      // Draw SVG centered
      const svgSize = 600;
      const svgX = (exportWidth - svgSize) / 2;
      const svgY = 40;
      ctx.drawImage(img, svgX, svgY, svgSize, svgSize);
      URL.revokeObjectURL(url);

      // Draw text info below
      ctx.textAlign = "center";

      // Name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px 'Instrument Serif', serif";
      ctx.fillText(displayName || "Learner", exportWidth / 2, svgY + svgSize + 50);

      // Learning style
      const domCat = CATEGORY_MAP[dnaData.dominantCategory] || CATEGORY_MAP.other;
      ctx.fillStyle = domCat.color;
      ctx.font = "600 20px 'Inter', sans-serif";
      ctx.fillText(dnaData.learningStyle, exportWidth / 2, svgY + svgSize + 85);

      // Stats line
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "14px 'Inter', monospace";
      ctx.fillText(
        `${dnaData.totalXP} XP  |  ${dnaData.topicsExplored} topics  |  ${dnaData.streak} day streak`,
        exportWidth / 2,
        svgY + svgSize + 115
      );

      // Branding
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "12px 'Inter', sans-serif";
      ctx.fillText("Teach Me Like I'm 10 — Learning DNA", exportWidth / 2, exportHeight - 30);

      // Trigger download
      const link = document.createElement("a");
      link.download = `learning-dna-${(displayName || "learner").toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  }, [dnaData, displayName]);

  const domCat = CATEGORY_MAP[dnaData.dominantCategory] || CATEGORY_MAP.other;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* The SVG visualization */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: `radial-gradient(circle at center, ${domCat.color}08 0%, transparent 70%)`,
        }}
      >
        <svg
          ref={svgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          xmlns="http://www.w3.org/2000/svg"
          className="block"
        >
          <defs>
            <radialGradient id="dna-bg-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={domCat.color} stopOpacity={0.04} />
              <stop offset="100%" stopColor="transparent" stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect width={size} height={size} fill="url(#dna-bg-grad)" />
          {visualization}
        </svg>
      </div>

      {/* Style badge */}
      {showLabel && (
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white/[0.03]" style={{ borderColor: `${domCat.color}30` }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={domCat.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={STYLE_INFO[dnaData.learningStyle].icon} />
            </svg>
            <span className="font-sans text-sm font-semibold" style={{ color: domCat.color }}>
              {dnaData.learningStyle}
            </span>
          </div>
          <p className="text-white/30 text-sm font-sans max-w-xs mx-auto">
            {STYLE_INFO[dnaData.learningStyle].tagline}
          </p>
        </div>
      )}

      {/* Category legend */}
      {Object.keys(dnaData.categoryBreakdown).length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {Object.entries(dnaData.categoryBreakdown)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => {
              const catInfo = CATEGORY_MAP[cat] || CATEGORY_MAP.other;
              return (
                <div key={cat} className="flex items-center gap-1.5 text-xs font-sans text-white/40">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: catInfo.color }} />
                  {catInfo.label}
                  <span className="font-mono text-white/20">{count}</span>
                </div>
              );
            })}
        </div>
      )}

      {/* Download button */}
      <button
        onClick={downloadPNG}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-sans transition-all duration-200 hover:bg-white/[0.06]"
        style={{
          borderColor: `${domCat.color}30`,
          color: domCat.color,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download as Image
      </button>
    </div>
  );
}

export { CATEGORY_MAP, STYLE_INFO };
