// Voyle — media list + upload API
// GET  /api/media → returns JSON array of all media items in /media folder.
// POST /api/media → accepts multipart file upload(s), saves to /media folder.
//
// Defense-in-depth: even though src/proxy.ts gates these routes, we re-check
// the auth cookie here so media stays protected if the middleware is ever
// misconfigured, bypassed, or refactored.

import { NextRequest, NextResponse } from "next/server";
import { scanMediaDir, classifyExtension } from "@/lib/media";
import { COOKIE_NAME, isValidAuthToken } from "@/lib/auth";
import { getCurrentUser } from "@/lib/user";
import { recordUpload } from "@/lib/channel";
import { writeFile, mkdir, stat } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { randomBytes } from "node:crypto";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export async function GET(request: NextRequest) {
  // Defense-in-depth: require a valid auth cookie regardless of middleware.
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!isValidAuthToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = scanMediaDir();
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  // Defense-in-depth: require a valid auth cookie regardless of middleware.
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

  const files = formData.getAll("files").filter(
    (f): f is File => f instanceof File
  );

  if (files.length === 0) {
    return NextResponse.json(
      { error: "No files provided" },
      { status: 400 }
    );
  }

  const mediaDir = join(process.cwd(), "media");
  await mkdir(mediaDir, { recursive: true });

  const saved: string[] = [];
  const errors: { name: string; error: string }[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      errors.push({ name: file.name, error: "File too large (max 100 MB)" });
      continue;
    }

    const ext = extname(file.name).toLowerCase();
    if (!classifyExtension(ext)) {
      errors.push({ name: file.name, error: "Unsupported file type" });
      continue;
    }

    // De-duplicate filename: append short random suffix if it already exists.
    const base = basename(file.name, ext);
    let filename = file.name;
    let attempts = 0;
    while (attempts < 100) {
      const exists = await stat(join(mediaDir, filename)).then(
        () => true,
        () => false
      );
      if (!exists) break;
      const suffix = randomBytes(3).toString("hex");
      filename = `${base}-${suffix}${ext}`;
      attempts++;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(mediaDir, filename), buffer);
    saved.push(filename);
  }

  // Record attribution for each saved file (best-effort).
  const user = await getCurrentUser();
  if (user) {
    for (const filename of saved) {
      await recordUpload(filename, user.email, user.name);
    }
  }

  return NextResponse.json({ saved, errors });
}