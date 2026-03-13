import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Teach Me Like I'm 10 — Learn any topic from simple to expert";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a1020 0%, #0d1a2d 50%, #0a1020 100%)",
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
        {/* Glow effect */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(52, 211, 153, 0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Level dots */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 40,
          }}
        >
          {["#4ade80", "#facc15", "#fb923c", "#f472b6", "#a78bfa"].map(
            (color, i) => (
              <div
                key={i}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: color,
                  opacity: 0.8,
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
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "white",
              lineHeight: 1.1,
              textAlign: "center",
            }}
          >
            Teach Me
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#34d399",
              lineHeight: 1.1,
              textAlign: "center",
            }}
          >
            Like I&apos;m 10
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "rgba(255, 255, 255, 0.4)",
            marginTop: 24,
            textAlign: "center",
          }}
        >
          Pick any topic. Start simple. Go as deep as you want.
        </div>

        {/* Domain */}
        <div
          style={{
            fontSize: 18,
            color: "rgba(255, 255, 255, 0.2)",
            marginTop: 40,
            letterSpacing: 2,
          }}
        >
          teachmelikeim10.xyz
        </div>
      </div>
    ),
    { ...size }
  );
}
