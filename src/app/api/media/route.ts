// Voyle — media list + upload API
// GET  /api/media → returns JSON array of all media items from the DB.
// POST /api/media → accepts multipart file upload(s), saves to Cloudflare R2.
//
// GET is public (media is served from R2 without auth).
// POST requires auth (uploads must be from a logged-in user).

import { NextRequest, NextResponse } from "next/server";
import { scanMediaDir, classifyExtension } from "@/lib/media";
import { COOKIE_NAME, isValidAuthToken } from "@/lib/auth";
import { getCurrentUser } from "@/lib/user";
import { recordUpload } from "@/lib/channel";
import { uploadToR2, headR2Object } from "@/lib/r2";
import { extname, basename } from "node:path";
import { randomBytes } from "node:crypto";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

// MIME type map for R2 uploads
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
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
};

export async function GET() {
  const items = await scanMediaDir();
  return NextResponse.json(items, {
    headers: {
      "Cache-Control": "public, max-age=30, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

export async function POST(request: NextRequest) {
  // Uploads require auth — only logged-in users can upload.
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!isValidAuthToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Failed to parse upload. The file may be too large." },
      { status: 413 }
    );
  }

  const title = formData.get("title") as string | null;

  const files = formData.getAll("files").filter(
    (f): f is File => f instanceof File
  );

  if (files.length === 0) {
    return NextResponse.json(
      { error: "No files provided" },
      { status: 400 }
    );
  }

  const saved: string[] = [];
  const errors: { name: string; error: string }[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      errors.push({ name: file.name, error: "File too large (max 100 MB)" });
      continue;
    }

    const ext = extname(file.name).toLowerCase();
    const type = classifyExtension(ext);
    if (!type) {
      errors.push({ name: file.name, error: "Unsupported file type" });
      continue;
    }

    // De-duplicate filename: append short random suffix if it already exists in R2.
    const base = basename(file.name, ext);
    let filename = file.name;
    let attempts = 0;
    while (attempts < 100) {
      const exists = await headR2Object(filename);
      if (exists === null) break;
      const suffix = randomBytes(3).toString("hex");
      filename = `${base}-${suffix}${ext}`;
      attempts++;
    }

    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const buffer = Buffer.from(await file.arrayBuffer());
    const ok = await uploadToR2(filename, buffer, contentType);
    if (!ok) {
      errors.push({ name: file.name, error: "Failed to upload to R2" });
      continue;
    }
    saved.push(filename);
  }

  // Record attribution for each saved file (best-effort).
  const user = await getCurrentUser();
  if (user) {
    for (const filename of saved) {
      const ext = extname(filename).toLowerCase();
      const type = classifyExtension(ext);
      const stat = await headR2Object(filename);
      await recordUpload(
        filename,
        user.email,
        user.name,
        title ?? undefined,
        type ?? undefined,
        stat ?? undefined,
        filename
      );
    }
  }

  return NextResponse.json({ saved, errors });
}