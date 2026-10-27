import { ImageResponse } from "next/og";

export const alt = "ModelMeter — AI API prices from the source";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f5f5f7",
          color: "#1d1d1f",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: -0.4, color: "#1d1d1f" }}>ModelMeter</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 68, lineHeight: 1.05, maxWidth: 900 }}>
            API prices, from the source.
          </div>
          <div style={{ fontSize: 28, color: "#424245" }}>
            Official list prices, context limits, and release dates.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
