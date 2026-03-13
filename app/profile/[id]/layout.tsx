import type { Metadata } from "next";

const BASE_URL = "https://teachmelikeim10.xyz";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${BASE_URL}/api/profile/${id}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("Profile not found");

    const data = await res.json();
    const name = data?.profile?.displayName || "Learner";
    const xp = data?.profile?.totalXP || 0;
    const title = data?.profile?.title || "Curious Mind";

    return {
      title: `${name}'s Profile`,
      description: `${name} is a ${title} with ${xp} XP on Teach Me Like I'm 10`,
      openGraph: {
        title: `${name}'s Learning Profile`,
        description: `${name} is a ${title} with ${xp} XP on Teach Me Like I'm 10`,
        images: [`/api/profile/${id}/og`],
      },
      twitter: {
        card: "summary_large_image",
        title: `${name}'s Learning Profile`,
        images: [`/api/profile/${id}/og`],
      },
    };
  } catch {
    return {
      title: "Profile — Teach Me Like I'm 10",
    };
  }
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
