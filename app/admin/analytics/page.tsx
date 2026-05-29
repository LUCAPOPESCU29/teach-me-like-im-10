import type { ReactNode } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

async function getAnalytics() {
  try {
    const admin = createAdminClient();

    // Signups by day — last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const users = authData?.users ?? [];

    const dayMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dayMap[d.toISOString().slice(0, 10)] = 0;
    }
    users.forEach((u) => {
      const day = u.created_at.slice(0, 10);
      if (day in dayMap) dayMap[day]++;
    });
    const signupsByDay = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

    // Top topics
    const { data: topicRows } = await admin
      .from("user_topics")
      .select("topic_name, slug, user_id")
      .order("updated_at", { ascending: false })
      .limit(500);

    const topicMap: Record<string, { topic_name: string; slug: string; users: Set<string> }> = {};
    (topicRows ?? []).forEach((row) => {
      if (!topicMap[row.slug]) {
        topicMap[row.slug] = { topic_name: row.topic_name, slug: row.slug, users: new Set() };
      }
      topicMap[row.slug].users.add(row.user_id);
    });
    const topTopics = Object.values(topicMap)
      .map((t) => ({ topic_name: t.topic_name, slug: t.slug, userCount: t.users.size }))
      .sort((a, b) => b.userCount - a.userCount)
      .slice(0, 10);

    // XP distribution
    const { data: xpRows } = await admin.from("profiles").select("total_xp");
    const buckets = [
      { label: "0–100", min: 0, max: 100 },
      { label: "101–500", min: 101, max: 500 },
      { label: "501–2k", min: 501, max: 2000 },
      { label: "2k–10k", min: 2001, max: 10000 },
      { label: "10k–50k", min: 10001, max: 50000 },
      { label: "50k+", min: 50001, max: Infinity },
    ];
    const xpDistribution = buckets.map((b) => ({
      label: b.label,
      count: (xpRows ?? []).filter((r) => (r.total_xp ?? 0) >= b.min && (r.total_xp ?? 0) <= b.max).length,
    }));

    return { signupsByDay, topTopics, xpDistribution };
  } catch {
    return null;
  }
}

function BarChart({
  data,
  labelKey,
  valueKey,
  color = "emerald",
  horizontal = false,
}: {
  data: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
  color?: "emerald" | "purple" | "blue";
  horizontal?: boolean;
}) {
  const values = data.map((d) => Number(d[valueKey]));
  const max = Math.max(...values, 1);
  const colorClass = { emerald: "bg-emerald-500", purple: "bg-purple-500", blue: "bg-blue-500" }[color];

  if (horizontal) {
    return (
      <div className="space-y-2">
        {data.map((item, i) => {
          const pct = (Number(item[valueKey]) / max) * 100;
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-right text-white/50 text-xs font-sans truncate">{String(item[labelKey])}</div>
              <div className="flex-1 h-5 bg-white/[0.04] rounded-full overflow-hidden">
                <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${pct}%` }} />
              </div>
              <div className="w-10 text-right text-white/40 text-xs font-mono">{Number(item[valueKey]).toLocaleString()}</div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((item, i) => {
        const pct = (Number(item[valueKey]) / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end" style={{ height: "100%" }}>
              <div className={`w-full ${colorClass} rounded-t-sm opacity-80`} style={{ height: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
      <h2 className="text-sm font-sans font-semibold text-white/50 uppercase tracking-wider mb-5">{title}</h2>
      {children}
    </div>
  );
}

export default async function AnalyticsPage() {
  const data = await getAnalytics();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="px-8 py-6 border-b border-white/[0.06]">
        <h1 className="text-2xl font-display font-bold text-white">Analytics</h1>
        <p className="text-white/40 text-sm font-sans mt-0.5">Growth and engagement insights</p>
      </div>
      <div className="px-8 py-8 space-y-6">
        {!data ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 font-sans text-sm">Failed to load analytics</div>
        ) : (
          <>
            <SectionCard title="Signups — Last 30 Days">
              <BarChart data={data.signupsByDay.map((d) => ({ label: d.date.slice(5), count: d.count }))} labelKey="label" valueKey="count" color="emerald" />
              <p className="text-white/30 text-xs font-sans mt-3">
                Total: <span className="text-white/60">{data.signupsByDay.reduce((s, d) => s + d.count, 0).toLocaleString()} signups</span>
              </p>
            </SectionCard>
            <SectionCard title="Top Topics (by unique users)">
              <BarChart data={data.topTopics.map((t) => ({ label: t.topic_name, count: t.userCount }))} labelKey="label" valueKey="count" color="purple" horizontal />
            </SectionCard>
            <SectionCard title="XP Distribution">
              <BarChart data={data.xpDistribution.map((b) => ({ label: b.label, count: b.count }))} labelKey="label" valueKey="count" color="blue" horizontal />
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}
