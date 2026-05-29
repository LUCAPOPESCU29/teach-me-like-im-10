"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin panel error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-8">
        <h2 className="text-red-400 font-display font-bold text-xl mb-3">Admin Error</h2>
        <p className="text-red-300/70 font-mono text-sm mb-2">{error.message}</p>
        {error.digest && (
          <p className="text-white/30 font-mono text-xs mb-6">Digest: {error.digest}</p>
        )}
        <pre className="text-red-300/50 font-mono text-xs overflow-auto max-h-40 mb-6 whitespace-pre-wrap">
          {error.stack}
        </pre>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-xl bg-red-500/15 text-red-400 font-sans text-sm hover:bg-red-500/25 transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
