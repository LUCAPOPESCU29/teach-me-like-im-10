// Flash history storage — Pro/Exec only, max 20 entries

import { getFlashTier } from "./flash-limits";

export type FlashMode = "flash" | "math" | "science" | "history" | "code";

export interface FlashHistoryEntry {
  id: string;
  topic: string;
  mode: FlashMode;
  savedAt: number;
  sections: Record<string, string | string[]>;
}

// ── Storage key ───────────────────────────────────────────────────────────────
const HISTORY_KEY = "tmi10_flash_history";
const MAX_ENTRIES = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadHistory(): FlashHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FlashHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: FlashHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns all saved Flash history entries, newest first. */
export function getFlashHistory(): FlashHistoryEntry[] {
  return loadHistory();
}

/**
 * Saves a Flash result to history.
 * No-ops silently for free-tier users.
 * Trims the list to MAX_ENTRIES, dropping the oldest when over the limit.
 */
export function saveFlashToHistory(
  topic: string,
  mode: FlashMode,
  sections: Record<string, string | string[]>
): void {
  if (typeof window === "undefined") return;

  const tier = getFlashTier();
  if (tier === "free") return;

  const entry: FlashHistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    topic,
    mode,
    savedAt: Date.now(),
    sections,
  };

  const existing = loadHistory();

  // Prepend the new entry and trim to MAX_ENTRIES
  const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
  saveHistory(updated);
}

/** Removes a single history entry by id. */
export function deleteFlashHistoryEntry(id: string): void {
  if (typeof window === "undefined") return;
  const entries = loadHistory().filter((e) => e.id !== id);
  saveHistory(entries);
}

/** Clears all Flash history. */
export function clearFlashHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}
