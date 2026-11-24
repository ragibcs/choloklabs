import { ImageResponse } from "next/og";

export const alt = "CholokLabs — Product & Engineering Studio | From software to silicon.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #071012 0%, #0D1B1E 55%, #0A1416 100%)",
          color: "#EEF3F1",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <svg width="46" height="48" viewBox="0 0 36 36" fill="none">
              <path
                d="M17 1 2 10v16l15 9 7-4-15-9v-8l15-9zm9 6-14 8v5l14 8 7-4-14-8 14-8-5-2z"
                fill="#7AF0CB"
              />
            </svg>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, letterSpacing: "-0.03em" }}>
              <span>Cholok</span>
              <span style={{ color: "#7AF0CB", fontWeight: 400 }}>Labs</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid rgba(122, 240, 203, 0.35)",
              background: "rgba(122, 240, 203, 0.1)",
              color: "#7AF0CB",
              fontSize: 16,
              letterSpacing: "0.14em",
            }}
          >
            PRODUCT & ENGINEERING STUDIO
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 78,
              lineHeight: 1.04,
              fontWeight: 600,
              letterSpacing: "-0.04em",
            }}
          >
            <span>From software</span>
            <span style={{ display: "flex", gap: 18 }}>
              <span>to</span>
              <span style={{ color: "#7AF0CB", fontStyle: "italic" }}>silicon.</span>
            </span>
          </div>
          <div style={{ fontSize: 26, color: "#9FB3AE", maxWidth: 820, lineHeight: 1.4 }}>
            AI applications, GPU acceleration, Industrial IoT, PLC automation, embedded hardware, and custom silicon architecture.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: 22,
            fontSize: 18,
            color: "#7AF0CB",
            letterSpacing: "0.08em",
          }}
        >
          <span>PORIKKHA · BOLOY · FULL-STACK ENGINEERING</span>
          <span style={{ color: "#9FB3AE" }}>choloklabs.tech</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
