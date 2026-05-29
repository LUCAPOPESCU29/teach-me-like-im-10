import { hasPerk, PERK } from "./perks";

const XP_KEY = "tmi10_xp";
const STREAK_KEY = "tmi10_streak";
const FREEZE_KEY = "tmi10_freezes";

export const FREEZE_COST = 100;
export const MAX_FREEZES = 3;

/** Apply Golden Touch perk (+50% XP) to positive amounts */
function applyGoldenTouch(amount: number): number {
  if (amount <= 0) return amount;
  if (hasPerk(PERK.GOLDEN_TOUCH)) return Math.floor(amount * 1.5);
  return amount;
}

export const XP_LEVELS = [
  { xp: 0, title: "Curious Mind" },
  { xp: 100, title: "Quick Learner" },
  { xp: 300, title: "Knowledge Seeker" },
  { xp: 600, title: "Deep Thinker" },
  { xp: 1000, title: "Topic Master" },
  { xp: 1500, title: "Polymath" },
  { xp: 2500, title: "Renaissance Mind" },
] as const;

export const LEVEL_XP = [0, 10, 20, 30, 40, 50] as const;

export interface StreakData {
  lastDate: string;
  count: number;
}

export interface XPState {
  totalXP: number;
  level: number;
  title: string;
  nextLevelXP: number;
  streak: number;
  freezes: number;
}

export interface AddXPResult {
  totalXP: number;
  xpGained: number;
  streak: number;
  levelUp: boolean;
  newTitle: string;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getLevel(xp: number): { level: number; title: string; nextLevelXP: number } {
  let level = 0;
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xp) {
      level = i;
      break;
    }
  }
  const next = level < XP_LEVELS.length - 1 ? XP_LEVELS[level + 1].xp : XP_LEVELS[level].xp;
  return { level: level + 1, title: XP_LEVELS[level].title, nextLevelXP: next };
}

function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { lastDate: "", count: 0 };
}

export function getGuestFreezes(): number {
  try {
    return parseInt(localStorage.getItem(FREEZE_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

function setGuestFreezes(count: number) {
  localStorage.setItem(FREEZE_KEY, String(count));
}

export function buyGuestFreeze(): boolean {
  if (hasPerk(PERK.FROST_TITAN)) return true; // unlimited
  const freezes = getGuestFreezes();
  if (freezes >= MAX_FREEZES) return false;
  const xp = parseInt(localStorage.getItem(XP_KEY) || "0", 10);
  if (xp < FREEZE_COST) return false;
  localStorage.setItem(XP_KEY, String(xp - FREEZE_COST));
  setGuestFreezes(freezes + 1);
  return true;
}

function consumeGuestFreeze(): boolean {
  if (hasPerk(PERK.FROST_TITAN)) return true; // unlimited
  const freezes = getGuestFreezes();
  if (freezes <= 0) return false;
  setGuestFreezes(freezes - 1);
  return true;
}

function updateStreak(): number {
  const streak = getStreak();
  const today = todayStr();

  if (streak.lastDate === today) return streak.count;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (streak.lastDate === yesterdayStr) {
    // Continue streak
    const newCount = streak.count + 1;
    localStorage.setItem(STREAK_KEY, JSON.stringify({ lastDate: today, count: newCount }));
    return newCount;
  }

  // Missed a day — try to use a freeze
  if (streak.count > 0 && consumeGuestFreeze()) {
    // Freeze consumed, keep streak but update date
    localStorage.setItem(STREAK_KEY, JSON.stringify({ lastDate: today, count: streak.count }));
    return streak.count;
  }

  // Streak Shield perk: auto-freeze once per week
  if (streak.count > 0 && hasPerk(PERK.STREAK_SHIELD)) {
    const SHIELD_KEY = "tmi10_streak_shield_used";
    try {
      const lastUsed = localStorage.getItem(SHIELD_KEY) || "";
      const lastUsedDate = lastUsed ? new Date(lastUsed) : new Date(0);
      const now = new Date();
      // Check if 7 days have passed since last use
      const daysSince = Math.floor((now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince >= 7) {
        localStorage.setItem(SHIELD_KEY, today);
        localStorage.setItem(STREAK_KEY, JSON.stringify({ lastDate: today, count: streak.count }));
        return streak.count;
      }
    } catch {}
  }

  // No freeze — reset streak
  localStorage.setItem(STREAK_KEY, JSON.stringify({ lastDate: today, count: 1 }));
  return 1;
}

export function getXP(): XPState {
  if (typeof window === "undefined") {
    return { totalXP: 0, level: 1, title: "Curious Mind", nextLevelXP: 100, streak: 0, freezes: 0 };
  }
  const totalXP = parseInt(localStorage.getItem(XP_KEY) || "0", 10);
  const { level, title, nextLevelXP } = getLevel(totalXP);
  const streak = getStreak();
  const freezes = getGuestFreezes();

  // Check if streak is still valid (today or yesterday)
  const today = todayStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const validStreak =
    streak.lastDate === today || streak.lastDate === yesterdayStr ? streak.count : 0;

  return { totalXP, level, title, nextLevelXP, streak: validStreak, freezes: hasPerk(PERK.FROST_TITAN) ? 99 : freezes };
}

export function addXP(amount: number): AddXPResult {
  const oldXP = parseInt(localStorage.getItem(XP_KEY) || "0", 10);
  const oldLevel = getLevel(oldXP);

  const boosted = applyGoldenTouch(amount);
  const newXP = oldXP + boosted;
  localStorage.setItem(XP_KEY, String(newXP));

  const newLevel = getLevel(newXP);
  const streak = updateStreak();
  const levelUp = newLevel.level > oldLevel.level;

  return {
    totalXP: newXP,
    xpGained: boosted,
    streak,
    levelUp,
    newTitle: newLevel.title,
  };
}

export function getQuizXP(score: number, total: number): number {
  const pct = (score / total) * 100;
  let base = 15;
  if (pct >= 80) base = 50;
  else if (pct >= 60) base = 30;
  if (hasPerk(PERK.QUIZ_SCHOLAR)) base = Math.floor(base * 1.25);
  return base;
}

export function getTeachBackXP(score: number): number {
  let base = 15;
  if (score >= 80) base = 75;
  else if (score >= 60) base = 40;
  if (hasPerk(PERK.QUIZ_SCHOLAR)) base = Math.floor(base * 1.25);
  return base;
}
