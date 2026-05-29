import type { SupabaseClient } from "@supabase/supabase-js";
import { unslugify } from "./utils";
import type { XPState, AddXPResult } from "./xp";
import {
  getXP as guestGetXP,
  addXP as guestAddXP,
  XP_LEVELS,
  getQuizXP,
  getTeachBackXP,
  FREEZE_COST,
  MAX_FREEZES,
  buyGuestFreeze,
  getGuestFreezes,
} from "./xp";
import { hasPerk, PERK } from "./perks";

export { getQuizXP, getTeachBackXP };

export interface LevelData {
  level: number;
  content: string;
  complete: boolean;
}

export interface TopicHistoryItem {
  slug: string;
  topicName: string;
  lang: string;
  maxLevel: number;
  updatedAt: string;
}

export interface XPEvent {
  amount: number;
  source: string;
  topicSlug?: string;
  createdAt: string;
}

export interface ActivityDay {
  date: string;
  count: number;
}

export interface WeeklyGoal {
  weekStart: string;
  topicsGoal: number;
  topicsCompleted: number;
  xpGoal: number;
  xpEarned: number;
  quizzesGoal: number;
  quizzesCompleted: number;
}

function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().slice(0, 10);
}

export interface DataLayer {
  getXP(): Promise<XPState>;
  addXP(amount: number, source?: string, topicSlug?: string): Promise<AddXPResult>;
  getTopicLevels(slug: string, lang: string): Promise<LevelData[]>;
  saveTopicLevels(slug: string, lang: string, levels: LevelData[], topicName?: string): Promise<void>;
  getLang(): string;
  setLang(code: string): void;
  // New methods for features
  getTopicHistory(): Promise<TopicHistoryItem[]>;
  getXPHistory(days: number): Promise<XPEvent[]>;
  getActivityMap(days: number): Promise<ActivityDay[]>;
  addBookmark(slug: string, topicName: string, lang: string): Promise<void>;
  removeBookmark(slug: string): Promise<void>;
  getBookmarks(): Promise<{ slug: string; topicName: string; lang: string; createdAt: string }[]>;
  isBookmarked(slug: string): Promise<boolean>;
  buyFreeze(): Promise<boolean>;
  getWeeklyGoal(): Promise<WeeklyGoal | null>;
  setWeeklyGoal(goals: { topicsGoal: number; xpGoal: number; quizzesGoal: number }): Promise<void>;
  hasActivityToday(): Promise<boolean>;
  getBadgeData(): Promise<{
    totalXP: number;
    streakCount: number;
    topicsExplored: number;
    maxLevelReached: number;
    quizAced: boolean;
    teachBackPassed: boolean;
    languagesUsed: number;
    topicsInOneDay: number;
    allFiveLevels: boolean;
  }>;
}

// ---- Guest mode: wraps existing localStorage functions ----

const STORAGE_PREFIX = "tmi10_";
const LANG_KEY = "tmi10_lang";

function cacheKey(slug: string, lang: string): string {
  return lang === "en"
    ? `${STORAGE_PREFIX}${slug}`
    : `${STORAGE_PREFIX}${lang}_${slug}`;
}

