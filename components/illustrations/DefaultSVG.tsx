export default function DefaultSVG({ color = "#8b5cf6" }: { color?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Book */}
      <path d="M20 18 L40 22 L40 62 L20 58Z" stroke={color} strokeWidth="1.5" opacity="0.3" fill={color} fillOpacity="0.03" />
      <path d="M60 18 L40 22 L40 62 L60 58Z" stroke={color} strokeWidth="1.5" opacity="0.3" fill={color} fillOpacity="0.03" />
      {/* Book spine */}
      <line x1="40" y1="22" x2="40" y2="62" stroke={color} strokeWidth="1.5" opacity="0.4" />
      {/* Text lines - left page */}
      <line x1="24" y1="28" x2="36" y2="30" stroke={color} strokeWidth="0.8" opacity="0.15" />
      <line x1="24" y1="33" x2="36" y2="35" stroke={color} strokeWidth="0.8" opacity="0.15" />
      <line x1="24" y1="38" x2="34" y2="40" stroke={color} strokeWidth="0.8" opacity="0.15" />
      <line x1="24" y1="43" x2="36" y2="45" stroke={color} strokeWidth="0.8" opacity="0.15" />
      {/* Text lines - right page */}
      <line x1="44" y1="30" x2="56" y2="28" stroke={color} strokeWidth="0.8" opacity="0.15" />
      <line x1="44" y1="35" x2="56" y2="33" stroke={color} strokeWidth="0.8" opacity="0.15" />
      <line x1="44" y1="40" x2="54" y2="38" stroke={color} strokeWidth="0.8" opacity="0.15" />
      {/* Lightbulb above */}
      <circle cx="40" cy="10" r="5" stroke={color} strokeWidth="1" opacity="0.25" />
      <line x1="40" y1="15" x2="40" y2="18" stroke={color} strokeWidth="1" opacity="0.2" />
      {/* Sparkles */}
      <circle cx="30" cy="8" r="1" fill={color} opacity="0.2" />
      <circle cx="50" cy="8" r="1" fill={color} opacity="0.2" />
      <circle cx="40" cy="3" r="1" fill={color} opacity="0.15" />
    </svg>
  );
}
