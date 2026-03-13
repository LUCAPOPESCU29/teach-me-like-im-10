"use client";

import { type ReactNode, type ButtonHTMLAttributes } from "react";
import "./StarBorder.css";

interface StarBorderProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: string;
  speed?: string;
  thickness?: number;
  children: ReactNode;
}

export default function StarBorder({
  className = "",
  color = "#34d399",
  speed = "6s",
  thickness = 1,
  children,
  style,
  ...rest
}: StarBorderProps) {
  return (
    <button
      className={`star-border-container ${className}`}
      style={{
        padding: `${thickness}px 0`,
        ...style,
      }}
      {...rest}
    >
      <div
        className="border-gradient-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="border-gradient-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div className="star-border-inner">{children}</div>
    </button>
  );
}
