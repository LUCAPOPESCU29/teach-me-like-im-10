"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCelebration } from "@/components/CelebrationProvider";

const NAV_ITEMS = [
  { href: "/", label: "Home", emoji: "\u{1F3E0}" },
  { href: "/math", label: "Math", emoji: "\u{1F9EE}" },
  { href: "/code", label: "Code", emoji: "\u{1F4BB}" },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
      {/* Gradient fade above bar */}
      <div className="h-6 bg-gradient-to-t from-[#070b14] to-transparent pointer-events-none" />

      <div className="bg-[#070b14]/80 backdrop-blur-xl border-t border-white/[0.06] px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-14">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => { playSound("pop"); router.push(item.href); }}
                className="relative flex flex-col items-center justify-center w-16 h-full gap-0.5 transition-colors"
              >
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
