"use client";

import { useEffect, useState } from "react";

interface ProUser {
  email: string;
  isPro: boolean;
  expiresAt: string;
  daysLeft: number;
  amount: number;
  daysGranted: number;
  lastPayment: string;
  source: "kofi" | "promo";
}

interface ProData {
  totalActive: number;
  totalExpired: number;
  active: ProUser[];
  expired: ProUser[];
}

function SourceBadge({ source }: { source: string }) {
  if (source === "promo") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 text-xs font-mono">
        Promo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-mono">
      Ko-fi
    </span>
  );
}

function UserTable({ users, showDaysLeft }: { users: ProUser[]; showDaysLeft: boolean }) {
  if (users.length === 0) {
    return <p className="text-white/30 text-sm font-sans p-6">No users in this tab.</p>;
  }

  return (
    <table className="w-full text-sm font-sans">
      <thead>
        <tr className="border-b border-white/[0.06]">
          {["Email", "Source", "Amount", "Days", "Expires", showDaysLeft ? "Days Left" : "Expired"].map((h) => (
            <th
              key={h}
              className="px-4 py-3 text-left text-white/30 font-medium text-xs uppercase tracking-wider"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {users.map((u, i) => (
          <tr
            key={u.email}
            className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${
              i === users.length - 1 ? "border-b-0" : ""
            }`}
          >
            <td className="px-4 py-3 text-white/70 font-mono text-xs">{u.email}</td>
            <td className="px-4 py-3">
              <SourceBadge source={u.source} />
            </td>
            <td className="px-4 py-3 text-white/60 font-mono">
              {u.amount > 0 ? `$${u.amount.toFixed(2)}` : "—"}
            </td>
            <td className="px-4 py-3 text-white/60 font-mono">{u.daysGranted ?? "—"}</td>
            <td className="px-4 py-3 text-white/50 font-mono text-xs">
              {new Date(u.expiresAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </td>
            <td className="px-4 py-3">
              {showDaysLeft ? (
                <span className="text-emerald-400 font-mono text-sm">{u.daysLeft}d</span>
              ) : (
                <span className="text-white/30 font-mono text-xs">
                  {new Date(u.expiresAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ProPage() {
  const [data, setData] = useState<ProData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "expired">("active");

  useEffect(() => {
    fetch("/api/admin/pro-users")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="px-8 py-6 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Pro / Payments</h1>
          <p className="text-white/40 text-sm font-sans mt-0.5">Ko-fi payments and promo grants</p>
        </div>
        {data && (
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-emerald-400 font-display font-bold text-xl">{data.totalActive}</p>
              <p className="text-white/30 text-xs font-sans">Active</p>
            </div>
            <div>
              <p className="text-white/50 font-display font-bold text-xl">{data.totalExpired}</p>
              <p className="text-white/30 text-xs font-sans">Expired</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white/[0.03] border border-white/[0.08] rounded-xl p-1 w-fit">
          {(["active", "expired"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-sans font-medium capitalize transition-all ${
                tab === t
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {t} {data ? `(${t === "active" ? data.totalActive : data.totalExpired})` : ""}
            </button>
          ))}
        </div>

        <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-8 text-red-400 text-sm font-sans">{error}</div>
          ) : data ? (
            <UserTable
              users={tab === "active" ? data.active : data.expired}
              showDaysLeft={tab === "active"}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
