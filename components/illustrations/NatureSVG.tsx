export default function NatureSVG({ color = "#10b981" }: { color?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Mountain */}
      <path d="M10 65 L30 25 L50 65" stroke={color} strokeWidth="1.5" opacity="0.3" fill={color} fillOpacity="0.05" />
      <path d="M30 65 L50 30 L70 65" stroke={color} strokeWidth="1.5" opacity="0.3" fill={color} fillOpacity="0.05" />
      {/* Sun */}
      <circle cx="60" cy="20" r="8" stroke={color} strokeWidth="1.5" opacity="0.4" />
      <circle cx="60" cy="20" r="4" fill={color} opacity="0.3" />
      {/* Sun rays */}
      <line x1="60" y1="8" x2="60" y2="5" stroke={color} strokeWidth="1" opacity="0.2" />
      <line x1="60" y1="32" x2="60" y2="35" stroke={color} strokeWidth="1" opacity="0.2" />
      <line x1="48" y1="20" x2="45" y2="20" stroke={color} strokeWidth="1" opacity="0.2" />
      <line x1="72" y1="20" x2="75" y2="20" stroke={color} strokeWidth="1" opacity="0.2" />
      {/* Trees */}
      <line x1="18" y1="65" x2="18" y2="55" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <circle cx="18" cy="52" r="5" fill={color} opacity="0.15" />
      <line x1="65" y1="65" x2="65" y2="52" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <circle cx="65" cy="49" r="6" fill={color} opacity="0.15" />
      {/* Ground */}
      <line x1="5" y1="65" x2="75" y2="65" stroke={color} strokeWidth="1" opacity="0.2" />
    </svg>
  );
}
