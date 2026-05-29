"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface XpEvent {
  amount: number;
  source: string;
  topic_slug: string | null;
  created_at: string;
}

interface Topic {
  topic_name: string;
  slug: string;
  max_level: number;
  updated_at: string;
}

interface UserDetail {
  id: string;
  email: string;
  createdAt: string;
  profile: {
    display_name: string;
    total_xp: number;
    streak_count: number;
    streak_freezes: number;
    lang: string;
  } | null;
  xpEvents: XpEvent[];
  topics: Topic[];
  pro: {
    isPro: boolean;
    daysLeft: number;
    expiresAt: string | null;
    amount: number | null;
    daysGranted: number | null;
    lastPayment: string | null;
    source: string | null;
  };
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grantDays, setGrantDays] = useState(30);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/user/${id}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else setUser(data);
    } catch {
      setError("Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleGrantPro = async () => {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/user/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grant", days: grantDays }),
      });
      const data = await res.json();
      if (data.error) {
        setActionMsg(`Error: ${data.error}`);
      } else {
        setActionMsg(`Pro granted until ${new Date(data.proExpiresAt).toLocaleDateString()}`);
        fetchUser();
      }
    } catch {
      setActionMsg("Request failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokePro = async () => {
    if (!confirm("Revoke Pro access for this user?")) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/user/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) {
        setActionMsg(`Error: ${data.error}`);
      } else {
        setActionMsg("Pro access revoked.");
        fetchUser();
      }
    } catch {
      setActionMsg("Request failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] px-8 py-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 font-sans text-sm">
          {error ?? "User not found"}
        </div>
      </div>
    );
  }

  const { profile, pro, xpEvents, topics } = user;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/[0.06] flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] text-white/50 hover:text-white/80 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-display font-bold text-white">
            {profile?.display_name || user.email}
          </h1>
          <p className="text-white/40 text-sm font-mono mt-0.5">{user.email}</p>
        </div>
      </div>

      <div className="px-8 py-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="xl:col-span-2 space-y-5">
          {/* Stats card */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="text-sm font-sans font-semibold text-white/50 uppercase tracking-wider mb-4">
              Profile
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total XP", value: (profile?.total_xp ?? 0).toLocaleString() },
                { label: "Streak", value: `${profile?.streak_count ?? 0} days` },
                { label: "Freezes", value: profile?.streak_freezes ?? 0 },
                { label: "Language", value: profile?.lang ?? "en" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-white/30 text-xs font-sans mb-1">{s.label}</p>
                  <p className="text-white font-display font-semibold text-lg">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <p className="text-white/30 text-xs font-sans">
                Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Recent XP events */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="text-sm font-sans font-semibold text-white/50 uppercase tracking-wider mb-4">
              Recent XP Events
            </h2>
            {xpEvents.length === 0 ? (
              <p className="text-white/30 text-sm font-sans">No XP events yet.</p>
            ) : (
              <div className="space-y-2">
                {xpEvents.map((ev, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
                  >
                    <div>
                      <p className="text-white/70 text-sm font-sans">{ev.source}</p>
                      {ev.topic_slug && (
                        <p className="text-white/30 text-xs font-mono">{ev.topic_slug}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-mono text-sm font-semibold">
                        +{ev.amount} XP
                      </p>
                      <p className="text-white/25 text-xs font-mono">
                        {new Date(ev.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Topics */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="text-sm font-sans font-semibold text-white/50 uppercase tracking-wider mb-4">
              Top Topics
            </h2>
            {topics.length === 0 ? (
              <p className="text-white/30 text-sm font-sans">No topics explored yet.</p>
            ) : (
              <div className="space-y-2">
                {topics.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
                  >
                    <div>
                      <p className="text-white/70 text-sm font-sans">{t.topic_name}</p>
                      <p className="text-white/30 text-xs font-mono">{t.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-white/40">Level</span>
                      <span className="text-emerald-400 font-mono font-semibold text-sm">
                        {t.max_level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — Pro controls */}
        <div className="space-y-5">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="text-sm font-sans font-semibold text-white/50 uppercase tracking-wider mb-4">
              Pro Status
            </h2>

            {/* Current status */}
            <div
              className={`rounded-xl p-4 mb-5 ${
                pro.isPro
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : "bg-white/[0.04] border border-white/[0.06]"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    pro.isPro ? "bg-emerald-400" : "bg-white/20"
                  }`}
                />
                <p
                  className={`text-sm font-sans font-semibold ${
                    pro.isPro ? "text-emerald-400" : "text-white/50"
                  }`}
                >
                  {pro.isPro ? "Active Pro" : "Free"}
                </p>
              </div>
              {pro.isPro && pro.expiresAt && (
                <p className="text-white/50 text-xs font-mono">
                  Expires {new Date(pro.expiresAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  &middot; {pro.daysLeft} days left
                </p>
              )}
              {pro.source && (
                <p className="text-white/30 text-xs font-mono mt-1">
                  Source: {pro.source === "kofi" ? "Ko-fi" : "Promo"}
                </p>
              )}
            </div>

            {/* Grant Pro */}
            <div className="mb-3">
              <label className="text-white/40 text-xs font-sans block mb-2">Grant Pro (days)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={grantDays}
                  onChange={(e) => setGrantDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-emerald-500/40 transition-colors"
                />
                <button
                  onClick={handleGrantPro}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-sans font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  Grant
                </button>
              </div>
            </div>

            {/* Revoke */}
            {pro.isPro && (
              <button
                onClick={handleRevokePro}
                disabled={actionLoading}
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-sans font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                Revoke Pro
              </button>
            )}

            {actionMsg && (
              <p
                className={`text-xs font-sans mt-3 ${
                  actionMsg.startsWith("Error") ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {actionMsg}
              </p>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="text-sm font-sans font-semibold text-white/50 uppercase tracking-wider mb-3">
              Links
            </h2>
            <div className="space-y-2">
              <Link
                href={`/profile/${id}`}
                target="_blank"
                className="flex items-center gap-2 text-white/50 hover:text-emerald-400 text-sm font-sans transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View public profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