const EXCLUDED_KEYS = new Set([
  "tmi10_xp", "tmi10_streak", "tmi10_lang", "tmi10_bookmarks", "tmi10_badges",
  "tmi10_weekly_goal", "tmi10_weekly_goal_auth", "tmi10_visited_features",
  "tmi10_accent_color", "tmi10_ghost_mode", "tmi10_font", "tmi10_text_size",
  "tmi10_animations_disabled", "tmi10_streak_reminders_off", "tmi10_goal_reminders_off",
  "tmi10_combo_hidden", "tmi10_seasonal_off", "tmi10_autoplay", "tmi10_xp_toasts_off",
  "tmi10_onboarding_done", "tmi10_study_stats", "tmi10_learning_time",
  "tmi10_combo_session", "tmi10_active_title", "tmi10_follows", "tmi10_wager_history",
  "tmi10_speedruns", "tmi10_explorations", "tmi10_wop_stats", "tmi10_xp_history",
  "tmi10_sound_muted", "tmi10_profile_custom", "tmi10_daily_reward",
  "tmi10_daily_spin", "tmi10_streak_freezes", "tmi10_session_summary",
  "tmi10_debate_history", "tmi10_notes", "tmi10_flashcards", "tmi10_journal",
  "tmi10_dna", "tmi10_compare_history",
  "tmi10_shop_purchases", "tmi10_active_effect", "tmi10_xp_boost",
  "tmi10_freezes", "tmi10_title_data", "tmi10_blackjack_stats",
  "tmi10_active_perks", "tmi10_xp_gen_last", "tmi10_streak_shield_used", "tmi10_daily_topics", "tmi10_is_pro",
]);

function getGuestTopicKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(STORAGE_PREFIX) || EXCLUDED_KEYS.has(key)) continue;
    // Skip keys that contain underscores after the prefix (likely settings, not topics)
    // Topic keys are like tmi10_quantum-physics or tmi10_es_quantum-physics
    const afterPrefix = key.slice(STORAGE_PREFIX.length);
    // Allow lang prefix pattern: 2-letter-code underscore then slug (e.g. es_topic)
    const langMatch = afterPrefix.match(/^[a-z]{2}_(.+)$/);
    const slug = langMatch ? langMatch[1] : afterPrefix;
    // Skip if slug contains underscores (non-topic keys we missed)
    if (slug.includes("_")) continue;
    // Skip very short slugs (likely not real topics)
    if (slug.length < 3) continue;
    keys.push(key);
  }
  return keys;
}

const GUEST_BOOKMARKS_KEY = "tmi10_bookmarks";
const GUEST_BADGE_KEY = "tmi10_badges";

