import { ImageResponse } from "next/og";
import { getCategory } from "@/content/categories";
import { seedProducts } from "@/content/products";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProductOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getCategory(slug);
  const prod = seedProducts.find((p) => p.slug === slug);

  const title = cat ? cat.name : (prod?.title ?? "Akwasuccess Guide");
  const subtitle = cat
    ? cat.description
    : (prod?.subtitle ?? "Practical knowledge on finance, the digital economy, and technology.");

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
        <div style={{ fontSize: 28, fontWeight: 700, color: "#D4A017" }}>
          Akwasuccess • eBook &amp; Learning Guide
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ width: 96, height: 6, background: "#D4A017" }} />
          <div style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.15 }}>{title}</div>
          <div style={{ fontSize: 26, color: "#E6F3EB" }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: 22, color: "#E6F3EB" }}>
          Instant download • Secure USD Card Checkout
        </div>
      </div>
    ),
    { ...size },
  );
}
