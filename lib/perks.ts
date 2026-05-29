// Central perk system — check active perks from anywhere
const PERKS_KEY = "tmi10_active_perks";

export function getActivePerks(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(PERKS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function hasPerk(perkId: string): boolean {
  return getActivePerks().has(perkId);
}

export function savePerks(perks: Set<string>) {
  localStorage.setItem(PERKS_KEY, JSON.stringify([...perks]));
}

// Perk IDs
export const PERK = {
  QUIZ_SCHOLAR: "perk_quiz_bonus",       // +25% quiz XP
  STREAK_SHIELD: "perk_streak_shield",    // auto-freeze 1 missed day/week
  VIP_DAILY: "perk_daily_bonus",          // 2x daily login XP
  LUCKY_SPINNER: "perk_lucky_spin",       // 2 daily spins
  XP_GENERATOR: "perk_xp_passive",        // +5 XP/hour passive
  GOLDEN_TOUCH: "perk_double_all",        // +50% all XP
  CARD_COUNTER: "perk_blackjack_edge",    // blackjack hints
  FROST_TITAN: "perk_infinite_freeze",    // unlimited freezes
  PRESTIGE: "perk_prestige",              // golden profile
} as const;
