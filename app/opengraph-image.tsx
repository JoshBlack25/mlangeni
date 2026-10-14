import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// The link preview for WhatsApp, LinkedIn, Facebook, X and Slack. Generated
// once at build time from the real logo and an event photo. Child routes
// inherit it; twitter:image falls back to og:image.

export const alt =
  "Mlangeni Grand Hospitality: private event catering in Cape Town, South Africa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [photo, logo] = await Promise.all([
    readFile(join(process.cwd(), "public/images/gallery_images/dining_table.jpeg"), "base64"),
    readFile(join(process.cwd(), "public/logos/logo2.png"), "base64"),
  ]);

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#0a0a0a" }}>
        <img
          src={`data:image/jpeg;base64,${photo}`}
          alt=""
          width={560}
          height={630}
          style={{ objectFit: "cover" }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            padding: 56,
            borderLeft: "2px solid #D4AF37",
          }}
        >
          <img src={`data:image/png;base64,${logo}`} alt="" width={440} height={262} />
          <div
            style={{
              marginTop: 36,
              fontSize: 26,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#D4AF37",
            }}
          >
            Private Event Catering
          </div>
          <div style={{ marginTop: 14, fontSize: 24, color: "#cccccc" }}>
            Cape Town · South Africa
          </div>
        </div>
      </div>
    ),
    size,
  );
}
