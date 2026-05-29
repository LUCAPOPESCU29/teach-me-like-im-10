"use client";
import PageTransition from "@/components/PageTransition";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import EmptyState from "@/components/EmptyState";
import { SkeletonCard } from "@/components/Skeleton";
import ActivityFeed from "@/components/ActivityFeed";

interface FriendProfile {
  id: string;
  displayName: string;
  totalXP: number;
}

export default function FriendsPage() {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"feed" | "following" | "followers">("feed");
  const [following, setFollowing] = useState<FriendProfile[]>([]);
  const [followers, setFollowers] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load localStorage follows for both guest and auth (as fallback)
    try {
      const stored = JSON.parse(localStorage.getItem("tmi10_follows") || "[]") as string[];
      if (stored.length > 0) {
        // Fetch profile info for stored follows
        import("@/lib/supabase/client").then(async ({ createClient }) => {
          try {
            const supabase = createClient();
            const { data } = await supabase
              .from("profiles")
              .select("id, display_name, total_xp")
              .in("id", stored);
            if (data && data.length > 0) {
              setFollowing(data.map((p) => ({
                id: p.id,
                displayName: p.display_name,
                totalXP: p.total_xp,
              })));
            }
          } catch {}
        });
      }
    } catch {}

    if (isGuest || !user) {
      setLoading(false);
      return;
    }

    fetch(`/api/friends?userId=${user.id}`)
      .then((r) => r.json())
      .then((friendsData) => {
        if (friendsData.following?.length) setFollowing(friendsData.following);
        setFollowers(friendsData.followers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, isGuest]);

  return (
    <PageTransition>
    <main className="min-h-screen max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => router.push("/")}
          className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans mb-4 inline-block"
        >
          &larr; Home
        </button>
        <h1 className="font-display text-3xl sm:text-4xl text-white">Friends</h1>
        <p className="text-white/30 text-sm font-sans mt-1">
          Follow learners and see what they&apos;re studying
        </p>
      </motion.div>

      {(() => {
        // Show content for both guest and auth
        return (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/5 w-fit">
            {(["feed", "following", "followers"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg font-sans text-sm transition-all capitalize ${
                  tab === t
                    ? "bg-white/10 text-white"
                    : "text-white/30 hover:text-white/50"
                }`}
              >
                {t}
                {t === "following" && following.length > 0 && (
                  <span className="ml-1.5 text-xs text-white/20">{following.length}</span>
                )}
                {t === "followers" && followers.length > 0 && (
                  <span className="ml-1.5 text-xs text-white/20">{followers.length}</span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : tab === "feed" ? (
            <ActivityFeed />
          ) : (
            // Following / Followers list
            (() => {
              const list = tab === "following" ? following : followers;
              if (list.length === 0) {
                return (
                  <EmptyState
                    illustration="search"
                    title={tab === "following" ? "Not following anyone yet" : "No followers yet"}
                    description={
                      tab === "following"
                        ? "Visit the leaderboard to find learners to follow!"
                        : "Keep learning and others will find you!"
                    }
                    action={tab === "following" ? { label: "Leaderboard", onClick: () => router.push("/leaderboard") } : undefined}
                  />
                );
              }
              return (
                <div className="space-y-2">
                  {list.map((person, i) => (
                    <motion.button
                      key={person.id}
                      onClick={() => router.push(`/profile/${person.id}`)}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition-all"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <span className="text-emerald-400 text-sm font-display">
                          {person.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-white/70 font-sans text-sm truncate">{person.displayName}</p>
                        <p className="text-white/25 text-xs font-mono">{person.totalXP} XP</p>
                      </div>
                      <span className="text-white/20 text-xs font-sans">&rarr;</span>
                    </motion.button>
                  ))}
                </div>
              );
            })()
          )}
        </>
        );
      })()}
    </main>
      </PageTransition>
  );
}
