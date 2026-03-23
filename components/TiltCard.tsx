"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import useIsMobile from "@/hooks/useIsMobile";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  glareColor?: string;
  maxTilt?: number;
}

export default function TiltCard({
  children,
  className = "",
  glareColor = "rgba(255,255,255,0.08)",
  maxTilt = 12,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const isMobile = useIsMobile();

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const springConfig = { stiffness: 260, damping: 20, mass: 0.8 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  function handleMouse(e: MouseEvent<HTMLDivElement>) {
    if (isMobile || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateX.set((py - 0.5) * -maxTilt);
    rotateY.set((px - 0.5) * maxTilt);
    glareX.set(px * 100);
    glareY.set(py * 100);
  }

  function handleLeave() {
    setHovering(false);
    rotateX.set(0);
    rotateY.set(0);
  }

  // On mobile: just render children without any tilt/spring overhead
  if (isMobile) {
    return <div className={`relative ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={handleLeave}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
        perspective: 800,
      }}
      className={`relative ${className}`}
    >
      {children}
      {/* Glare overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-10"
        style={{
          background: hovering
            ? `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, ${glareColor} 0%, transparent 60%)`
            : "none",
          opacity: hovering ? 1 : 0,
        }}
        animate={{ opacity: hovering ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  );
}
