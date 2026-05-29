"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const ADMIN_EMAIL = "xpking@teachmelikeim10.xyz";

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  // Loading state — show nothing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Not admin — render nothing (redirect fires in useEffect)
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) return null;

  return <>{children}</>;
}