export function createGuestDataLayer(): DataLayer {
  return {
    async getXP() {
      return guestGetXP();
    },
    async addXP(amount: number) {
      // Track badge data for guests
      try {
        const raw = localStorage.getItem(GUEST_BADGE_KEY);
        const bd = raw ? JSON.parse(raw) : { quizAced: false, teachBackPassed: false, topicsToday: [] };
        const today = new Date().toISOString().slice(0, 10);
        if (!bd.topicsToday) bd.topicsToday = [];
        localStorage.setItem(GUEST_BADGE_KEY, JSON.stringify(bd));
      } catch {}
      return guestAddXP(amount);
    },
    async getTopicLevels(slug: string, lang: string) {
      if (typeof window === "undefined") return [];
      try {
        const cached = localStorage.getItem(cacheKey(slug, lang));
        return cached ? JSON.parse(cached) : [];
      } catch {
        return [];
      }
    },
    async saveTopicLevels(slug: string, lang: string, levels: LevelData[]) {
      try {
        localStorage.setItem(cacheKey(slug, lang), JSON.stringify(levels));
      } catch {}
    },
    getLang() {
      if (typeof window === "undefined") return "en";
      return localStorage.getItem(LANG_KEY) || "en";
    },
    setLang(code: string) {
      localStorage.setItem(LANG_KEY, code);
    },
    async getTopicHistory() {
      if (typeof window === "undefined") return [];
      const items: TopicHistoryItem[] = [];
      const seen = new Set<string>();
      const keys = getGuestTopicKeys();
      for (const key of keys) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          // Validate it's actually a LevelData array (not some other JSON object)
          if (!Array.isArray(parsed)) continue;
          if (parsed.length === 0) continue;
          // Must have at least one item with a "level" and "content" field
          if (typeof parsed[0].level !== "number" || typeof parsed[0].content !== "string") continue;
          const levels = parsed as LevelData[];
          const slug = key.replace(STORAGE_PREFIX, "").replace(/^[a-z]{2}_/, "");
          // Skip very short slugs that are likely not real topics
          if (slug.length < 2) continue;
          const langMatch = key.match(new RegExp(`^${STORAGE_PREFIX}([a-z]{2})_`));
          const lang = langMatch ? langMatch[1] : "en";
          // Deduplicate by normalized slug (lowercase, trimmed)
          const normalizedSlug = slug.toLowerCase().trim();
          if (seen.has(normalizedSlug)) continue;
          seen.add(normalizedSlug);
          const maxLevel = Math.max(...levels.filter(l => l.complete).map(l => l.level), 0);
          const topicName = unslugify(slug);
          items.push({ slug, topicName, lang, maxLevel, updatedAt: new Date().toISOString() });
        } catch {}
      }
      return items;
    },
    async getXPHistory() { return []; },
    async getActivityMap() { return []; },
    async hasActivityToday() {
      if (typeof window === "undefined") return false;
      try {
        const raw = localStorage.getItem("tmi10_streak");
        if (!raw) return false;
        const streak = JSON.parse(raw) as { lastDate: string; count: number };
        return streak.lastDate === new Date().toISOString().slice(0, 10);
      } catch { return false; }
    },
    async addBookmark(slug: string, topicName: string, lang: string) {
      try {
        const raw = localStorage.getItem(GUEST_BOOKMARKS_KEY);
        const bookmarks = raw ? JSON.parse(raw) : [];
        if (!bookmarks.find((b: { slug: string }) => b.slug === slug)) {
          bookmarks.push({ slug, topicName, lang, createdAt: new Date().toISOString() });
          localStorage.setItem(GUEST_BOOKMARKS_KEY, JSON.stringify(bookmarks));
        }
      } catch {}
    },
    async removeBookmark(slug: string) {
      try {
        const raw = localStorage.getItem(GUEST_BOOKMARKS_KEY);
        const bookmarks = raw ? JSON.parse(raw) : [];
        localStorage.setItem(GUEST_BOOKMARKS_KEY, JSON.stringify(bookmarks.filter((b: { slug: string }) => b.slug !== slug)));
      } catch {}
    },
    async getBookmarks() {
      try {
        const raw = localStorage.getItem(GUEST_BOOKMARKS_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    },
    async isBookmarked(slug: string) {
      try {
        const raw = localStorage.getItem(GUEST_BOOKMARKS_KEY);
        const bookmarks = raw ? JSON.parse(raw) : [];
        return bookmarks.some((b: { slug: string }) => b.slug === slug);
      } catch { return false; }
    },
    async getWeeklyGoal() {
      if (typeof window === "undefined") return null;
      try {
        const raw = localStorage.getItem("tmi10_weekly_goal");
        if (!raw) return null;
        const stored = JSON.parse(raw);
        const currentMonday = getCurrentWeekMonday();
        if (stored.weekStart !== currentMonday) return null;
        // Compute progress dynamically
        const topicKeys = getGuestTopicKeys();
        const topicsCompleted = Math.max(topicKeys.length - (stored.topicsAtStart || 0), 0);
        const xpState = guestGetXP();
        const xpEarned = Math.max(xpState.totalXP - (stored.xpAtStart || 0), 0);
        return {
          weekStart: stored.weekStart,
          topicsGoal: stored.topicsGoal,
          topicsCompleted,
          xpGoal: stored.xpGoal,
          xpEarned,
          quizzesGoal: stored.quizzesGoal,
          quizzesCompleted: 0,
        };
      } catch { return null; }
    },
    async setWeeklyGoal(goals: { topicsGoal: number; xpGoal: number; quizzesGoal: number }) {
      const topicKeys = getGuestTopicKeys();
      const xpState = guestGetXP();
      const stored = {
        weekStart: getCurrentWeekMonday(),
        topicsGoal: goals.topicsGoal,
        xpGoal: goals.xpGoal,
        quizzesGoal: goals.quizzesGoal,
        topicsAtStart: topicKeys.length,
        xpAtStart: xpState.totalXP,
      };
      localStorage.setItem("tmi10_weekly_goal", JSON.stringify(stored));
    },
    async buyFreeze() {
      return buyGuestFreeze();
    },
    async getBadgeData() {
      const topics = await this.getTopicHistory();
      const xp = guestGetXP();
      const langs = new Set(topics.map(t => t.lang));
      const hasAllFive = topics.some(t => t.maxLevel >= 5);
      let bd = { quizAced: false, teachBackPassed: false };
      try {
        const raw = localStorage.getItem(GUEST_BADGE_KEY);
        if (raw) bd = JSON.parse(raw);
      } catch {}
      return {
        totalXP: xp.totalXP,
        streakCount: xp.streak,
        topicsExplored: topics.length,
        maxLevelReached: Math.max(...topics.map(t => t.maxLevel), 0),
        quizAced: bd.quizAced,
        teachBackPassed: bd.teachBackPassed,
        languagesUsed: langs.size,
        topicsInOneDay: 0,
        allFiveLevels: hasAllFive,
      };
    },
  };
}

