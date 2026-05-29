"use client";

import { useAccent } from "@/components/AccentProvider";

const PRESET_COLORS = [
  { name: "Emerald", hex: "#34d399" },
  { name: "Blue", hex: "#60a5fa" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Pink", hex: "#f472b6" },
  { name: "Amber", hex: "#fbbf24" },
  { name: "Red", hex: "#f87171" },
  { name: "Cyan", hex: "#22d3ee" },
  { name: "Orange", hex: "#fb923c" },
];

export default function AccentColorPicker() {
  const { color, setColor } = useAccent();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESET_COLORS.map((preset) => (
        <button
          key={preset.hex}
          onClick={() => setColor(preset.hex)}
          title={preset.name}
          className={`w-8 h-8 rounded-full transition-all duration-200 ${
            color === preset.hex
              ? "ring-2 ring-offset-2 ring-offset-[#070b14] dark:ring-offset-[#070b14] scale-110"
              : "hover:scale-105 opacity-70 hover:opacity-100"
          }`}
          style={{
            backgroundColor: preset.hex,
            boxShadow: color === preset.hex ? `0 0 0 2px #070b14, 0 0 0 4px ${preset.hex}` : undefined,
          }}
          aria-label={`Set accent color to ${preset.name}`}
        />
      ))}
    </div>
  );
}
