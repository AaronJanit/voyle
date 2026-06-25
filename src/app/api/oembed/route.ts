// Voyle — oEmbed endpoint
// Implements https://oembed.com/ so platforms like Notion, Mastodon, WordPress,
// Discourse, etc. can fetch rich previews of /p/[id] URLs.
//
// Per spec, GET params: url (required), format (json|xml, default json),
// maxwidth, maxheight (we just ignore these — we always render the full asset).
//
// Responds with:
//   - 404 + JSON error if the URL isn't a Voyle share URL or item doesn't exist
//   - JSON object with type/html/width/height/thumbnail_url/author_name/etc.
//
// oEmbed doesn't require auth — it's a public discovery endpoint.

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { scanMediaDir } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");
  const format = (searchParams.get("format") || "json").toLowerCase();

  if (!targetUrl) {
    return oembedError(format, "Missing url parameter", 400);
  }

  // Parse the target URL — must be one of our share pages (/p/[id])
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return oembedError(format, "Invalid url", 400);
  }

  // Match /p/[id] — id may contain slashes (subfolder items)
  const match = parsed.pathname.match(/^\/p\/(.+)$/);
  if (!match) {
    return oembedError(format, "Unsupported URL", 404);
  }
  const id = match[1];
  const decoded = decodeURIComponent(id);

  // Look up the media item
  const item = scanMediaDir().find((it) => it.path === decoded);
  if (!item) {
    return oembedError(format, "Not found", 404);
  }

  // Build absolute URLs from the request's host so oEmbed consumers see the
  // same origin the requester did (works behind proxies, tunnels, etc.)
  const proto = request.headers.get("x-forwarded-proto") ?? parsed.protocol.replace(":", "");
  const host = request.headers.get("host") ?? parsed.host;
  const origin = `${proto}://${host}`;
  const mediaUrl = `${origin}/api/media/file/${item.path}`;
  const pageUrl = `${origin}/p/${encodeURIComponent(item.path)}`;
  const embedUrl = `${origin}/embed/${encodeURIComponent(item.path)}`;
  const thumbUrl = `${origin}/api/og?path=${encodeURIComponent(item.path)}`;

  // Choose oEmbed type. For images, type=photo. For videos, type=video.
  // For animated gifs, we use rich so consumers can choose to embed the iframe
  // (which plays the gif) instead of the still.
  let type: "photo" | "video" | "rich";
  let html = "";
  let width = 1200;
  let height = 800;

  if (item.type === "video") {
    type = "rich";
    height = Math.round(width * (9 / 16));
    html = `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`;
  } else if (item.type === "gif") {
    // GIFs animate better inside the embed iframe than as a static <img>
    type = "rich";
    height = Math.round(width * (9 / 16));
    html = `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`;
  } else {
    type = "photo";
    // photos get the raw <img> — gives the consumer the original file
    html = "";
    width = 1200;
    height = 800;
  }

  const payload = {
    version: "1.0",
    type,
    provider_name: "voyle",
    provider_url: origin,
    title: item.name,
    author_name: "voyle",
    author_url: origin,
    cache_age: 300,
    width,
    height,
    url: type === "photo" ? mediaUrl : undefined,
    html: type === "rich" ? html : undefined,
    thumbnail_url: thumbUrl,
    thumbnail_width: 1200,
    thumbnail_height: 630,
  };

  if (format === "xml") {
    const xml = objectToOEmbedXml(payload);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        // oEmbed endpoints must be discoverable — CORS for all origins
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function oembedError(format: string, message: string, status: number) {
  if (format === "xml") {
    return new NextResponse(objectToOEmbedXml({ error: message }), {
      status,
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { "Access-Control-Allow-Origin": "*" },
    }
  );
}

/** Convert an oEmbed-shaped object to XML. */
function objectToOEmbedXml(obj: Record<string, unknown>): string {
  const escape = (s: unknown) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const body = Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `  <${k}>${escape(v)}</${k}>`)
    .join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>\n<oembed>\n${body}\n</oembed>`;
}

// Also export a HEAD/OPTIONS handler so CORS preflight works without 405s.
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}