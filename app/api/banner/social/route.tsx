import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background:
            "linear-gradient(145deg, #080e1a 0%, #0d1a2d 35%, #111f38 55%, #0a1225 100%)",
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
        {/* Large ambient glow */}
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 800,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(52, 211, 153, 0.1) 0%, transparent 65%)",
            display: "flex",
          }}
        />

        {/* Top-right accent glow */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(167, 139, 250, 0.06) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Bottom-left accent glow */}
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -60,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(52, 211, 153, 0.06) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Difficulty level dots */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 32,
          }}
        >
          {["#4ade80", "#facc15", "#fb923c", "#f472b6", "#a78bfa"].map(
            (color, i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: color,
                  opacity: 0.85,
                  boxShadow: `0 0 16px ${color}50`,
                }}
              />
            )
          )}
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}
        >
          <div
            style={{
              fontSize: 74,
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
              fontSize: 74,
              fontWeight: 800,
              color: "#34d399",
              lineHeight: 1.05,
              textAlign: "center",
              letterSpacing: -2,
            }}
          >
            Like I&apos;m 10
          </div>
        </div>

        {/* Divider line */}
        <div
          style={{
            width: 60,
            height: 2,
            background:
              "linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.5), transparent)",
            marginTop: 28,
            marginBottom: 24,
            display: "flex",
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "rgba(255, 255, 255, 0.45)",
            textAlign: "center",
            maxWidth: 650,
            lineHeight: 1.5,
          }}
        >
          Learn any topic — from simple to expert. Powered by AI.
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 32,
          }}
        >
          {["5 Levels", "Quizzes", "AI Explanations", "Flashcards"].map(
            (text, i) => (
              <div
                key={i}
                style={{
                  padding: "8px 20px",
                  borderRadius: 100,
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: 15,
                  fontWeight: 500,
                  letterSpacing: 0.3,
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
            bottom: 28,
            fontSize: 15,
            color: "rgba(255, 255, 255, 0.2)",
            letterSpacing: 4,
            fontWeight: 500,
          }}
        >
          TEACHMELIKEIM10.XYZ
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
