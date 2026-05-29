"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

/**
 * Layout-level route transition.
 * Lives in the root layout and triggers on every pathname change.
 * Uses blur + opacity so the transition feels cinematic rather than janky.
 */
export default function LayoutTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Admin panel has its own nested server layout — skip the page transition
  // to avoid AnimatePresence mode="wait" racing with RSC streaming.
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, filter: "blur(8px)", y: 6 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        exit={{ opacity: 0, filter: "blur(6px)", y: -4 }}
        transition={{
          duration: 0.28,
          ease: [0.32, 0.72, 0, 1],
        }}
        style={{ willChange: "opacity, transform, filter" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
