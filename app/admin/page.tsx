import type { ReactNode } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

async function getStats() {
  try {
    const admin = createAdminClient();

    const { count: totalUsers } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const { count: activePro } = await admin
      .from("kofi_payments")
      .select("email", { count: "exact", head: true })
      .gt("pro_expires_at", new Date().toISOString());

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: revenueRows } = await admin
      .from("kofi_payments")
      .select("amount")
      .gte("last_payment_at", firstOfMonth)
      .gt("amount", 0);

    const revenueThisMonth = (revenueRows ?? []).reduce(
      (sum, row) => sum + (row.amount ?? 0),
      0
    );

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const { data: todayRows } = await admin
      .from("xp_events")
      .select("user_id")
      .gte("created_at", todayStart.toISOString());
    const activeToday = new Set((todayRows ?? []).map((r) => r.user_id)).size;

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: weekRows } = await admin
      .from("xp_events")
      .select("user_id")
      .gte("created_at", weekAgo);
    const activeThisWeek = new Set((weekRows ?? []).map((r) => r.user_id)).size;

    const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const newSignupsThisWeek = (authData?.users ?? []).filter((u) => {
      return new Date(u.created_at).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000;
    }).length;

    return {
      totalUsers: totalUsers ?? 0,
      activePro: activePro ?? 0,
      revenueThisMonth,
      activeToday,
      activeThisWeek,
      newSignupsThisWeek,
    };
  } catch {
    return null;
  }
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-white/50 text-sm font-sans">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.06] text-white/40"}`}>
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-display font-bold ${accent ? "text-emerald-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="px-8 py-6 border-b border-white/[0.06]">
        <h1 className="text-2xl font-display font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm font-sans mt-0.5">Overview of your platform</p>
      </div>

      <div className="px-8 py-8">
        {!stats ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 font-sans text-sm">
            Failed to load stats
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} accent icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            } />
            <StatCard label="Active Pro" value={stats.activePro.toLocaleString()} accent icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            } />
            <StatCard label="Revenue (This Month)" value={`$${stats.revenueThisMonth.toFixed(2)}`} icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            } />
            <StatCard label="Active Today" value={stats.activeToday.toLocaleString()} icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            } />
            <StatCard label="Active This Week" value={stats.activeThisWeek.toLocaleString()} icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            } />
            <StatCard label="New Signups (This Week)" value={stats.newSignupsThisWeek.toLocaleString()} icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            } />
          </div>
        )}
      </div>
    </div>
  );
}
