"use client";

import { useEffect, useState } from "react";

interface Challenge {
  id: string;
  code: string;
  creatorName: string;
  topicName: string;
  topicSlug: string | null;
  lang: string;
  createdAt: string;
  expiresAt: string;
  maxParticipants: number | null;
  participantCount: number;
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchChallenges = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/challenges");
      const data = await res.json();
      if (data.error) setError(data.error);
      else setChallenges(data.challenges ?? []);
    } catch {
      setError("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this challenge? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/challenges?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        setChallenges((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      alert("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const now = Date.now();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="px-8 py-6 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Challenges</h1>
          <p className="text-white/40 text-sm font-sans mt-0.5">
            {challenges.length} challenges
          </p>
        </div>
        <button
          onClick={fetchChallenges}
          className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-white/60 text-sm font-sans rounded-xl transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="px-8 py-6">
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-8 text-red-400 text-sm font-sans">{error}</div>
          ) : challenges.length === 0 ? (
            <div className="p-8 text-white/30 text-sm font-sans text-center">
              No challenges found.
            </div>
          ) : (
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Code", "Topic", "Creator", "Participants", "Created", "Expires", ""].map((h) => (
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
                {challenges.map((c, i) => {
                  const isExpired = new Date(c.expiresAt).getTime() < now;
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${
                        i === challenges.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="bg-white/[0.06] text-white/70 font-mono text-xs px-2 py-1 rounded-lg">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white/70 text-sm">{c.topicName}</p>
                        {c.topicSlug && (
                          <p className="text-white/25 text-xs font-mono">{c.topicSlug}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/60">{c.creatorName}</td>
                      <td className="px-4 py-3">
                        <span className="text-white/60 font-mono">
                          {c.participantCount}
                          {c.maxParticipants ? (
                            <span className="text-white/25">/{c.maxParticipants}</span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/30 font-mono text-xs">
                        {new Date(c.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-mono ${
                            isExpired ? "text-red-400/60" : "text-emerald-400/70"
                          }`}
                        >
                          {isExpired ? "Expired" : "Active"} &middot;{" "}
                          {new Date(c.expiresAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-sans rounded-lg transition-colors disabled:opacity-40"
                        >
                          {deletingId === c.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
