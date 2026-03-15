import type { Metadata } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.teachmelikeim10.xyz";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;

  try {
    const res = await fetch(`${BASE_URL}/api/share/${code}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Share not found");
    const data = await res.json();

    const title = `${data.sharerName} shared "${data.topicName}" — Teach Me Like I'm 10`;
    const description = data.personalMessage
      ? `${data.personalMessage.slice(0, 120)} — Level ${data.maxLevel}/5 on Teach Me Like I'm 10`
      : `${data.sharerName} reached Level ${data.maxLevel}/5 on "${data.topicName}". See what they learned!`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [`/api/share/${code}/og`],
      },
      twitter: {
        card: "summary_large_image",
        title,
        images: [`/api/share/${code}/og`],
      },
    };
  } catch {
    return { title: "Shared Topic — Teach Me Like I'm 10" };
  }
}

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
