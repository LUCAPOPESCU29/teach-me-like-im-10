"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { getFlashTier } from "@/lib/flash-limits";
import {
  getFlashHistory,
  deleteFlashHistoryEntry,
  clearFlashHistory,
  type FlashHistoryEntry,
  type FlashMode,
} from "@/lib/flash-history";

// ─── Mode config ──────────────────────────────────────────────────────────────
const MODE_CONFIG: Record<FlashMode, { label: string; icon: string; color: string; rgb: string }> = {
  flash:   { label: "Flash",   icon: "⚡", color: "#f59e0b", rgb: "245,158,11"  },
  math:    { label: "Math",    icon: "📐", color: "#818cf8", rgb: "129,140,248" },
  science: { label: "Science", icon: "🔬", color: "#38bdf8", rgb: "56,189,248"  },
  code:    { label: "Code",    icon: "💻", color: "#34d399", rgb: "52,211,153"  },
  history: { label: "History", icon: "📜", color: "#fb7185", rgb: "251,113,133" },
};

const ALL_MODES: Array<FlashMode | "all"> = ["all", "flash", "math", "science", "code", "history"];

// ─── Date formatting ──────────────────────────────────────────────────────────
function formatDate(ts: number): string {
  const now = new Date();
  const d = new Date(ts);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86_400_000;

  if (ts >= todayStart) return "Today";
  if (ts >= yesterdayStart) return "Yesterday";

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Extract first section text ───────────────────────────────────────────────
function getPreviewText(sections: FlashHistoryEntry["sections"]): string {
  const keys = Object.keys(sections);
  for (const key of keys) {
    const val = sections[key];
    if (typeof val === "string" && val.trim()) return val.trim();
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string") return val[0].trim();
  }
  return "";
}

// ─── Trash icon ───────────────────────────────────────────────────────────────
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M1.75 3.5h10.5M5.25 3.5V2.333A.583.583 0 015.833 1.75h2.334a.583.583 0 01.583.583V3.5M11.667 3.5l-.584 7.584a.583.583 0 01-.583.583H3.5a.583.583 0 01-.583-.583L2.333 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── History card ─────────────────────────────────────────────────────────────
function HistoryCard({
  entry,
  expanded,
  onToggle,
  onDelete,
}: {
  entry: FlashHistoryEntry;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mode = MODE_CONFIG[entry.mode] ?? MODE_CONFIG.flash;
  const preview = getPreviewText(entry.sections);
  const sectionKeys = Object.keys(entry.sections);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-30px" }}
      exit={{ opacity: 0, y: -12, filter: "blur(4px)", transition: { duration: 0.28 } }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl overflow-hidden cursor-pointer group"
      style={{
        background: `rgba(${mode.rgb},0.04)`,
        border: `1px solid rgba(${mode.rgb},0.12)`,
      }}
      onClick={onToggle}
      whileHover={{ scale: 1.01, borderColor: `rgba(${mode.rgb},0.22)` }}
    >
      {/* Animated left bar */}
      <motion.div
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl origin-top"
        style={{ background: `linear-gradient(180deg, ${mode.color}, rgba(${mode.rgb},0.2))` }}
      />

      <div className="pl-5 pr-4 pt-4 pb-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mode icon */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
              style={{ backgroundColor: `rgba(${mode.rgb},0.1)`, border: `1px solid rgba(${mode.rgb},0.2)` }}
            >
              {mode.icon}
            </div>
            <div className="min-w-0">
              <span
                className="text-[10px] font-sans font-bold uppercase tracking-widest"
                style={{ color: mode.color }}
              >
                {mode.label}
              </span>
              <h3 className="font-sans font-black text-white text-sm leading-tight mt-0.5 truncate" style={{ letterSpacing: "-0.01em" }}>
                {entry.topic}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Date */}
            <span className="text-[11px] font-sans text-white/25">
              {formatDate(entry.savedAt)}
            </span>
            {/* Delete button */}
            <button
              onClick={handleDeleteClick}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-sans font-semibold transition-all duration-200 ${
                confirmDelete
                  ? "text-red-400 bg-red-400/10 border border-red-400/25"
                  : "text-white/25 hover:text-red-400 hover:bg-red-400/08 border border-transparent"
              }`}
            >
              <TrashIcon />
              {confirmDelete && <span>Confirm</span>}
            </button>
            {/* Expand chevron */}
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="text-white/25 group-hover:text-white/50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3.5 5.25L7 8.75l3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* Preview text — always visible, 2-line clamp when collapsed */}
        {preview && !expanded && (
          <p
            className="text-[13px] font-sans text-white/45 leading-relaxed"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {preview}
          </p>
        )}

        {/* Expanded: all sections */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-1 flex flex-col gap-4">
                {sectionKeys.map((key) => {
                  const val = entry.sections[key];
                  if (!val) return null;
                  const texts: string[] = Array.isArray(val) ? val : [val];
                  return (
                    <div key={key}>
                      <p
                        className="text-[10px] font-sans font-bold uppercase tracking-widest mb-1.5"
                        style={{ color: `rgba(${mode.rgb},0.7)` }}
                      >
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      {texts.map((t, i) => (
                        <p key={i} className="text-[13px] font-sans text-white/60 leading-relaxed">
                          {t}
                        </p>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Re-flash button */}
              <div className="mt-5 pt-4" style={{ borderTop: `1px solid rgba(${mode.rgb},0.1)` }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to the appropriate flash page with the topic pre-filled
                    const base = entry.mode === "math" ? "/flash/math" : entry.mode === "science" ? "/flash/science" : entry.mode === "code" ? "/flash/code" : entry.mode === "history" ? "/flash/history" : "/flash";
                    window.location.href = `${base}?topic=${encodeURIComponent(entry.topic)}`;
                  }}
                  className="text-[12px] font-sans font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-80"
                  style={{ color: mode.color }}
                >
                  {mode.icon} Re-flash this topic
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6h7M6.5 3.5L9 6l-2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Gate: free tier ──────────────────────────────────────────────────────────
function FreeTierGate({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center"
    >
      {/* Lock icon */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6"
        style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.22)", boxShadow: "0 0 40px rgba(245,158,11,0.1)" }}
      >
        🔒
      </motion.div>

      <h2
        className="font-sans font-black text-2xl sm:text-3xl text-white mb-3"
        style={{ letterSpacing: "-0.02em" }}
      >
        Flash History is a Pro feature
      </h2>
      <p className="text-white/40 font-sans text-sm leading-relaxed max-w-xs mb-8">
        Save and revisit your last 20 flashes. Upgrade to Flash Pro to unlock history.
      </p>

      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => router.push("/flash/upgrade")}
        className="px-7 py-3.5 rounded-xl font-sans font-bold text-sm"
        style={{
          background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
          color: "#050505",
          boxShadow: "0 4px 24px rgba(245,158,11,0.25)",
        }}
      >
        Upgrade to Flash Pro →
      </motion.button>

      <button
        onClick={() => router.push("/flash")}
        className="mt-4 text-sm font-sans text-white/25 hover:text-white/45 transition-colors"
      >
        Back to Flash
      </button>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center min-h-[40vh] px-4 text-center"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl mb-5"
        style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}
      >
        🕐
      </div>
      <h3 className="font-sans font-black text-xl text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
        No history yet
      </h3>
      <p className="text-white/35 font-sans text-sm mb-7 max-w-xs">
        Your flashes will appear here as you explore topics.
      </p>
      <button
        onClick={() => router.push("/flash")}
        className="px-6 py-3 rounded-xl text-sm font-sans font-bold transition-all duration-200 hover:scale-[1.03]"
        style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}
      >
        ⚡ Start Flashing
      </button>
    </motion.div>
  );
}

// ─── Mode filter pill ─────────────────────────────────────────────────────────
function FilterPill({
  mode,
  active,
  onClick,
}: {
  mode: FlashMode | "all";
  active: boolean;
  onClick: () => void;
}) {
  const config = mode === "all" ? null : MODE_CONFIG[mode];
  const label = mode === "all" ? "All" : config!.label;
  const icon = mode === "all" ? "✦" : config!.icon;
  const color = mode === "all" ? "#ffffff" : config!.color;
  const rgb = mode === "all" ? "255,255,255" : config!.rgb;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold transition-all duration-200"
      style={{
        backgroundColor: active ? `rgba(${rgb},0.15)` : "rgba(255,255,255,0.04)",
        border: `1px solid ${active ? `rgba(${rgb},0.35)` : "rgba(255,255,255,0.08)"}`,
        color: active ? color : "rgba(255,255,255,0.35)",
      }}
    >
      <span className="text-[11px]">{icon}</span>
      {label}
    </motion.button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FlashHistoryPage() {
  const router = useRouter();
  const [tier, setTier] = useState<"free" | "pro" | "exec" | null>(null);
  const [allEntries, setAllEntries] = useState<FlashHistoryEntry[]>([]);
  const [activeMode, setActiveMode] = useState<FlashMode | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load on mount
  useEffect(() => {
    const t = getFlashTier();
    setTier(t);
    if (t !== "free") {
      setAllEntries(getFlashHistory());
    }
  }, []);

  const filteredEntries =
    activeMode === "all"
      ? allEntries
      : allEntries.filter((e) => e.mode === activeMode);

  const handleDelete = (id: string) => {
    deleteFlashHistoryEntry(id);
    setAllEntries((prev) => prev.filter((e) => e.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleClearAll = () => {
    if (showClearConfirm) {
      clearFlashHistory();
      setAllEntries([]);
      setExpandedId(null);
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3500);
    }
  };

  // Loading skeleton while we detect tier
  if (tier === null) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-[#050505]" />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#050505] relative">
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(245,158,11,0.08) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            mask: "radial-gradient(ellipse 70% 50% at 50% 0%, black 0%, transparent 80%)",
            WebkitMask: "radial-gradient(ellipse 70% 50% at 50% 0%, black 0%, transparent 80%)",
          }}
        />

        <div className="relative max-w-2xl mx-auto px-4 pt-8 pb-24">
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => router.push("/flash")}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors duration-200 text-sm font-sans mb-10"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Flash
          </motion.button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.22)" }}
              >
                🕐
              </div>
              <div>
                <p className="text-[10px] font-sans font-bold uppercase tracking-[0.22em] text-white/30 mb-0.5">TM10 Flash</p>
                <h1
                  className="font-sans font-black text-white text-2xl sm:text-3xl"
                  style={{ letterSpacing: "-0.03em" }}
                >
                  Flash History
                </h1>
              </div>
            </div>

            {tier !== "free" && allEntries.length > 0 && (
              <p className="text-white/30 text-sm font-sans mt-3 ml-[52px]">
                {allEntries.length} saved flash{allEntries.length !== 1 ? "es" : ""}
                {tier === "exec" ? " · Unlimited" : " · last 20"}
              </p>
            )}
          </motion.div>

          {/* ── Free gate ── */}
          {tier === "free" && <FreeTierGate router={router} />}

          {/* ── Pro/Exec content ── */}
          {tier !== "free" && (
            <>
              {allEntries.length === 0 ? (
                <EmptyState router={router} />
              ) : (
                <>
                  {/* Mode filter pills */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.45 }}
                    className="flex flex-wrap gap-2 mb-7"
                  >
                    {ALL_MODES.map((m) => (
                      <FilterPill
                        key={m}
                        mode={m}
                        active={activeMode === m}
                        onClick={() => {
                          setActiveMode(m);
                          setExpandedId(null);
                        }}
                      />
                    ))}

                    {/* Clear All — pushed right */}
                    <div className="ml-auto">
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={handleClearAll}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold transition-all duration-200"
                        style={{
                          backgroundColor: showClearConfirm ? "rgba(251,113,133,0.12)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${showClearConfirm ? "rgba(251,113,133,0.3)" : "rgba(255,255,255,0.08)"}`,
                          color: showClearConfirm ? "#fb7185" : "rgba(255,255,255,0.25)",
                        }}
                      >
                        <TrashIcon />
                        {showClearConfirm ? "Confirm clear all?" : "Clear All"}
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Empty filtered state */}
                  <AnimatePresence mode="wait">
                    {filteredEntries.length === 0 ? (
                      <motion.div
                        key="empty-filtered"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-16 text-center text-white/30 text-sm font-sans"
                      >
                        No {activeMode} flashes in your history.
                      </motion.div>
                    ) : (
                      <motion.div
                        key="entries"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col gap-3"
                      >
                        <AnimatePresence mode="popLayout">
                          {filteredEntries.map((entry) => (
                            <HistoryCard
                              key={entry.id}
                              entry={entry}
                              expanded={expandedId === entry.id}
                              onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                              onDelete={() => handleDelete(entry.id)}
                            />
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Upgrade CTA for Pro → Exec */}
                  {tier === "pro" && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="mt-10 px-5 py-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      style={{ background: "rgba(129,140,248,0.05)", border: "1px solid rgba(129,140,248,0.15)" }}
                    >
                      <div>
                        <p className="text-sm font-sans font-bold text-white/70">
                          ⚡ Unlock unlimited history
                        </p>
                        <p className="text-xs font-sans text-white/30 mt-0.5">
                          Flash Executive saves every flash, forever.
                        </p>
                      </div>
                      <button
                        onClick={() => router.push("/flash/upgrade")}
                        className="shrink-0 px-5 py-2.5 rounded-xl text-xs font-sans font-bold transition-all hover:scale-[1.03] whitespace-nowrap"
                        style={{ backgroundColor: "rgba(129,140,248,0.12)", color: "#818cf8", border: "1px solid rgba(129,140,248,0.22)" }}
                      >
                        Upgrade to Executive →
                      </button>
                    </motion.div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
