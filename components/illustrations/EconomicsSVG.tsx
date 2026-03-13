export default function EconomicsSVG({ color = "#22c55e" }: { color?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Bar chart */}
      <rect x="14" y="45" width="8" height="20" rx="1" fill={color} opacity="0.15" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
      <rect x="26" y="35" width="8" height="30" rx="1" fill={color} opacity="0.15" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
      <rect x="38" y="25" width="8" height="40" rx="1" fill={color} opacity="0.2" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
      <rect x="50" y="30" width="8" height="35" rx="1" fill={color} opacity="0.15" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
      <rect x="62" y="18" width="8" height="47" rx="1" fill={color} opacity="0.25" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
      {/* Trend line */}
      <path d="M18 43 L30 33 L42 23 L54 28 L66 16" stroke={color} strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
      {/* Arrow up */}
      <path d="M66 16 L63 20 M66 16 L69 20" stroke={color} strokeWidth="1.5" opacity="0.4" />
      {/* Dollar sign */}
      <text x="12" y="16" fill={color} opacity="0.25" fontSize="12" fontFamily="sans-serif" fontWeight="bold">$</text>
      {/* Base line */}
      <line x1="10" y1="65" x2="74" y2="65" stroke={color} strokeWidth="1" opacity="0.2" />
    </svg>
  );
}
