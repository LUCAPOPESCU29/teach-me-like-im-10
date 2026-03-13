"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createGuestDataLayer,
  createAuthDataLayer,
  type DataLayer,
} from "@/lib/data";
import { unslugify, LANGUAGES } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  isLoading: boolean;
  data: DataLayer;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const guestData = createGuestDataLayer();

const AuthContext = createContext<AuthContextType>({
  user: null,
  isGuest: true,
  isLoading: true,
  data: guestData,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DataLayer>(guestData);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        setData(createAuthDataLayer(supabase, user.id));
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        setData(createAuthDataLayer(supabase, newUser.id));
      } else {
        setData(guestData);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      return {};
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const { error, data: authData } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) return { error: error.message };

      // Migrate guest data to the new account
      if (authData.user) {
        await migrateGuestData(authData.user.id);
      }

      return {};
    },
    [supabase]
  );

  const migrateGuestData = useCallback(
    async (userId: string) => {
      if (typeof window === "undefined") return;

      // Migrate XP + streak
      const guestXP = parseInt(localStorage.getItem("tmi10_xp") || "0", 10);
      const guestStreakRaw = localStorage.getItem("tmi10_streak");
      const guestStreak = guestStreakRaw
        ? JSON.parse(guestStreakRaw)
        : { lastDate: "", count: 0 };
      const guestLang = localStorage.getItem("tmi10_lang") || "en";

      if (guestXP > 0 || guestStreak.count > 0) {
        await supabase
          .from("profiles")
          .update({
            total_xp: guestXP,
            streak_count: guestStreak.count,
            streak_last_date: guestStreak.lastDate || null,
            lang: guestLang,
          })
          .eq("id", userId);
      }

      // Migrate cached topic levels
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          !key ||
          !key.startsWith("tmi10_") ||
          ["tmi10_xp", "tmi10_streak", "tmi10_lang"].includes(key)
        )
          continue;

        const raw = key.replace("tmi10_", "");
        const langCodes = LANGUAGES.map((l) => l.code).filter((c) => c !== "en");
        const langPrefixMatch = raw.match(
          new RegExp(`^(${langCodes.join("|")})_(.+)$`)
        );

        let topicSlug: string;
        let topicLang: string;
        if (langPrefixMatch) {
          topicLang = langPrefixMatch[1];
          topicSlug = langPrefixMatch[2];
        } else {
          topicLang = "en";
          topicSlug = raw;
        }

        try {
          const levels = JSON.parse(localStorage.getItem(key) || "[]");
          if (levels.length === 0) continue;

          const maxLevel = Math.max(
            ...levels
              .filter((l: { complete: boolean }) => l.complete)
              .map((l: { level: number }) => l.level),
            0
          );

          await supabase.from("topic_progress").upsert(
            {
              user_id: userId,
              slug: topicSlug,
              topic_name: unslugify(topicSlug),
              lang: topicLang,
              levels,
              max_level: maxLevel,
            },
            { onConflict: "user_id,slug,lang" }
          );
        } catch {}

        keysToRemove.push(key);
      }

      // Clear localStorage
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem("tmi10_xp");
      localStorage.removeItem("tmi10_streak");
      localStorage.removeItem("tmi10_lang");
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setData(guestData);
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest: !user,
        isLoading,
        data,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
