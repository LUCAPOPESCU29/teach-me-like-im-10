import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./ProfileClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  let displayName = "Learner";
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, total_xp")
      .eq("id", id)
      .single();

    if (profile) {
      displayName = profile.display_name;
    }
  } catch {
    // Fallback to default name
  }

  const title = `${displayName}'s Profile | Teach Me Like I'm 10`;
  const description = `Check out ${displayName}'s learning journey on Teach Me Like I'm 10 — explore their topics, badges, and streak!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function ProfilePage() {
  return <ProfileClient />;
}