// ---- Authenticated mode: uses Supabase ----

function getLevel(xp: number): { level: number; title: string; nextLevelXP: number } {
  let lvl = 0;
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xp) {
      lvl = i;
      break;
    }
  }
  const next =
    lvl < XP_LEVELS.length - 1 ? XP_LEVELS[lvl + 1].xp : XP_LEVELS[lvl].xp;
  return { level: lvl + 1, title: XP_LEVELS[lvl].title, nextLevelXP: next };
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createAuthDataLayer(
  supabase: SupabaseClient,
  userId: string
): DataLayer {
  return {
    async getXP() {
      const { data } = await supabase
        .from("profiles")
        .select("total_xp, streak_count, streak_last_date, lang, streak_freezes")
        .eq("id", userId)
        .single();

      if (!data) {
        return { totalXP: 0, level: 1, title: "Curious Mind", nextLevelXP: 100, streak: 0, freezes: 0 };
      }

      const { level, title, nextLevelXP } = getLevel(data.total_xp);
      const today = todayStr();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      const freezes = data.streak_freezes || 0;

      let validStreak = 0;
      if (data.streak_last_date === today || data.streak_last_date === yStr) {
        validStreak = data.streak_count;
      } else if (data.streak_count > 0 && freezes > 0) {
        // Streak would expire — auto-consume a freeze to save it
        await supabase
          .from("profiles")
          .update({
            streak_freezes: freezes - 1,
            streak_last_date: yStr, // Bridge the gap
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        validStreak = data.streak_count;
        return { totalXP: data.total_xp, level, title, nextLevelXP, streak: validStreak, freezes: freezes - 1 };
      }

      return { totalXP: data.total_xp, level, title, nextLevelXP, streak: validStreak, freezes };
    },

    async addXP(amount: number, source?: string, topicSlug?: string) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_xp, streak_count, streak_last_date, streak_freezes")
        .eq("id", userId)
        .single();

      const oldXP = profile?.total_xp || 0;
      const oldLevel = getLevel(oldXP);
      // Apply Golden Touch perk (+50% XP) — same logic as guest addXP in xp.ts
      const boosted =
        amount > 0 && hasPerk(PERK.GOLDEN_TOUCH) ? Math.floor(amount * 1.5) : amount;
      const newXP = oldXP + boosted;
      const newLevel = getLevel(newXP);

      const today = todayStr();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);

      let newStreak = 1;
      let freezesUsed = 0;
      if (profile?.streak_last_date === today) {
        newStreak = profile.streak_count;
      } else if (profile?.streak_last_date === yStr) {
        newStreak = (profile.streak_count || 0) + 1;
      } else if ((profile?.streak_count || 0) > 0 && (profile?.streak_freezes || 0) > 0) {
        // Missed day(s) but have a freeze — preserve streak
        newStreak = (profile?.streak_count || 0) + 1;
        freezesUsed = 1;
      }

      await supabase
        .from("profiles")
        .update({
          total_xp: newXP,
          streak_count: newStreak,
          streak_last_date: today,
          streak_freezes: Math.max((profile?.streak_freezes || 0) - freezesUsed, 0),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      // Log XP event for history
      await supabase.from("xp_events").insert({
        user_id: userId,
        amount,
        source: source || "level",
        topic_slug: topicSlug || null,
      });

      return {
        totalXP: newXP,
        xpGained: boosted,
        streak: newStreak,
        levelUp: newLevel.level > oldLevel.level,
        newTitle: newLevel.title,
      };
    },

    async buyFreeze() {
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_xp, streak_freezes")
        .eq("id", userId)
        .single();

      if (!profile) return false;
      if (profile.total_xp < FREEZE_COST) return false;
      if ((profile.streak_freezes || 0) >= MAX_FREEZES) return false;

      await supabase
        .from("profiles")
        .update({
          total_xp: profile.total_xp - FREEZE_COST,
          streak_freezes: (profile.streak_freezes || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      return true;
    },

    async getWeeklyGoal() {
      if (typeof window === "undefined") return null;
      try {
        const raw = localStorage.getItem("tmi10_weekly_goal_auth");
        if (!raw) return null;
        const stored = JSON.parse(raw);
        const currentMonday = getCurrentWeekMonday();
        if (stored.weekStart !== currentMonday) return null;

        // Compute progress from Supabase
        const mondayISO = `${currentMonday}T00:00:00.000Z`;

        const [topicsRes, xpRes, quizRes] = await Promise.all([
          supabase
            .from("topic_progress")
            .select("slug", { count: "exact" })
            .eq("user_id", userId)
            .gte("updated_at", mondayISO),
          supabase
            .from("xp_events")
            .select("amount")
            .eq("user_id", userId)
            .gte("created_at", mondayISO),
          supabase
            .from("xp_events")
            .select("id", { count: "exact" })
            .eq("user_id", userId)
            .like("source", "quiz%")
            .gte("created_at", mondayISO),
        ]);

        const topicsCompleted = topicsRes.count || 0;
        const xpEarned = (xpRes.data || []).reduce((sum, e) => sum + e.amount, 0);
        const quizzesCompleted = quizRes.count || 0;

        return {
          weekStart: stored.weekStart,
          topicsGoal: stored.topicsGoal,
          topicsCompleted,
          xpGoal: stored.xpGoal,
          xpEarned,
          quizzesGoal: stored.quizzesGoal,
          quizzesCompleted,
        };
      } catch { return null; }
    },

    async setWeeklyGoal(goals: { topicsGoal: number; xpGoal: number; quizzesGoal: number }) {
      const stored = {
        weekStart: getCurrentWeekMonday(),
        topicsGoal: goals.topicsGoal,
        xpGoal: goals.xpGoal,
        quizzesGoal: goals.quizzesGoal,
      };
      localStorage.setItem("tmi10_weekly_goal_auth", JSON.stringify(stored));
    },

    async hasActivityToday() {
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak_last_date")
        .eq("id", userId)
        .single();
      return profile?.streak_last_date === todayStr();
    },

    async getTopicLevels(slug: string, lang: string) {
      const { data } = await supabase
        .from("topic_progress")
        .select("levels")
        .eq("user_id", userId)
        .eq("slug", slug)
        .eq("lang", lang)
        .single();

      return (data?.levels as LevelData[]) || [];
    },

    async saveTopicLevels(slug: string, lang: string, levels: LevelData[], topicName?: string) {
      const maxLevel = Math.max(
        ...levels.filter((l) => l.complete).map((l) => l.level),
        0
      );

      await supabase.from("topic_progress").upsert(
        {
          user_id: userId,
          slug,
          topic_name: topicName || slug,
          lang,
          levels,
          max_level: maxLevel,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,slug,lang" }
      );
    },

    getLang() {
      // Cached in AuthProvider state; this is a sync fallback
      if (typeof window === "undefined") return "en";
      return localStorage.getItem(LANG_KEY) || "en";
    },

    setLang(code: string) {
      // Update both localStorage (for fast reads) and DB
      localStorage.setItem(LANG_KEY, code);
      supabase
        .from("profiles")
        .update({ lang: code, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .then(() => {});
    },

    async getTopicHistory() {
      const { data } = await supabase
        .from("topic_progress")
        .select("slug, topic_name, lang, max_level, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      return (data || []).map((d) => ({
        slug: d.slug,
        topicName: d.topic_name,
        lang: d.lang,
        maxLevel: d.max_level,
        updatedAt: d.updated_at,
      }));
    },

    async getXPHistory(days: number) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data } = await supabase
        .from("xp_events")
        .select("amount, source, topic_slug, created_at")
        .eq("user_id", userId)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false });
      return (data || []).map((d) => ({
        amount: d.amount,
        source: d.source,
        topicSlug: d.topic_slug,
        createdAt: d.created_at,
      }));
    },

    async getActivityMap(days: number) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data } = await supabase
        .from("xp_events")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", since.toISOString());
      // Group by date
      const map: Record<string, number> = {};
      for (const row of data || []) {
        const date = row.created_at.slice(0, 10);
        map[date] = (map[date] || 0) + 1;
      }
      return Object.entries(map).map(([date, count]) => ({ date, count }));
    },

    async addBookmark(slug: string, topicName: string, lang: string) {
      await supabase.from("bookmarks").upsert(
        { user_id: userId, topic_slug: slug, topic_name: topicName, lang },
        { onConflict: "user_id,topic_slug" }
      );
    },

    async removeBookmark(slug: string) {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("topic_slug", slug);
    },

    async getBookmarks() {
      const { data } = await supabase
        .from("bookmarks")
        .select("topic_slug, topic_name, lang, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      return (data || []).map((d) => ({
        slug: d.topic_slug,
        topicName: d.topic_name,
        lang: d.lang,
        createdAt: d.created_at,
      }));
    },

    async isBookmarked(slug: string) {
      const { data } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", userId)
        .eq("topic_slug", slug)
        .single();
      return !!data;
    },

    async getBadgeData() {
      const [topics, xpState, xpEvents] = await Promise.all([
        this.getTopicHistory(),
        this.getXP(),
        this.getXPHistory(365),
      ]);
      const langs = new Set(topics.map((t) => t.lang));
      const hasAllFive = topics.some((t) => t.maxLevel >= 5);
      const quizAced = xpEvents.some((e) => e.source === "quiz_ace");
      const teachBackPassed = xpEvents.some((e) => e.source === "teachback_pass");

      // Count topics per day
      const topicsPerDay: Record<string, Set<string>> = {};
      for (const e of xpEvents) {
        if (e.topicSlug && e.source === "level") {
          const day = e.createdAt.slice(0, 10);
          if (!topicsPerDay[day]) topicsPerDay[day] = new Set();
          topicsPerDay[day].add(e.topicSlug);
        }
      }
      const maxTopicsInDay = Math.max(
        ...Object.values(topicsPerDay).map((s) => s.size),
        0
      );

      return {
        totalXP: xpState.totalXP,
        streakCount: xpState.streak,
        topicsExplored: topics.length,
        maxLevelReached: Math.max(...topics.map((t) => t.maxLevel), 0),
        quizAced,
        teachBackPassed,
        languagesUsed: langs.size,
        topicsInOneDay: maxTopicsInDay,
        allFiveLevels: hasAllFive,
      };
    },
  };
}
