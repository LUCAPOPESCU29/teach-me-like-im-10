"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import LeaderboardTable from "@/components/LeaderboardTable";
import { createClient } from "@/lib/supabase/client";

interface LeaderboardEntry {
  display_name: string;
  total_xp: number;
  streak_count: number;
}

export default function LeaderboardPage() {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      const supabase = createClient();

      // Fetch top 50
      const { data: top } = await supabase
        .from("profiles")
        .select("display_name, total_xp, streak_count")
        .order("total_xp", { ascending: false })
        .limit(50);

      if (top) {
        setEntries(top);
      }

      // Fetch current user rank
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, total_xp, streak_count")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserEntry(profile);

          const { count } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .gt("total_xp", profile.total_xp);

          setUserRank((count ?? 0) + 1);
        }
      }

      setLoading(false);
    }

    fetchLeaderboard();
  }, [user]);

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans mb-2 inline-block"
            >
              ← Home
            </button>
            <h1 className="font-display text-3xl text-white">Leaderboard</h1>
            <p className="text-white/30 text-sm font-sans mt-1">
              Top learners by XP
            </p>
          </div>
          <div className="text-4xl">🏆</div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <LeaderboardTable
            entries={entries}
            currentUserId={user?.id}
            userRank={userRank}
            userEntry={userEntry}
          />
        )}

        {isGuest && (
          <motion.div
            className="mt-8 text-center p-6 rounded-xl border border-white/10 bg-white/[0.02]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-white/40 text-sm font-sans mb-3">
              Sign in to appear on the leaderboard
            </p>
            <button
              onClick={() => router.push("/auth/login")}
              className="px-6 py-2 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all font-sans text-sm"
            >
              Sign in
            </button>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
