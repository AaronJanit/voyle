// Voyle — image generation API
// POST /api/generate → proxies to Cloudflare Workers AI, saves image to /media
// Accepts multipart/form-data with:
//   - prompt (string, required)
//   - image (file, optional — for img2img / generation context)

import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getCurrentUser } from "@/lib/user";
import { recordUpload } from "@/lib/channel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB max upload

export async function POST(request: NextRequest) {
  const apiUrl = process.env.IMAGE_GEN_API_URL;
  const apiKey = process.env.IMAGE_GEN_API_KEY;

  if (!apiUrl || !apiKey) {
    return NextResponse.json({ error: "Image generation not configured" }, { status: 500 });
  }

  // Handle both JSON (text-to-image) and multipart/form-data (img2img)
  const contentType = request.headers.get("content-type") || "";
  let prompt = "";
  let imageFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }
    prompt = (formData.get("prompt") as string)?.trim() || "";
    const file = formData.get("image") as File | null;
    if (file && file.size > 0) {
      imageFile = file;
    }
  } else {
    let body: { prompt?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    prompt = body.prompt?.trim() || "";
  }

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  // Build the request body for the Cloudflare Worker
  let workerBody: { prompt: string; image?: string };

  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image too large (max 4MB)" }, { status: 413 });
    }

    // Convert uploaded image to base64 for the worker
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = imageFile.type || "image/jpeg";

    workerBody = { prompt, image: `data:${mimeType};base64,${base64}` };
  } else {
    workerBody = { prompt };
  }

  // Call the Cloudflare Worker
  let imageResponse: Response;
  try {
    imageResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(workerBody),
    });
  } catch {
    return NextResponse.json({ error: "Failed to reach image generation service" }, { status: 502 });
  }

  if (!imageResponse.ok) {
    const errText = await imageResponse.text().catch(() => "Unknown error");
    return NextResponse.json({ error: `Generation failed: ${errText}` }, { status: 502 });
  }

  // Get the image bytes
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

  // Generate a filename from the prompt (sanitized) + timestamp
  const slug = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const timestamp = Date.now();
  const prefix = imageFile ? "gen-img2img" : "gen";
  const filename = `${prefix}-${slug}-${timestamp}.jpg`;
  const filepath = join(process.cwd(), "media", filename);

  // Ensure /media exists
  const mediaDir = join(process.cwd(), "media");
  if (!existsSync(mediaDir)) {
    mkdirSync(mediaDir, { recursive: true });
  }

  // Save the image to /media so it appears in the catalog
  writeFileSync(filepath, imageBuffer);

  // Record attribution (best-effort — don't fail the upload if this breaks)
  const user = await getCurrentUser();
  if (user) {
    await recordUpload(filename, user.email, user.name);
  }

  return NextResponse.json({
    success: true,
    filename,
    path: `/api/media/file/${filename}`,
    size: imageBuffer.length,
    mode: imageFile ? "img2img" : "text2img",
  });
}