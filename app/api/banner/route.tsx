import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background:
            "linear-gradient(135deg, #0a1020 0%, #0d1a2d 40%, #0f1f35 60%, #0a1020 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top-left glow */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(52, 211, 153, 0.08) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Center glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(52, 211, 153, 0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Bottom-right glow */}
        <div
          style={{
            position: "absolute",
            bottom: -150,
            right: -150,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Difficulty level dots */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginBottom: 36,
          }}
        >
          {["#4ade80", "#facc15", "#fb923c", "#f472b6", "#a78bfa"].map(
            (color, i) => (
              <div
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: color,
                  opacity: 0.9,
                  boxShadow: `0 0 20px ${color}40`,
                }}
              />
            )
          )}
        </div>

        {/* Emoji */}
        <div
          style={{
            fontSize: 56,
            marginBottom: 16,
            display: "flex",
          }}
        >
          🧒🧠
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: "white",
              lineHeight: 1.05,
              textAlign: "center",
              letterSpacing: -2,
            }}
          >
            Teach Me
          </div>
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              background: "linear-gradient(135deg, #34d399, #6ee7b7)",
              backgroundClip: "text",
              color: "#34d399",
              lineHeight: 1.05,
              textAlign: "center",
              letterSpacing: -2,
            }}
          >
            Like I&apos;m 10
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 26,
            color: "rgba(255, 255, 255, 0.5)",
            marginTop: 28,
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Learn any topic — from simple to expert. Powered by AI.
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 36,
          }}
        >
          {["5 Difficulty Levels", "Quizzes", "AI Explanations"].map(
            (text, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 22px",
                  borderRadius: 100,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: 17,
                  fontWeight: 500,
                }}
              >
                {text}
              </div>
            )
          )}
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 18,
            color: "rgba(255, 255, 255, 0.25)",
            letterSpacing: 3,
            fontWeight: 500,
          }}
        >
          TEACHMELIKEIM10.XYZ
        </div>
      </div>
    ),
    {
      width: 1280,
      height: 720,
    }
  );
}
