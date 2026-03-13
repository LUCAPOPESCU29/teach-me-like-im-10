export default function HistorySVG({ color = "#f59e0b" }: { color?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Column / Pillar */}
      <rect x="18" y="20" width="12" height="42" stroke={color} strokeWidth="1.5" opacity="0.3" fill={color} fillOpacity="0.03" />
      <rect x="16" y="18" width="16" height="4" rx="1" stroke={color} strokeWidth="1" opacity="0.3" />
      <rect x="16" y="60" width="16" height="4" rx="1" stroke={color} strokeWidth="1" opacity="0.3" />
      {/* Column flutes */}
      <line x1="21" y1="22" x2="21" y2="60" stroke={color} strokeWidth="0.5" opacity="0.15" />
      <line x1="24" y1="22" x2="24" y2="60" stroke={color} strokeWidth="0.5" opacity="0.15" />
      <line x1="27" y1="22" x2="27" y2="60" stroke={color} strokeWidth="0.5" opacity="0.15" />
      {/* Scroll / Document */}
      <path d="M42 22 L62 22 Q66 22 66 26 L66 50 Q66 54 62 54 L42 54 Q38 54 38 50 L38 26 Q38 22 42 22Z" stroke={color} strokeWidth="1.5" opacity="0.3" fill={color} fillOpacity="0.03" />
      {/* Scroll text lines */}
      <line x1="43" y1="30" x2="61" y2="30" stroke={color} strokeWidth="1" opacity="0.15" />
      <line x1="43" y1="35" x2="58" y2="35" stroke={color} strokeWidth="1" opacity="0.15" />
      <line x1="43" y1="40" x2="61" y2="40" stroke={color} strokeWidth="1" opacity="0.15" />
      <line x1="43" y1="45" x2="55" y2="45" stroke={color} strokeWidth="1" opacity="0.15" />
      {/* Hourglass */}
      <path d="M48 58 L56 58 L52 64 Z" stroke={color} strokeWidth="1" opacity="0.25" />
      <path d="M48 70 L56 70 L52 64 Z" stroke={color} strokeWidth="1" opacity="0.25" />
      {/* Stars / Sparkles */}
      <circle cx="35" cy="12" r="1.5" fill={color} opacity="0.2" />
      <circle cx="55" cy="15" r="1" fill={color} opacity="0.15" />
      <circle cx="68" cy="38" r="1.5" fill={color} opacity="0.2" />
    </svg>
  );
}
