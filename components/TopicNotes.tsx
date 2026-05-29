"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NoteData {
  text: string;
  updatedAt: string;
}

interface Props {
  slug: string;
}

function getStorageKey(slug: string) {
  return `tmi10_notes_${slug}`;
}

function loadNote(slug: string): NoteData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(slug));
    if (!raw) return null;
    return JSON.parse(raw) as NoteData;
  } catch {
    return null;
  }
}

function saveNote(slug: string, data: NoteData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(slug), JSON.stringify(data));
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TopicNotes({ slug }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load note from localStorage
  useEffect(() => {
    const note = loadNote(slug);
    if (note) {
      setText(note.text);
      setUpdatedAt(note.updatedAt);
    }
    setLoaded(true);
  }, [slug]);

  // Auto-save with debounce
  const debouncedSave = useCallback(
    (newText: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const now = new Date().toISOString();
        saveNote(slug, { text: newText, updatedAt: now });
        setUpdatedAt(now);
      }, 500);
    },
    [slug]
  );

  function handleChange(newText: string) {
    setText(newText);
    debouncedSave(newText);
  }

  // Focus textarea when expanding
  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [expanded]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (!loaded) return null;

  const charCount = text.length;
  const preview =
    text.length > 80 ? text.slice(0, 80).trimEnd() + "..." : text;

  return (
    <motion.div
      className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      {/* Header / toggle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left group hover:bg-white/[0.02] transition-colors"
      >
        {/* Pencil icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald-400/60 shrink-0"
        >
          <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" />
        </svg>

        <span className="font-sans text-sm text-white/70 flex-1">
          My Notes
        </span>

        {/* Note count when collapsed and has content */}
        {!expanded && charCount > 0 && (
          <span className="font-mono text-[11px] text-white/20">
            {charCount} chars
          </span>
        )}

        {/* Chevron */}
        <motion.svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-white/20 group-hover:text-white/40 transition-colors shrink-0"
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path d="M3 5l4 4 4-4" />
        </motion.svg>
      </button>

      {/* Preview when collapsed */}
      <AnimatePresence>
        {!expanded && preview && (
          <motion.div
            className="px-4 pb-3 -mt-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-white/20 text-xs font-sans line-clamp-1">
              {preview}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded editor */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Write your notes here... jot down key ideas, questions, or things you want to remember."
                className="w-full min-h-[140px] max-h-[400px] resize-y rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 text-sm text-white/80 font-sans placeholder:text-white/15 focus:outline-none focus:border-emerald-500/30 transition-colors"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {updatedAt && (
                    <span className="text-[11px] text-white/20 font-sans">
                      Last edited {formatTimestamp(updatedAt)}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[11px] text-white/15">
                  {charCount}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
