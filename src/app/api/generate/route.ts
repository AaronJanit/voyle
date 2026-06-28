// Voyle — image generation API
// POST /api/generate → proxies to Cloudflare Workers AI, returns image as base64
// Accepts multipart/form-data with:
//   - prompt (string, required)
//   - image (file, optional — for img2img / generation context)
// Generated images are NOT saved to /media — they're returned inline only.

import { NextRequest, NextResponse } from "next/server";

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

  // Get the image bytes — return as base64 data URL, do NOT save to /media
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const base64 = imageBuffer.toString("base64");
  const dataUrl = `data:image/jpeg;base64,${base64}`;

  return NextResponse.json({
    success: true,
    image: dataUrl,
    size: imageBuffer.length,
    mode: imageFile ? "img2img" : "text2img",
  });
}