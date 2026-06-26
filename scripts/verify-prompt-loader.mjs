// Verifies that the actual getSystemPrompt() loader (from src/lib/prompts.ts
// compiled on the fly with esbuild) returns the prompt from Supabase, not the
// hard-coded fallback. We compare its output to a direct Supabase read.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
for (const line of readFileSync(envPath, "utf-8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }
);

const { data: dbRow } = await supabase
  .from("system_prompt")
  .select("content, updated_at")
  .eq("id", 1)
  .maybeSingle();

if (!dbRow) {
  console.error("✗ No row in Supabase.");
  process.exit(1);
}
console.log(`✓ DB row length: ${dbRow.content.length}, updated_at: ${dbRow.updated_at}`);

// Now load the actual loader by transpiling on the fly.
const { build } = await import("esbuild");
const { outputFiles } = await build({
  entryPoints: [resolve(process.cwd(), "src/lib/prompts.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  external: ["@supabase/supabase-js"],
});

const tmpPath = resolve(process.cwd(), ".tmp-prompts.mjs");
const { writeFileSync, unlinkSync } = await import("node:fs");
writeFileSync(tmpPath, outputFiles[0].text);
try {
  const mod = await import(`file:///${tmpPath.replace(/\\/g, "/")}`);
  const fromLoader = await mod.getSystemPrompt();
  console.log(`✓ Loader returned length: ${fromLoader.length}`);
  if (fromLoader === dbRow.content) {
    console.log("✓ Loader output matches Supabase row exactly.");
    console.log("\n✅ Loader is reading from Supabase (not the fallback).");
  } else if (fromLoader === mod.SYSTEM_PROMPT) {
    console.error("✗ Loader returned the hard-coded fallback, not Supabase!");
    process.exit(1);
  } else {
    console.error("✗ Loader output differs from both Supabase and fallback!");
    console.error("  Supabase len:", dbRow.content.length);
    console.error("  Loader  len:", fromLoader.length);
    process.exit(1);
  }
} finally {
  unlinkSync(tmpPath);
}
