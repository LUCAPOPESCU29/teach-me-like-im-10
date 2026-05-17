"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCelebration } from "@/components/CelebrationProvider";
import { NewDot } from "@/components/NewBadge";

const NAV_ITEMS = [
  { href: "/", label: "Home", emoji: "\u{1F3E0}" },
  { href: "/explore", label: "Explore", emoji: "\u{1F9ED}" },
  { href: "/playground", label: "Play", emoji: "\u{1F9EA}" },
  { href: "/friends", label: "Friends", emoji: "\u{1F44B}" },
  { href: "/progress", label: "Progress", emoji: "\u{1FA90}" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { playSound } = useCelebration();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[999] sm:hidden" data-bottomnav style={{ position: "fixed" }}>
      {/* Gradient fade above bar */}
      <div className="h-8 bg-gradient-to-t from-[#050910] to-transparent pointer-events-none" />

      <div className="bg-[#050910] border-t border-white/[0.08] px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around h-14">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => { playSound("pop"); router.push(item.href); }}
                className="relative flex flex-col items-center justify-center w-16 h-full gap-0.5 transition-colors"
              >
                <NewDot path={item.href} size="sm" />
                {active && (
                  <motion.div
                    className="absolute -top-px left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-emerald-400"
                    layoutId="bottomNavIndicator"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span
                  className={`text-lg transition-transform duration-200 ${
                    active ? "scale-110" : "scale-100"
                  }`}
                >
                  {item.emoji}
                </span>
                <span
                  className={`text-[10px] font-sans transition-colors duration-200 ${
                    active ? "text-emerald-400" : "text-white/30"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
