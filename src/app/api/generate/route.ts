// Voyle — image generation API
// POST /api/generate → proxies to Cloudflare Workers AI, saves image to /media
// Body: { prompt: string }

import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const apiUrl = process.env.IMAGE_GEN_API_URL;
  const apiKey = process.env.IMAGE_GEN_API_KEY;

  if (!apiUrl || !apiKey) {
    return NextResponse.json({ error: "Image generation not configured" }, { status: 500 });
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
      body: JSON.stringify({ prompt }),
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
  const filename = `gen-${slug}-${timestamp}.jpg`;
  const filepath = join(process.cwd(), "media", filename);

  // Ensure /media exists
  const mediaDir = join(process.cwd(), "media");
  if (!existsSync(mediaDir)) {
    mkdirSync(mediaDir, { recursive: true });
  }

  // Save the image to /media so it appears in the catalog
  writeFileSync(filepath, imageBuffer);

  return NextResponse.json({
    success: true,
    filename,
    path: `/api/media/file/${filename}`,
    size: imageBuffer.length,
  });
}