export default function HealthSVG({ color = "#ef4444" }: { color?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Heart */}
      <path d="M40 60 C20 45 10 30 20 22 C26 17 34 20 40 28 C46 20 54 17 60 22 C70 30 60 45 40 60Z" stroke={color} strokeWidth="1.5" opacity="0.35" fill={color} fillOpacity="0.05" />
      {/* Heartbeat line */}
      <path d="M10 40 L25 40 L30 30 L35 50 L40 35 L45 45 L48 40 L70 40" stroke={color} strokeWidth="1.5" opacity="0.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Cross/Plus */}
      <rect x="36" y="12" width="8" height="16" rx="1" fill={color} opacity="0.15" />
      <rect x="32" y="16" width="16" height="8" rx="1" fill={color} opacity="0.15" />
      {/* Pulse dots */}
      <circle cx="15" cy="40" r="1.5" fill={color} opacity="0.3" />
      <circle cx="65" cy="40" r="1.5" fill={color} opacity="0.3" />
    </svg>
  );
}
