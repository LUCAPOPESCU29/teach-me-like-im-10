// Flash subscription tier management — single source of truth

export type FlashTier = "free" | "pro" | "exec";

// ── Storage keys ──────────────────────────────────────────────────────────────
export const TIER_KEY   = "tmi10_flash_tier";        // "free" | "pro" | "exec"
export const EXPIRY_KEY = "tmi10_flash_tier_expiry"; // Unix ms
export const USAGE_KEY  = "tmi10_flash_ts";          // number[] — timestamps

// ── Plan definitions ──────────────────────────────────────────────────────────
export interface FlashPlan {
  limit: number;
  windowMs: number;
  windowLabel: string;
  priceMonthly: number;
}

export const FLASH_PLANS: Record<FlashTier, FlashPlan> = {
  free: {
    limit: 3,
    windowMs: 3_600_000, // 1 hour rolling
    windowLabel: "per hour",
    priceMonthly: 0,
  },
  pro: {
    limit: 25,
    windowMs: 86_400_000, // calendar day midnight UTC (handled separately)
    windowLabel: "per day",
    priceMonthly: 3.50,
  },
  exec: {
    limit: 190,
    windowMs: 43_200_000, // 12h rolling
    windowLabel: "per 12 hours",
    priceMonthly: 12.00,
  },
} as const;

// ── Public interface ──────────────────────────────────────────────────────────
export interface FlashUsageState {
  tier: FlashTier;
  remaining: number;
  used: number;
  total: number;
  windowLabel: string;
  /** Unix ms when the window resets, or null if unknown */
  windowResetMs: number | null;
  isPaid: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function readTimestamps(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as number[]) : [];
  } catch {
    return [];
  }
}

function writeTimestamps(ts: number[]): void {
  if (typeof window === "undefined") return;
  // Trim to max 1000 entries, keeping the newest
  const trimmed = ts.length > 1000 ? ts.slice(ts.length - 1000) : ts;
  localStorage.setItem(USAGE_KEY, JSON.stringify(trimmed));
}

/**
 * Returns the UTC midnight (start of day) timestamp for the *current* calendar day.
 */
function todayMidnightUTC(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/**
 * Returns the UTC midnight timestamp for the *next* calendar day.
 */
function tomorrowMidnightUTC(): number {
  return todayMidnightUTC() + 86_400_000;
}

// ── Tier persistence ──────────────────────────────────────────────────────────

/** Reads tier + expiry from localStorage; falls back to "free" if expired or missing. */
export function getFlashTier(): FlashTier {
  if (typeof window === "undefined") return "free";
  try {
    const tier = localStorage.getItem(TIER_KEY) as FlashTier | null;
    if (!tier || (tier !== "pro" && tier !== "exec")) return "free";

    const expiryRaw = localStorage.getItem(EXPIRY_KEY);
    if (!expiryRaw) return "free";

    const expiry = parseInt(expiryRaw, 10);
    if (isNaN(expiry) || Date.now() >= expiry) {
      // Subscription expired — clean up
      localStorage.removeItem(TIER_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      return "free";
    }

    return tier;
  } catch {
    return "free";
  }
}

/** Returns the Unix ms expiry timestamp, or null if none is stored / user is free. */
export function getFlashTierExpiry(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EXPIRY_KEY);
    if (!raw) return null;
    const ms = parseInt(raw, 10);
    return isNaN(ms) ? null : ms;
  } catch {
    return null;
  }
}

/** Returns how many whole days remain on the active subscription (0 if free/expired). */
export function getFlashTierDaysRemaining(): number {
  const expiry = getFlashTierExpiry();
  if (expiry === null) return 0;
  const ms = expiry - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/** Writes tier + expiry to localStorage. */
export function activateFlashTier(tier: FlashTier, expiresAt: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TIER_KEY, tier);
  localStorage.setItem(EXPIRY_KEY, String(expiresAt));
}

// ── Usage tracking ────────────────────────────────────────────────────────────

/** Appends the current timestamp to the usage log (trimmed to max 1000 entries). */
export function recordFlashUsage(): void {
  if (typeof window === "undefined") return;
  const ts = readTimestamps();
  ts.push(Date.now());
  writeTimestamps(ts);
}

/**
 * Returns full usage state for the current tier.
 *
 * Window semantics:
 *  - "pro":  calendar day UTC (midnight → next midnight)
 *  - "exec": rolling 12-hour window
 *  - "free": rolling 1-hour window
 */
export function getFlashUsageState(): FlashUsageState {
  const tier = getFlashTier();
  const plan = FLASH_PLANS[tier];
  const allTs = readTimestamps();
  const now = Date.now();

  let windowStart: number;
  let windowResetMs: number | null;

  if (tier === "pro") {
    // Calendar day window: from today's midnight UTC
    windowStart = todayMidnightUTC();
    windowResetMs = tomorrowMidnightUTC();
  } else {
    // Rolling window for "free" (1h) and "exec" (12h)
    windowStart = now - plan.windowMs;
    // Reset is when the *oldest* usage in window falls off — or null if no usage
    const inWindow = allTs.filter((t) => t >= windowStart);
    if (inWindow.length >= plan.limit) {
      const oldest = Math.min(...inWindow);
      windowResetMs = oldest + plan.windowMs;
    } else {
      windowResetMs = null;
    }
  }

  const used = allTs.filter((t) => t >= windowStart).length;
  const remaining = Math.max(0, plan.limit - used);

  return {
    tier,
    remaining,
    used,
    total: plan.limit,
    windowLabel: plan.windowLabel,
    windowResetMs,
    isPaid: tier !== "free",
  };
}

/** Returns true if the user is allowed to make another Flash request right now. */
export function checkFlashAllowed(): boolean {
  return getFlashUsageState().remaining > 0;
}
