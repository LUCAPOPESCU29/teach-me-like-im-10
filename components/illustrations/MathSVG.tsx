export default function MathSVG({ color = "#a855f7" }: { color?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Grid lines */}
      <line x1="10" y1="15" x2="10" y2="65" stroke={color} strokeWidth="1" opacity="0.2" />
      <line x1="10" y1="65" x2="70" y2="65" stroke={color} strokeWidth="1" opacity="0.2" />
      {/* Axis arrows */}
      <path d="M10 15 L8 20 M10 15 L12 20" stroke={color} strokeWidth="1" opacity="0.3" />
      <path d="M70 65 L65 63 M70 65 L65 67" stroke={color} strokeWidth="1" opacity="0.3" />
      {/* Curve (parabola) */}
      <path d="M15 55 Q25 20 40 40 Q55 60 65 25" stroke={color} strokeWidth="2" opacity="0.5" strokeLinecap="round" />
      {/* Points on curve */}
      <circle cx="25" cy="32" r="2.5" fill={color} opacity="0.5" />
      <circle cx="40" cy="40" r="2.5" fill={color} opacity="0.5" />
      <circle cx="55" cy="38" r="2.5" fill={color} opacity="0.5" />
      {/* Pi symbol */}
      <text x="55" y="18" fill={color} opacity="0.3" fontSize="14" fontFamily="serif">π</text>
      {/* Plus sign */}
      <line x1="22" y1="58" x2="22" y2="50" stroke={color} strokeWidth="1.5" opacity="0.2" />
      <line x1="18" y1="54" x2="26" y2="54" stroke={color} strokeWidth="1.5" opacity="0.2" />
    </svg>
  );
}
