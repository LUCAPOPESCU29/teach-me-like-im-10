import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const LEVEL_COLORS = ["#4ade80", "#fbbf24", "#f97316", "#f43f5e", "#a855f7"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createClient();

    const { data: share } = await supabase
      .from("shared_topics")
      .select("sharer_name, topic_name, max_level, personal_message")
      .eq("share_code", code.toLowerCase())
      .single();

    if (!share) {
      return new Response("Not found", { status: 404 });
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, #0a1020 0%, #0d1a2d 50%, #0a1020 100%)",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            position: "relative",
          }}
        >
          {/* Ambient glows */}
          <div
            style={{
              position: "absolute",
              top: "-100px",
              left: "-100px",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-100px",
              right: "-100px",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)",
              display: "flex",
            }}
          />

          {/* Shared by label */}
          <div
            style={{
              fontSize: "20px",
              color: "rgba(255,255,255,0.4)",
              marginBottom: "8px",
              display: "flex",
            }}
          >
            {share.sharer_name} learned about...
          </div>

          {/* Topic name */}
          <div
            style={{
              fontSize: "52px",
              fontWeight: "700",
              color: "white",
              marginBottom: "28px",
              textAlign: "center",
              maxWidth: "900px",
              display: "flex",
            }}
          >
            {share.topic_name}
          </div>

          {/* Level progress bars */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            {[1, 2, 3, 4, 5].map((l) => (
              <div
                key={l}
                style={{
                  width: "48px",
                  height: "6px",
                  borderRadius: "3px",
                  backgroundColor:
                    l <= share.max_level
                      ? LEVEL_COLORS[l - 1]
                      : "rgba(255,255,255,0.1)",
                  display: "flex",
                }}
              />
            ))}
          </div>

          {/* Level label */}
          <div
            style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.3)",
              display: "flex",
            }}
          >
            Reached Level {share.max_level} of 5
          </div>

          {/* Personal message */}
          {share.personal_message && (
            <div
              style={{
                fontSize: "18px",
                color: "rgba(255,255,255,0.5)",
                marginTop: "28px",
                fontStyle: "italic",
                maxWidth: "700px",
                textAlign: "center",
                display: "flex",
              }}
            >
              &ldquo;{share.personal_message.slice(0, 100)}&rdquo;
            </div>
          )}

          {/* Branding footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              position: "absolute",
              bottom: "24px",
            }}
          >
            <div style={{ display: "flex", gap: "4px" }}>
              {LEVEL_COLORS.map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: c,
                    display: "flex",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.3)",
                fontWeight: "500",
                letterSpacing: "1px",
                display: "flex",
              }}
            >
              TEACHMELIKEIM10.XYZ
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      }
    );
  } catch {
    return new Response("Error generating image", { status: 500 });
  }
}
