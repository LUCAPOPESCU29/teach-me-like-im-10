"use client";

import { useRouter } from "next/navigation";
import MathChat from "@/components/MathChat";
import XPBadge from "@/components/XPBadge";
import UserMenu from "@/components/UserMenu";

export default function MathChatPage() {
  const router = useRouter();

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-indigo-500/[0.04] blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="shrink-0 border-b border-white/[0.06] bg-[#070b14]/80 backdrop-blur-xl px-4 py-3 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/math")}
              className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans"
            >
              &larr; Math
            </button>
            <div className="h-4 w-px bg-white/10" />
            <h1 className="font-display text-lg text-white">
              Math Tutor{" "}
              <span className="text-indigo-400/60 text-sm font-sans">
                Chat
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <XPBadge />
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden max-w-3xl mx-auto w-full">
        <MathChat />
      </div>
    </div>
  );
}
