import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = `${site.name}: ${site.tagline}`;
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
          background: "#08472A",
          color: "#FFFFFF",
          padding: 72,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 32,
            fontWeight: 700,
            color: "#D4A017",
          }}
        >
          Akwasuccess
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ width: 96, height: 6, background: "#D4A017" }} />
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.15 }}>
            {site.tagline}
          </div>
          <div style={{ fontSize: 30, color: "#E6F3EB" }}>{site.supportingLine}</div>
        </div>
        <div style={{ fontSize: 22, color: "#E6F3EB" }}>
          eBooks • Courses • Tutorials • Consulting • M-Pesa & Card
        </div>
      </div>
    ),
    { ...size },
  );
}
