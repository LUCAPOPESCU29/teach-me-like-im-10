"use client";
import PageTransition from "@/components/PageTransition";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/EmptyState";

interface NoteEntry {
  slug: string;
  text: string;
  updatedAt: string;
}

function getAllNotes(): NoteEntry[] {
  if (typeof window === "undefined") return [];
  const entries: NoteEntry[] = [];
  const prefix = "tmi10_notes_";
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw) as { text: string; updatedAt: string };
      if (!data.text || !data.text.trim()) continue;
      const slug = key.slice(prefix.length);
      entries.push({ slug, text: data.text, updatedAt: data.updatedAt });
    } catch {
      continue;
    }
  }
  // Sort by most recently edited
  entries.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  return entries;
}

function deleteNote(slug: string) {
  localStorage.removeItem(`tmi10_notes_${slug}`);
}

function unslugify(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setNotes(getAllNotes());
    setLoading(false);
  }, []);

  const filtered = search.trim()
    ? notes.filter(
        (n) =>
          n.text.toLowerCase().includes(search.toLowerCase()) ||
          unslugify(n.slug).toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  function handleDelete(slug: string) {
    deleteNote(slug);
    setNotes((prev) => prev.filter((n) => n.slug !== slug));
    setConfirmDelete(null);
    if (expandedSlug === slug) setExpandedSlug(null);
  }

  return (
    <PageTransition>
    <main className="min-h-screen max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => router.push("/")}
          className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans mb-4 inline-block"
        >
          &larr; Home
        </button>
        <h1 className="font-display text-3xl sm:text-4xl text-white">
          My Notes
        </h1>
        <p className="text-white/30 text-sm font-sans mt-1">
          Notes you&apos;ve written while learning topics
        </p>
      </motion.div>

      {/* Search */}
      {notes.length > 0 && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="2"
              strokeLinecap="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            >
              <circle cx="6.5" cy="6.5" r="5" />
              <path d="M10.5 10.5L15 15" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 font-sans placeholder:text-white/20 focus:outline-none focus:border-emerald-500/30 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors text-xs"
              >
                &times;
              </button>
            )}
          </div>
          {search.trim() && (
            <p className="text-white/20 text-xs font-sans mt-2">
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
            </p>
          )}
        </motion.div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-white/30 font-mono text-sm animate-pulse">
          Loading...
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          illustration="bookmarks"
          title="No notes yet"
          description="Start writing notes while learning a topic. They'll appear here."
          action={{
            label: "Explore topics",
            onClick: () => router.push("/"),
          }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          illustration="search"
          title="No matching notes"
          description="Try a different search term."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((note, i) => {
            const isExpanded = expandedSlug === note.slug;
            const preview =
              note.text.length > 100
                ? note.text.slice(0, 100).trimEnd() + "..."
                : note.text;

            return (
              <motion.div
                key={note.slug}
                className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                {/* Note header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() =>
                      setExpandedSlug(isExpanded ? null : note.slug)
                    }
                    className="flex-1 text-left flex items-center gap-3 min-w-0 group"
                  >
                    {/* Expand chevron */}
                    <motion.svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      className="text-white/20 group-hover:text-white/40 transition-colors shrink-0"
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <path d="M4 2l4 4-4 4" />
                    </motion.svg>

                    <div className="min-w-0 flex-1">
                      <p className="text-white font-sans text-sm capitalize truncate">
                        {unslugify(note.slug)}
                      </p>
                      {!isExpanded && (
                        <p className="text-white/20 text-xs font-sans mt-0.5 truncate">
                          {preview}
                        </p>
                      )}
                    </div>
                  </button>

                  <span className="text-white/15 text-[11px] font-sans shrink-0 hidden sm:block">
                    {formatDate(note.updatedAt)}
                  </span>

                  {/* Go to topic */}
                  <button
                    onClick={() => router.push(`/learn/${note.slug}`)}
                    className="text-emerald-400/40 hover:text-emerald-400/80 transition-colors shrink-0"
                    title="Go to topic"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 3h7v7" />
                      <path d="M13 3L3 13" />
                    </svg>
                  </button>

                  {/* Delete */}
                  {confirmDelete === note.slug ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleDelete(note.slug)}
                        className="text-[11px] font-sans text-red-400/80 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-[11px] font-sans text-white/20 hover:text-white/50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(note.slug)}
                      className="text-white/15 hover:text-red-400/60 transition-colors shrink-0"
                      title="Delete note"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      >
                        <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4M13.33 4v9.33a1.33 1.33 0 01-1.33 1.34H4a1.33 1.33 0 01-1.33-1.34V4" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-white/[0.04]">
                        <p className="text-white/60 text-sm font-sans whitespace-pre-wrap leading-relaxed">
                          {note.text}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-white/15 text-[11px] font-sans sm:hidden">
                            {formatDate(note.updatedAt)}
                          </span>
                          <span className="font-mono text-[11px] text-white/15">
                            {note.text.length} chars
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </main>
      </PageTransition>
  );
}
