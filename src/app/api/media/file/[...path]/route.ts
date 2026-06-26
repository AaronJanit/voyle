// Voyle — media file server
// GET /api/media/file/[...path] → streams a file from the /media folder.
// This keeps media behind the auth middleware (files are outside public/).
//
// Defense-in-depth: even though src/proxy.ts gates this route, we re-check the
// auth cookie here so media stays protected if the middleware is ever
// misconfigured, bypassed, or refactored.

import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { join, resolve } from "node:path";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { COOKIE_NAME, isValidAuthToken } from "@/lib/auth";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".tiff": "image/tiff",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".m4v": "video/x-m4v",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Defense-in-depth: require a valid auth cookie regardless of middleware.
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!isValidAuthToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path: pathSegments } = await params;
  const relPath = pathSegments.join("/");

  // Prevent path traversal
  const mediaDir = resolve(join(process.cwd(), "media"));
  const fullPath = resolve(join(mediaDir, relPath));

  if (!fullPath.startsWith(mediaDir)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let stats;
  try {
    stats = await stat(fullPath);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!stats.isFile()) {
    return NextResponse.json({ error: "Not a file" }, { status: 404 });
  }

  const ext = relPath.toLowerCase().match(/\.[^.]+$/)?.[0] || "";
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  const stream = createReadStream(fullPath);
  const readableStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>;

  return new NextResponse(readableStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": stats.size.toString(),
      "Cache-Control": "public, max-age=3600",
    },
  });
}