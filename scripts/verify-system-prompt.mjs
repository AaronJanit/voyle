// Definitive verification for system_prompt table.
//
// The previous attempt was a false positive: PostgREST returns
//   { data: null, error: null }
// for BOTH "RLS silently rejected the write" and "operation succeeded but
// matched no rows", so checking error alone is unreliable. The only reliable
// signal is re-reading the row state after each attempted write.
//
// Run with:
//   $env:NODE_EXTRA_CA_CERTS = (Resolve-Path .\techloq-ca.pem).Path
//   node scripts/verify-system-prompt.mjs

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
for (const line of readFileSync(envPath, "utf-8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const { createClient } = await import("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_KEY missing from .env.local");
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const TAG = "HACKED_BY_VERIFY_" + Date.now();

async function readRow() {
  const { data } = await supabase
    .from("system_prompt")
    .select("id, content, active, updated_at")
    .eq("id", 1)
    .maybeSingle();
  return data ?? null;
}

async function countRows() {
  const { count } = await supabase
    .from("system_prompt")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

let failed = false;

// 1. Initial SELECT — proves the table exists and we can read it.
const before = await readRow();
if (!before) {
  console.error("✗ No row with id=1. Run supabase/system_prompt.sql first.");
  process.exit(1);
}
console.log("✓ Row found");
console.log(`  id         = ${before.id}`);
console.log(`  active     = ${before.active}`);
console.log(`  updated_at = ${before.updated_at}`);
console.log(`  length     = ${before.content.length} chars`);
console.log(`  preview    = ${JSON.stringify(before.content.slice(0, 80) + "…")}`);

// 2. UPDATE — must not change content.
await supabase.from("system_prompt").update({ content: TAG }).eq("id", 1);
const afterUpd = await readRow();
if (afterUpd?.content.includes(TAG)) {
  console.error("✗ UPDATE actually modified the row — RLS NOT enforced!");
  failed = true;
} else {
  console.log("✓ UPDATE did not modify the row (RLS rejected).");
}

// 3. INSERT — must not create a row.
await supabase.from("system_prompt").insert({ id: 2, content: TAG, active: false });
const countAfterIns = await countRows();
if (countAfterIns > 1) {
  console.error(`✗ INSERT created a row — table now has ${countAfterIns} rows!`);
  failed = true;
} else {
  console.log(`✓ INSERT did not create a row (still ${countAfterIns} row total).`);
}

// 4. DELETE — must not remove the row.
await supabase.from("system_prompt").delete().eq("id", 1);
const afterDel = await readRow();
if (afterDel === null) {
  console.error("✗ DELETE removed the row!");
  failed = true;
} else {
  console.log("✓ DELETE did not remove the row (still present).");
}

// 5. Re-confirm final content unchanged.
const final = await readRow();
if (final?.content !== before.content) {
  console.error("✗ Final row content differs from initial — something was modified!");
  failed = true;
} else {
  console.log("✓ Final row content identical to initial.");
}

if (failed) {
  console.error("\n❌ RLS NOT properly enforced. DO NOT use the publishable key.");
  process.exit(1);
} else {
  console.log("\n✅ All verifications passed. RLS is correctly enforced.");
}
