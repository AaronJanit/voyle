// Voyle — dynamic Open Graph image generator
//
// Many crawlers (Twitter, Discord, Slack, etc.) fetch `og:image` URLs and
// render them as link previews. To make Voyle share links look great, we want
// each /p/[id] page to have a rich preview.
//
// Two cases:
//   1. Image / GIF item → 302-redirect to the raw media file. Crawlers happily
//      display images this way and we avoid any image-processing work.
//   2. Video item → the raw file isn't suitable as a preview thumbnail, so we
//      serve a generated SVG poster (1200x630) with the filename + a play
//      badge. SVG is fine for OG in most crawlers; for the strict ones
//      (LinkedIn) we'd need a real PNG, but Discord/Twitter/Slack/iMessage
//      all accept it.
//
// Public — no auth required.

import { NextRequest, NextResponse } from "next/server";
import { scanMediaDir, mediaUrl } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawPath = searchParams.get("path");

  if (!rawPath) {
    return posterSvg("voyle", "missing path", null);
  }

  const path = decodeURIComponent(rawPath);
  const item = (await scanMediaDir()).find((it) => it.path === path);
  if (!item) {
    return posterSvg("voyle", "not found", null);
  }

  const mediaUrlStr = mediaUrl(item.path);

  // Images & gifs → redirect crawlers to the raw media file. This gives them
  // the actual asset with no processing cost.
  if (item.type === "photo" || item.type === "gif") {
    return NextResponse.redirect(mediaUrlStr, 302);
  }

  // Videos → no good thumbnail, so generate an SVG poster
  return posterSvg(item.name, "video", mediaUrlStr);
}

/**
 * Build a 1200x630 SVG poster. Uses inline background tinted by item name.
 */
function posterSvg(title: string, subtitle: string, thumbnailUrl: string | null) {
  // Truncate to keep the SVG manageable
  const safeTitle = title.length > 60 ? title.slice(0, 57) + "…" : title;
  const safeSubtitle = subtitle.length > 80 ? subtitle.slice(0, 77) + "…" : subtitle;

  // Generate a stable color pair from the title hash
  const hash = Array.from(title).reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0);
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 60) % 360;

  // Escape for SVG
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // If we have a thumbnail URL, embed it as a blurred background image (data:
  // not allowed in SVG referenced from <img> — most crawlers don't fetch
  // external image refs in SVG, so we use a CSS gradient fallback). The play
  // badge is the key signal here.
  const bgImage = thumbnailUrl
    ? `<image href="${esc(thumbnailUrl)}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice" opacity="0.35"/>`
    : "";

  const playBadge = subtitle === "video"
    ? `<g transform="translate(600, 315)">
         <circle r="80" fill="rgba(255,255,255,0.95)"/>
         <polygon points="-25,-40 -25,40 40,0" fill="#1a73e8"/>
       </g>`
    : "";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue1}, 60%, 18%)"/>
      <stop offset="100%" stop-color="hsl(${hue2}, 60%, 28%)"/>
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="20"/></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  ${bgImage}
  <rect width="1200" height="630" fill="black" opacity="0.25"/>
  ${playBadge}
  <text x="600" y="500" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="42" font-weight="600">
    ${esc(safeTitle)}
  </text>
  <text x="600" y="550" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400">
    voyle · ${esc(safeSubtitle)}
  </text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}