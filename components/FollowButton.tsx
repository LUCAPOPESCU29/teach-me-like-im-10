"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";

const GUEST_FOLLOWS_KEY = "tmi10_follows";

function getGuestFollows(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(GUEST_FOLLOWS_KEY) || "[]");
  } catch {
    return [];
  }
}

function setGuestFollows(ids: string[]) {
  localStorage.setItem(GUEST_FOLLOWS_KEY, JSON.stringify(ids));
}

export default function FollowButton({ targetUserId }: { targetUserId: string }) {
  const { user, isGuest } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const isOwnProfile = user?.id === targetUserId;

  useEffect(() => {
    if (isOwnProfile) {
      setLoading(false);
      return;
    }

    if (isGuest) {
      // Guest mode — use localStorage
      const follows = getGuestFollows();
      setFollowing(follows.includes(targetUserId));
      setLoading(false);
      return;
    }

    // Authenticated — check via API, fallback to localStorage if API fails
    fetch(`/api/friends?check=${targetUserId}`)
      .then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      })
      .then((d) => {
        setFollowing(d.following);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to localStorage if table doesn't exist yet
        const follows = getGuestFollows();
        setFollowing(follows.includes(targetUserId));
        setLoading(false);
      });
  }, [targetUserId, isGuest, isOwnProfile]);

  const handleToggle = useCallback(async () => {
    setActing(true);
    const newState = !following;

    // Always update localStorage as source of truth / fallback
    const follows = getGuestFollows();
    if (newState) {
      if (!follows.includes(targetUserId)) {
        follows.push(targetUserId);
      }
    } else {
      const idx = follows.indexOf(targetUserId);
      if (idx !== -1) follows.splice(idx, 1);
    }
    setGuestFollows(follows);
    setFollowing(newState);

    // Also try API for authenticated users
    if (!isGuest) {
      try {
        await fetch("/api/friends", {
          method: newState ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followingId: targetUserId }),
        });
      } catch {
        // API failed but localStorage already updated — that's fine
      }
    }

    setActing(false);
  }, [following, targetUserId, isGuest]);

  if (isOwnProfile || loading) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={acting}
      className={`px-4 py-1.5 rounded-lg border font-sans text-xs transition-all ${
        following
          ? "border-white/10 text-white/40 hover:border-red-500/30 hover:text-red-400/70"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
      } ${acting ? "opacity-50" : ""}`}
    >
      {acting ? "..." : following ? "Following" : "Follow"}
    </button>
  );
}
