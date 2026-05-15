// Free tier limits — single source of truth

export const FREE_LIMITS = {
  topicsPerWindow: 2,
  windowMinutes: 45,
} as const;

// ── Storage keys ──────────────────────────────────────────────────────────────
const TOPICS_KEY    = "tmi10_topics_log";    // rolling window log
const PRO_KEY       = "tmi10_is_pro";        // legacy boolean
const PRO_EXPIRY_KEY = "tmi10_pro_expiry";   // Unix ms timestamp

interface TopicEntry { slug: string; ts: number }
interface TopicLog   { entries: TopicEntry[] }

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadLog(): TopicLog {
  if (typeof window === "undefined") return { entries: [] };
  try {
    const raw = localStorage.getItem(TOPICS_KEY);
    if (!raw) return { entries: [] };
    return JSON.parse(raw) as TopicLog;
  } catch { return { entries: [] }; }
}

function saveLog(log: TopicLog) {
  localStorage.setItem(TOPICS_KEY, JSON.stringify(log));
}

function windowCutoff(): number {
  return Date.now() - FREE_LIMITS.windowMinutes * 60 * 1000;
}

/** Entries within the current 45-minute rolling window */
function getRecentEntries(): TopicEntry[] {
  const log = loadLog();
  const cutoff = windowCutoff();
  return log.entries.filter(e => e.ts >= cutoff);
}

/** Unique slugs seen in the current window */
function getUniqueSlugsInWindow(): Set<string> {
  return new Set(getRecentEntries().map(e => e.slug));
}

// ── Pro status ─────────────────────────────────────────────────────────────────
/** Returns true if the user is on Pro (checks expiry) */
export function isPro(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const expiry = localStorage.getItem(PRO_EXPIRY_KEY);
    if (expiry) {
      const expiryMs = parseInt(expiry, 10);
      if (Date.now() < expiryMs) return true;
      localStorage.removeItem(PRO_EXPIRY_KEY);
    }
    if (localStorage.getItem(PRO_KEY) === "1") return true;
    return false;
  } catch { return false; }
}

/** Returns how many days of Pro remain (or Infinity for legacy pro) */
export function getProDaysRemaining(): number {
  if (typeof window === "undefined") return 0;
  try {
    if (localStorage.getItem(PRO_KEY) === "1") return Infinity;
    const expiry = localStorage.getItem(PRO_EXPIRY_KEY);
    if (!expiry) return 0;
    const ms = parseInt(expiry, 10) - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  } catch { return 0; }
}

/** Calculate Pro days from donation amount ($5 = 30 days) */
export function daysFromAmount(amount: number): number {
  return Math.round((amount / 5) * 30);
}

/** Activate Pro with an expiry timestamp */
export function activateProWithExpiry(expiresAt: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRO_EXPIRY_KEY, String(expiresAt));
  localStorage.removeItem(PRO_KEY);
}

// ── Topic counting ─────────────────────────────────────────────────────────────
/** How many unique topics opened in the current 45-min window */
export function getTopicsUsedToday(): number {
  return getUniqueSlugsInWindow().size;
}

/** How many new topics remain in the current window (Infinity for Pro) */
export function getTopicsRemaining(): number {
  if (isPro()) return Infinity;
  return Math.max(0, FREE_LIMITS.topicsPerWindow - getUniqueSlugsInWindow().size);
}

/**
 * Minutes until the oldest topic in the window expires and frees a slot.
 * Returns 0 if already have capacity.
 */
export function getMinutesUntilSlotFrees(): number {
  if (isPro()) return 0;
  const slugs = getUniqueSlugsInWindow();
  if (slugs.size < FREE_LIMITS.topicsPerWindow) return 0;
  const recent = getRecentEntries();
  if (recent.length === 0) return 0;
  const oldest = Math.min(...recent.map(e => e.ts));
  const expiresAt = oldest + FREE_LIMITS.windowMinutes * 60 * 1000;
  return Math.max(1, Math.ceil((expiresAt - Date.now()) / 60_000));
}

/**
 * Call before loading a topic.
 * Returns { allowed: true } or { allowed: false, used, limit }
 */
export function checkAndRecordTopic(slug: string): { allowed: boolean; used: number; limit: number } {
  if (isPro()) return { allowed: true, used: 0, limit: Infinity };

  const cutoff = windowCutoff();
  const log = loadLog();

  // Prune old entries first
  log.entries = log.entries.filter(e => e.ts >= cutoff);

  const uniqueInWindow = new Set(log.entries.map(e => e.slug));
  const limit = FREE_LIMITS.topicsPerWindow;

  // Already opened this topic in the current window → always allowed
  if (uniqueInWindow.has(slug)) {
    return { allowed: true, used: uniqueInWindow.size, limit };
  }

  const used = uniqueInWindow.size;

  if (used >= limit) {
    saveLog(log); // save the pruned log
    return { allowed: false, used, limit };
  }

  // Record the new topic
  log.entries.push({ slug, ts: Date.now() });
  saveLog(log);
  return { allowed: true, used: used + 1, limit };
}

/** Items that require Pro in the XP Shop */
export const PRO_SHOP_ITEMS = new Set([
  "perk_quiz_bonus",
  "perk_streak_shield",
  "perk_daily_bonus",
  "perk_lucky_spin",
  "perk_xp_passive",
  "perk_double_all",
  "perk_blackjack_edge",
  "perk_infinite_freeze",
  "perk_prestige",
]);
