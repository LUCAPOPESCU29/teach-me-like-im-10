"use client";

import { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import useIsMobile from "@/hooks/useIsMobile";

export default function MobileMotionConfig({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <MotionConfig reducedMotion={isMobile ? "always" : "never"}>
      {children}
    </MotionConfig>
  );
}
