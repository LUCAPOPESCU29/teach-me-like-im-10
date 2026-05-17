"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

/**
 * Page-level entrance animation.
 * Provides a quick y-slide-up on mount.
 * Route-level blur transitions are handled by LayoutTransition in the root layout.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
    </motion.div>
  );
}
