// Voyle — media list API
// GET /api/media → returns JSON array of all media items in /media folder.

import { NextResponse } from "next/server";
import { scanMediaDir } from "@/lib/media";

export async function GET() {
  const items = scanMediaDir();
  return NextResponse.json(items);
}