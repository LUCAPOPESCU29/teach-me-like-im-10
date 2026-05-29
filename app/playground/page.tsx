"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";

/* ───────────────────── helpers ───────────────────── */

function fmt(n: number, decimals = 1) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function AnimatedNumber({ value, decimals = 1 }: { value: number; decimals?: number }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value.toFixed(decimals)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15 }}
        className="inline-block"
      >
        {fmt(value, decimals)}
      </motion.span>
    </AnimatePresence>
  );
}

/* ───────────────────── slider ───────────────────── */

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm font-sans mb-1">
        <span className="text-white/50">{label}</span>
        <span className="text-white/80 font-medium tabular-nums">
          {fmt(value, step < 1 ? 1 : 0)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400
          [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(52,211,153,0.5)]
          [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
          [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-emerald-400 [&::-moz-range-thumb]:border-0"
      />
    </div>
  );
}

/* ───────────────────── formula cards ───────────────────── */

function SpeedCard() {
  const [distance, setDistance] = useState(100);
  const [time, setTime] = useState(2);
  const speed = distance / time;

  return (
    <FormulaCard
      emoji="🚀"
      title="Speed = Distance / Time"
      description="If you ride your bike 10 km and it takes 1 hour, your speed is 10 km/h. Faster means more distance in less time!"
    >
      <Slider label="Distance" value={distance} min={0} max={1000} step={10} unit="km" onChange={setDistance} />
      <Slider label="Time" value={time} min={0.1} max={24} step={0.1} unit="hrs" onChange={setTime} />
      <ResultBox label="Speed" value={speed} unit="km/h" decimals={1} />

      {/* visual: little car on a road */}
      <div className="mt-4 relative h-8 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="absolute left-0 top-0 h-full bg-emerald-500/20 rounded-full"
          animate={{ width: `${Math.min((speed / 200) * 100, 100)}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 text-lg"
          animate={{ left: `${Math.min((speed / 200) * 100, 95)}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
        >
          {"🚗"}
        </motion.div>
      </div>
    </FormulaCard>
  );
}

function CircleAreaCard() {
  const [radius, setRadius] = useState(15);
  const area = Math.PI * radius * radius;
  const maxR = 50;
  const viewSize = 120;
  const scaledR = (radius / maxR) * (viewSize / 2 - 4);

  return (
    <FormulaCard
      emoji="\u{1F534}"
      title="Area of a Circle"
      description="Imagine painting a pizza -- the area tells you how much cheese you need! It grows really fast as the pizza gets bigger."
    >
      <Slider label="Radius" value={radius} min={1} max={50} step={1} unit="" onChange={setRadius} />
      <ResultBox label="Area" value={area} unit="" decimals={1} prefix={"\u03C0 \u00D7 r\u00B2 = "} />

      <div className="flex justify-center mt-4">
        <svg width={viewSize} height={viewSize} className="overflow-visible">
          <motion.circle
            cx={viewSize / 2}
            cy={viewSize / 2}
            r={scaledR}
            fill="rgba(52,211,153,0.15)"
            stroke="rgba(52,211,153,0.6)"
            strokeWidth={2}
            animate={{ r: scaledR }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          />
          {/* radius line */}
          <motion.line
            x1={viewSize / 2}
            y1={viewSize / 2}
            x2={viewSize / 2 + scaledR}
            y2={viewSize / 2}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1}
            strokeDasharray="4 3"
            animate={{ x2: viewSize / 2 + scaledR }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          />
          <text
            x={viewSize / 2 + scaledR / 2}
            y={viewSize / 2 - 6}
            fill="rgba(255,255,255,0.4)"
            fontSize={10}
            textAnchor="middle"
            className="font-sans"
          >
            r={radius}
          </text>
        </svg>
      </div>
    </FormulaCard>
  );
}

function TempCard() {
  const [f, setF] = useState(72);
  const c = ((f - 32) * 5) / 9;

  // thermometer fill: map -40..212 to 0..100
  const fillPct = ((f - -40) / (212 - -40)) * 100;
  const tempColor = f < 32 ? "#60a5fa" : f < 80 ? "#34d399" : f < 150 ? "#fbbf24" : "#ef4444";

  return (
    <FormulaCard
      emoji="🌡️"
      title="Fahrenheit to Celsius"
      description="Americans use Fahrenheit, most of the world uses Celsius. Water freezes at 32\u00B0F (0\u00B0C) and boils at 212\u00B0F (100\u00B0C)."
    >
      <Slider label="Fahrenheit" value={f} min={-40} max={212} step={1} unit="\u00B0F" onChange={setF} />

      <div className="flex items-center gap-6 mt-2">
        {/* thermometer */}
        <div className="relative w-6 h-28 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
          <motion.div
            className="absolute bottom-0 left-0 w-full rounded-full"
            animate={{ height: `${fillPct}%`, backgroundColor: tempColor }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
          />
        </div>

        <div className="flex-1 space-y-2">
          <ResultBox label="Fahrenheit" value={f} unit={"\u00B0F"} decimals={0} />
          <ResultBox label="Celsius" value={c} unit={"\u00B0C"} decimals={1} />
        </div>
      </div>
    </FormulaCard>
  );
}

function CompoundInterestCard() {
  const [principal, setPrincipal] = useState(1000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(10);

  const total = principal * Math.pow(1 + rate / 100, years);
  const interest = total - principal;

  // bar data
  const maxTotal = 10000 * Math.pow(1.2, 30); // rough max
  const barPct = Math.min((total / maxTotal) * 100, 100);
  const principalPct = Math.min((principal / maxTotal) * 100, 100);

  return (
    <FormulaCard
      emoji="💰"
      title="Compound Interest"
      description="It's like a snowball rolling downhill -- your money earns money, and THAT money earns money too. The longer you wait, the bigger it gets!"
    >
      <Slider label="Starting money" value={principal} min={100} max={10000} step={100} unit="$" onChange={setPrincipal} />
      <Slider label="Interest rate" value={rate} min={1} max={20} step={0.5} unit="%" onChange={setRate} />
      <Slider label="Years" value={years} min={1} max={30} step={1} unit="yrs" onChange={setYears} />

      <ResultBox label="Total" value={total} unit="$" decimals={0} />

      {/* stacked bar */}
      <div className="mt-4 relative h-8 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="absolute left-0 top-0 h-full bg-emerald-500/30 rounded-full"
          animate={{ width: `${barPct}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
        />
        <motion.div
          className="absolute left-0 top-0 h-full bg-emerald-400/50 rounded-full"
          animate={{ width: `${principalPct}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-sans mt-1">
        <span className="text-emerald-400/60">Principal: ${fmt(principal, 0)}</span>
        <span className="text-emerald-300/60">Interest earned: ${fmt(interest, 0)}</span>
      </div>
    </FormulaCard>
  );
}

function BMICard() {
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const bmi = weight / Math.pow(height / 100, 2);

  let category: string;
  let color: string;
  if (bmi < 18.5) {
    category = "Underweight";
    color = "#60a5fa";
  } else if (bmi < 25) {
    category = "Normal";
    color = "#34d399";
  } else if (bmi < 30) {
    category = "Overweight";
    color = "#fbbf24";
  } else {
    category = "Obese";
    color = "#ef4444";
  }

  // pointer position on scale (15-40 range)
  const pointerPct = Math.min(Math.max(((bmi - 15) / (40 - 15)) * 100, 0), 100);

  return (
    <FormulaCard
      emoji="\u2696\uFE0F"
      title="BMI Calculator"
      description="BMI uses your height and weight to give a rough idea of whether you're in a healthy range. It's not perfect but it's a quick check!"
    >
      <Slider label="Height" value={height} min={100} max={220} step={1} unit="cm" onChange={setHeight} />
      <Slider label="Weight" value={weight} min={30} max={150} step={1} unit="kg" onChange={setWeight} />

      <div className="text-center mt-2">
        <motion.span
          className="text-3xl font-sans font-bold tabular-nums"
          animate={{ color }}
          transition={{ duration: 0.3 }}
        >
          <AnimatedNumber value={bmi} decimals={1} />
        </motion.span>
        <motion.p
          className="text-sm font-sans font-medium mt-1"
          animate={{ color }}
          transition={{ duration: 0.3 }}
        >
          {category}
        </motion.p>
      </div>

      {/* scale bar */}
      <div className="mt-4 relative">
        <div className="h-3 rounded-full overflow-hidden flex">
          <div className="flex-1 bg-blue-400/30" />
          <div className="flex-1 bg-emerald-400/30" />
          <div className="flex-1 bg-yellow-400/30" />
          <div className="flex-1 bg-red-400/30" />
        </div>
        <motion.div
          className="absolute top-0 w-1 h-3 bg-white rounded-full"
          animate={{ left: `${pointerPct}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
        />
        <div className="flex justify-between text-[9px] font-sans text-white/30 mt-1">
          <span>15</span>
          <span>18.5</span>
          <span>25</span>
          <span>30</span>
          <span>40</span>
        </div>
      </div>
    </FormulaCard>
  );
}

function PythagoreanCard() {
  const [a, setA] = useState(3);
  const [b, setB] = useState(4);
  const c = Math.sqrt(a * a + b * b);

  const maxSide = 20;
  const svgW = 140;
  const svgH = 140;
  const pad = 20;
  const scaleA = ((svgH - pad * 2) * a) / maxSide;
  const scaleB = ((svgW - pad * 2) * b) / maxSide;

  // triangle points: bottom-left, bottom-right, top-left
  const p1 = [pad, svgH - pad]; // bottom-left (right angle)
  const p2 = [pad + scaleB, svgH - pad]; // bottom-right
  const p3 = [pad, svgH - pad - scaleA]; // top-left

  return (
    <FormulaCard
      emoji="📐"
      title="Pythagorean Theorem"
      description="For a right triangle, the two short sides squared and added together equal the long side squared. a\u00B2 + b\u00B2 = c\u00B2!"
    >
      <Slider label="Side a" value={a} min={1} max={20} step={1} onChange={setA} />
      <Slider label="Side b" value={b} min={1} max={20} step={1} onChange={setB} />
      <ResultBox label="c" value={c} unit="" decimals={2} prefix="c = " />

      <div className="flex justify-center mt-3">
        <svg width={svgW} height={svgH} className="overflow-visible">
          {/* triangle fill */}
          <motion.polygon
            points={`${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]}`}
            fill="rgba(52,211,153,0.1)"
            stroke="rgba(52,211,153,0.6)"
            strokeWidth={2}
            animate={{
              points: `${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]}`,
            }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
          />
          {/* right angle square */}
          <rect
            x={p1[0]}
            y={p1[1] - 10}
            width={10}
            height={10}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
          />
          {/* labels */}
          <text x={pad - 14} y={svgH - pad - scaleA / 2} fill="rgba(255,255,255,0.5)" fontSize={11} className="font-sans" textAnchor="middle">
            a
          </text>
          <text x={pad + scaleB / 2} y={svgH - pad + 14} fill="rgba(255,255,255,0.5)" fontSize={11} className="font-sans" textAnchor="middle">
            b
          </text>
          <text
            x={(p2[0] + p3[0]) / 2 + 10}
            y={(p2[1] + p3[1]) / 2}
            fill="rgba(52,211,153,0.8)"
            fontSize={11}
            className="font-sans font-medium"
            textAnchor="middle"
          >
            c
          </text>
        </svg>
      </div>
    </FormulaCard>
  );
}

/* ───────────────────── shared components ───────────────────── */

function FormulaCard({
  emoji,
  title,
  description,
  children,
}: {
  emoji: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ borderColor: "rgba(255,255,255,0.12)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{emoji}</span>
        <h3 className="text-white/90 font-sans font-semibold text-base">{title}</h3>
      </div>
      <p className="text-white/35 text-sm font-sans mb-5 leading-relaxed">{description}</p>
      {children}
    </motion.div>
  );
}

function ResultBox({
  label,
  value,
  unit,
  decimals = 1,
  prefix,
}: {
  label: string;
  value: number;
  unit: string;
  decimals?: number;
  prefix?: string;
}) {
  return (
    <div className="bg-white/[0.04] rounded-xl px-4 py-3 mt-2">
      <span className="text-white/40 text-xs font-sans block mb-0.5">{label}</span>
      <span className="text-white font-sans font-bold text-2xl tabular-nums">
        {prefix}
        <AnimatedNumber value={value} decimals={decimals} />
        {unit ? <span className="text-white/50 text-base ml-1">{unit}</span> : null}
      </span>
    </div>
  );
}

/* ───────────────────── page ───────────────────── */

export default function PlaygroundPage() {
  const [selected, setSelected] = useState<string | null>(null);

  const formulas = [
    { id: "speed", label: "🚀 Speed", component: <SpeedCard /> },
    { id: "circle", label: "🔴 Circle Area", component: <CircleAreaCard /> },
    { id: "temp", label: "\uD83C\uDF21\uFE0F Temperature", component: <TempCard /> },
    { id: "interest", label: "\uD83D\uDCB0 Compound Interest", component: <CompoundInterestCard /> },
    { id: "bmi", label: "\u2696\uFE0F BMI", component: <BMICard /> },
    { id: "pythagoras", label: "\uD83D\uDCD0 Pythagorean", component: <PythagoreanCard /> },
  ];

  return (
    <PageTransition>
    <main className="min-h-screen px-4 pt-12 sm:pt-16 pb-24 max-w-3xl mx-auto">
      {/* header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl sm:text-5xl font-display text-white mb-3">
          Formula <span className="text-emerald-400">Playground</span>
        </h1>
        <p className="text-white/35 font-sans text-sm sm:text-base max-w-md mx-auto">
          Pick a formula, drag the sliders, and watch the math come alive.
        </p>
      </motion.div>

      {/* formula picker chips */}
      <motion.div
        className="flex flex-wrap justify-center gap-2 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {formulas.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelected(selected === f.id ? null : f.id)}
            className={`px-4 py-2 rounded-xl text-sm font-sans font-medium transition-all border ${
              selected === f.id
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:text-white/70 hover:border-white/15"
            }`}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* formula cards */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {formulas
            .filter((f) => !selected || f.id === selected)
            .map((f) => (
              <motion.div
                key={f.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
              >
                {f.component}
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </main>
      </PageTransition>
  );
}
