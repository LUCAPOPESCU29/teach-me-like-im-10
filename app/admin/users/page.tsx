"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  displayName: string;
  totalXp: number;
  streak: number;
  createdAt: string;
  isPro: boolean;
  proExpiresAt: string | null;
  daysLeft: number;
  proSource: string | null;
}

function ProBadge({ user }: { user: User }) {
  if (!user.isPro) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/[0.06] text-white/40 text-xs font-mono">
        Free
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-mono">
      Pro &middot; {user.daysLeft}d
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 50;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setUsers(data.users ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="px-8 py-6 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Users</h1>
          <p className="text-white/40 text-sm font-sans mt-0.5">
            {total.toLocaleString()} total users
          </p>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Search */}
        <div className="mb-5">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by email or display name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 text-sm font-sans focus:outline-none focus:border-emerald-500/40 transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-8 text-red-400 text-sm font-sans">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-white/30 text-sm font-sans text-center">No users found.</div>
          ) : (
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Email", "Display Name", "XP", "Streak", "Pro", "Joined", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-white/30 font-medium text-xs uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${
                      i === users.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-white/80 font-mono text-xs truncate max-w-[200px]">
                      {u.email}
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      {u.displayName || <span className="text-white/20 italic">—</span>}
                    </td>
                    <td className="px-4 py-3 text-white/60 font-mono">
                      {u.totalXp.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-white/60 font-mono">{u.streak}</td>
                    <td className="px-4 py-3">
                      <ProBadge user={u} />
                    </td>
                    <td className="px-4 py-3 text-white/30 font-mono text-xs">
                      {new Date(u.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="text-emerald-400 hover:text-emerald-300 text-xs font-sans transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-white/30 text-xs font-sans">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/60 text-xs font-sans disabled:opacity-40 hover:bg-white/[0.07] transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/60 text-xs font-sans disabled:opacity-40 hover:bg-white/[0.07] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
