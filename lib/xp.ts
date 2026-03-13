const XP_KEY = "tmi10_xp";
const STREAK_KEY = "tmi10_streak";
const FREEZE_KEY = "tmi10_freezes";

export const FREEZE_COST = 100;
export const MAX_FREEZES = 3;

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
  const freezes = getGuestFreezes();
  if (freezes >= MAX_FREEZES) return false;
  const xp = parseInt(localStorage.getItem(XP_KEY) || "0", 10);
  if (xp < FREEZE_COST) return false;
  localStorage.setItem(XP_KEY, String(xp - FREEZE_COST));
  setGuestFreezes(freezes + 1);
  return true;
}

function consumeGuestFreeze(): boolean {
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

  return { totalXP, level, title, nextLevelXP, streak: validStreak, freezes };
}

export function addXP(amount: number): AddXPResult {
  const oldXP = parseInt(localStorage.getItem(XP_KEY) || "0", 10);
  const oldLevel = getLevel(oldXP);

  const newXP = oldXP + amount;
  localStorage.setItem(XP_KEY, String(newXP));

  const newLevel = getLevel(newXP);
  const streak = updateStreak();
  const levelUp = newLevel.level > oldLevel.level;

  return {
    totalXP: newXP,
    xpGained: amount,
    streak,
    levelUp,
    newTitle: newLevel.title,
  };
}

export function getQuizXP(score: number, total: number): number {
  const pct = (score / total) * 100;
  if (pct >= 80) return 50;
  if (pct >= 60) return 30;
  return 15;
}

export function getTeachBackXP(score: number): number {
  if (score >= 80) return 75;
  if (score >= 60) return 40;
  return 15;
}
