"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface EmailData {
  totalProfiles: number;
  streakReminder: number;
  weeklyDigest: number;
  newsletter: number;
}

function EmailCard({
  label,
  count,
  total,
  color,
  icon,
}: {
  label: string;
  count: number;
  total: number;
  color: "emerald" | "blue" | "purple";
  icon: ReactNode;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const trackColor = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
  }[color];
  const iconBg = {
    emerald: "bg-emerald-500/15 text-emerald-400",
    blue: "bg-blue-500/15 text-blue-400",
    purple: "bg-purple-500/15 text-purple-400",
  }[color];
  const textColor = {
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
  }[color];

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/50 text-sm font-sans mb-1">{label}</p>
          <p className={`text-3xl font-display font-bold ${textColor}`}>
            {count.toLocaleString()}
          </p>
          <p className="text-white/30 text-xs font-sans mt-0.5">
            {pct.toFixed(1)}% of {total.toLocaleString()} users
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full ${trackColor} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function EmailsPage() {
  const [data, setData] = useState<EmailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/emails")
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
      <div className="px-8 py-6 border-b border-white/[0.06]">
        <h1 className="text-2xl font-display font-bold text-white">Email Subscribers</h1>
        <p className="text-white/40 text-sm font-sans mt-0.5">
          Breakdown of email notification opt-ins
        </p>
      </div>

      <div className="px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 font-sans text-sm">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <EmailCard
                label="Streak Reminders"
                count={data.streakReminder}
                total={data.totalProfiles}
                color="emerald"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                }
              />
              <EmailCard
                label="Weekly Digest"
                count={data.weeklyDigest}
                total={data.totalProfiles}
                color="blue"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                }
              />
              <EmailCard
                label="Newsletter"
                count={data.newsletter}
                total={data.totalProfiles}
                color="purple"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
            </div>

            {/* Total context */}
            <div className="mt-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl px-6 py-4 flex items-center gap-3">
              <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-white/40 text-sm font-sans">
                Based on <span className="text-white/70">{data.totalProfiles.toLocaleString()}</span> total user profiles
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
