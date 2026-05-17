import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Teach Me Like I'm 10 — Learn any topic from simple to expert";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const LEVELS = [
    { color: "#4ade80", label: "Kid",    h: 40  },
    { color: "#facc15", label: "Teen",   h: 62  },
    { color: "#fb923c", label: "Adult",  h: 84  },
    { color: "#f472b6", label: "Expert", h: 106 },
    { color: "#a78bfa", label: "PhD",    h: 128 },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          background: "#060c12",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Emerald radial glow — top left */}
        <div
          style={{
            position: "absolute",
            top: -160,
            left: -100,
            width: 620,
            height: 620,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 60%)",
            display: "flex",
          }}
        />

        {/* Soft gold glow — bottom right */}
        <div
          style={{
            position: "absolute",
            bottom: -80,
            right: -60,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(251,191,36,0.07) 0%, transparent 65%)",
            display: "flex",
          }}
        />

        {/* Dot grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
            display: "flex",
          }}
        />

        {/* Vertical separator */}
        <div
          style={{
            position: "absolute",
            top: 60,
            bottom: 60,
            right: 308,
            width: 1,
            background: "rgba(255,255,255,0.05)",
            display: "flex",
          }}
        />

        {/* ── Top row: brand + badge ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Brand mark */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                color: "white",
                fontWeight: 800,
              }}
            >
              ✦
            </div>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.08em",
              }}
            >
              TM10
            </span>
          </div>

          {/* Eyebrow badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 16px",
              borderRadius: 100,
              background: "rgba(52,211,153,0.07)",
              border: "1px solid rgba(52,211,153,0.15)",
            }}
          >
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#34d399",
                display: "flex",
              }}
            />
            <span
              style={{
                color: "#6ee7b7",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.12em",
              }}
            >
              AI-POWERED LEARNING
            </span>
          </div>
        </div>

        {/* ── Centre: headline ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            position: "relative",
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontSize: 104,
              fontWeight: 800,
              color: "white",
              lineHeight: 0.9,
              letterSpacing: "-4px",
            }}
          >
            Teach Me
          </span>
          <span
            style={{
              fontSize: 104,
              fontWeight: 800,
              color: "#34d399",
              lineHeight: 0.9,
              letterSpacing: "-4px",
            }}
          >
            Like I&apos;m 10
          </span>
          <p
            style={{
              marginTop: 18,
              fontSize: 22,
              color: "rgba(255,255,255,0.33)",
              letterSpacing: "0.01em",
              lineHeight: 1,
            }}
          >
            Pick any topic · Start simple · Go all the way to expert
          </p>
        </div>

        {/* ── Bottom row: depth bars + domain ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Rising bars */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            {LEVELS.map((lvl, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: lvl.h,
                    borderRadius: 8,
                    background: lvl.color,
                    opacity: 0.82,
                    display: "flex",
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.28)",
                    letterSpacing: "0.04em",
                    fontWeight: 500,
                  }}
                >
                  {lvl.label}
                </span>
              </div>
            ))}
            <div
              style={{
                marginLeft: 10,
                paddingBottom: 24,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.18)",
                  letterSpacing: "0.1em",
                  fontWeight: 600,
                }}
              >
                5 DEPTHS
              </span>
            </div>
          </div>

          {/* Domain */}
          <span
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.17)",
              letterSpacing: "0.12em",
              fontWeight: 500,
            }}
          >
            teachmelikeim10.xyz
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
