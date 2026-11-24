import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A1416",
          borderRadius: 40,
          border: "3px solid rgba(122, 240, 203, 0.35)",
        }}
      >
        <svg width="108" height="114" viewBox="0 0 36 36" fill="none">
          <path
            d="M17 1 2 10v16l15 9 7-4-15-9v-8l15-9zm9 6-14 8v5l14 8 7-4-14-8 14-8-5-2z"
            fill="#7AF0CB"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
