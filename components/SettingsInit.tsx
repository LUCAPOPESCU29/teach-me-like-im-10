"use client";

import { useEffect } from "react";

/**
 * Restores user settings from localStorage on page load.
 * Mounted once in layout.tsx.
 */
export default function SettingsInit() {
  useEffect(() => {
    // Restore reading font
    const font = localStorage.getItem("tmi10_font");
    if (font) {
      const families: Record<string, string> = {
        default: "inherit",
        serif: "Georgia, serif",
        mono: "'Courier New', monospace",
        dyslexia: "'Comic Sans MS', 'OpenDyslexic', sans-serif",
      };
      document.documentElement.style.setProperty("--reading-font", families[font] || "inherit");
    }

    // Restore text size
    const size = localStorage.getItem("tmi10_text_size");
    if (size) {
      const scales: Record<string, string> = { sm: "0.9", md: "1", lg: "1.1", xl: "1.25" };
      document.documentElement.style.setProperty("--reading-scale", scales[size] || "1");
    }

    // Restore reduce-motion
    if (localStorage.getItem("tmi10_animations_disabled") === "true") {
      document.documentElement.classList.add("reduce-motion");
    }
  }, []);

  return null;
}
