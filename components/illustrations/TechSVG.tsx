export default function TechSVG({ color = "#3b82f6" }: { color?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Circuit board pattern */}
      <rect x="15" y="15" width="50" height="50" rx="4" stroke={color} strokeWidth="1" opacity="0.15" />
      {/* CPU chip */}
      <rect x="28" y="28" width="24" height="24" rx="2" stroke={color} strokeWidth="1.5" opacity="0.4" fill={color} fillOpacity="0.05" />
      <rect x="33" y="33" width="14" height="14" rx="1" stroke={color} strokeWidth="1" opacity="0.3" />
      {/* Pins - top */}
      <line x1="34" y1="28" x2="34" y2="20" stroke={color} strokeWidth="1" opacity="0.25" />
      <line x1="40" y1="28" x2="40" y2="18" stroke={color} strokeWidth="1" opacity="0.25" />
      <line x1="46" y1="28" x2="46" y2="20" stroke={color} strokeWidth="1" opacity="0.25" />
      {/* Pins - bottom */}
      <line x1="34" y1="52" x2="34" y2="60" stroke={color} strokeWidth="1" opacity="0.25" />
      <line x1="40" y1="52" x2="40" y2="62" stroke={color} strokeWidth="1" opacity="0.25" />
      <line x1="46" y1="52" x2="46" y2="60" stroke={color} strokeWidth="1" opacity="0.25" />
      {/* Pins - left */}
      <line x1="28" y1="34" x2="20" y2="34" stroke={color} strokeWidth="1" opacity="0.25" />
      <line x1="28" y1="40" x2="18" y2="40" stroke={color} strokeWidth="1" opacity="0.25" />
      <line x1="28" y1="46" x2="20" y2="46" stroke={color} strokeWidth="1" opacity="0.25" />
      {/* Pins - right */}
      <line x1="52" y1="34" x2="60" y2="34" stroke={color} strokeWidth="1" opacity="0.25" />
      <line x1="52" y1="40" x2="62" y2="40" stroke={color} strokeWidth="1" opacity="0.25" />
      <line x1="52" y1="46" x2="60" y2="46" stroke={color} strokeWidth="1" opacity="0.25" />
      {/* Binary text */}
      <text x="35" y="42" fill={color} opacity="0.4" fontSize="6" fontFamily="monospace">01</text>
      {/* Signal dots */}
      <circle cx="20" cy="20" r="2" fill={color} opacity="0.2" />
      <circle cx="60" cy="20" r="2" fill={color} opacity="0.2" />
      <circle cx="20" cy="60" r="2" fill={color} opacity="0.2" />
      <circle cx="60" cy="60" r="2" fill={color} opacity="0.2" />
    </svg>
  );
}
