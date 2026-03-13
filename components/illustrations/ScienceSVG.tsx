export default function ScienceSVG({ color = "#06b6d4" }: { color?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Atom orbits */}
      <ellipse cx="40" cy="40" rx="28" ry="12" stroke={color} strokeWidth="1.5" opacity="0.3" transform="rotate(0 40 40)" />
      <ellipse cx="40" cy="40" rx="28" ry="12" stroke={color} strokeWidth="1.5" opacity="0.3" transform="rotate(60 40 40)" />
      <ellipse cx="40" cy="40" rx="28" ry="12" stroke={color} strokeWidth="1.5" opacity="0.3" transform="rotate(120 40 40)" />
      {/* Nucleus */}
      <circle cx="40" cy="40" r="5" fill={color} opacity="0.4" />
      <circle cx="40" cy="40" r="3" fill={color} opacity="0.7" />
      {/* Electrons */}
      <circle cx="68" cy="40" r="2.5" fill={color} opacity="0.6" />
      <circle cx="26" cy="56" r="2.5" fill={color} opacity="0.6" />
      <circle cx="26" cy="24" r="2.5" fill={color} opacity="0.6" />
    </svg>
  );
}
