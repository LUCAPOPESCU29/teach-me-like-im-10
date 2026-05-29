"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ShortcutsModal from "@/components/ShortcutsModal";

export default function KeyboardShortcuts() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const closeModal = useCallback(() => setShowModal(false), []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip when typing in inputs, textareas, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Don't trigger on modifier combos (Ctrl+C, Cmd+K, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case "/":
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("focus-search"));
          break;
        case "?":
          e.preventDefault();
          setShowModal((prev) => !prev);
          break;
        case "h":
        case "Home":
          e.preventDefault();
          router.push("/");
          break;
        case "p":
          e.preventDefault();
          router.push("/progress");
          break;
        case "b":
          e.preventDefault();
          router.push("/battle");
          break;
        case "m":
          e.preventDefault();
          router.push("/math");
          break;
        case "l":
          e.preventDefault();
          router.push("/library");
          break;
        case "Escape":
          if (showModal) {
            setShowModal(false);
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, showModal]);

  return <ShortcutsModal open={showModal} onClose={closeModal} />;
}
