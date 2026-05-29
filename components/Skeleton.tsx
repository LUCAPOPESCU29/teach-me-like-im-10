export function SkeletonLine({ width = "w-full" }: { width?: string }) {
  return (
    <div
      className={`h-3 rounded-lg bg-white/[0.04] ${width}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 2s linear infinite",
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-3">
      <SkeletonLine width="w-2/5" />
      <SkeletonLine width="w-full" />
      <SkeletonLine width="w-3/4" />
    </div>
  );
}

export function SkeletonAvatar({ size = "w-10 h-10" }: { size?: string }) {
  return (
    <div
      className={`${size} rounded-full bg-white/[0.04] shrink-0`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 2s linear infinite",
      }}
    />
  );
}

export function SkeletonTopicCard() {
  return (
    <div className="w-full p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center gap-4">
      {/* Level bars placeholder */}
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-1.5 h-6 rounded-full bg-white/[0.04]" />
        ))}
      </div>
      {/* Text lines */}
      <div className="flex-1 space-y-2">
        <SkeletonLine width="w-2/5" />
        <SkeletonLine width="w-1/4" />
      </div>
      {/* Arrow placeholder */}
      <div className="w-3 h-3 rounded bg-white/[0.04]" />
    </div>
  );
}

export function SkeletonLeaderboardRow() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      {/* Rank */}
      <div className="w-6 h-4 rounded bg-white/[0.04]" />
      {/* Avatar */}
      <SkeletonAvatar size="w-8 h-8" />
      {/* Name */}
      <div className="flex-1">
        <SkeletonLine width="w-28" />
      </div>
      {/* XP */}
      <div className="w-16">
        <SkeletonLine width="w-full" />
      </div>
    </div>
  );
}

export function SkeletonQuiz() {
  return (
    <div className="space-y-4 p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      {/* Question */}
      <div className="space-y-2 mb-6">
        <SkeletonLine width="w-full" />
        <SkeletonLine width="w-4/5" />
      </div>
      {/* 4 options */}
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-12 rounded-xl bg-white/[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s linear infinite",
          }}
        />
      ))}
    </div>
  );
}
