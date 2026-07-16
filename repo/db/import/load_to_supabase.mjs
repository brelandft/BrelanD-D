// load_to_supabase.mjs
//
// Pushes the transformed SRD seed data (db/seed/srd/*.json) into Supabase.
// Run this once the Supabase project + schema.sql have been set up.
//
// Usage:
//   npm install @supabase/supabase-js
//   SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
//   node load_to_supabase.mjs
//
// Notes:
//   - Uses the SERVICE ROLE key (not the anon key) because it needs to
//     bypass the read-only RLS policies on reference tables. Never ship
//     the service role key to the frontend — this script only ever runs
//     locally / in CI, not in the browser.
//   - Safe to re-run: reference tables are cleared and reinserted each
//     time (idempotent), so re-running after a dataset update is fine.
//   - Homebrew rows (source = 'homebrew') are never touched by this
//     script — it only deletes/reinserts rows where source = 'srd'.

import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.join(__dirname, "..", "seed", "srd");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function loadJson(filename) {
  const raw = await readFile(path.join(SEED_DIR, filename), "utf-8");
  return JSON.parse(raw);
}

async function replaceSrdRows(table, rows, { chunkSize = 200 } = {}) {
  const { error: delErr } = await supabase.from(table).delete().eq("source", "srd");
  if (delErr) throw new Error(`${table} delete failed: ${delErr.message}`);

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw new Error(`${table} insert failed at row ${i}: ${error.message}`);
  }
  console.log(`${table}: loaded ${rows.length} rows`);
}

async function main() {
  // Order matters: classes before subclasses (FK dependency).
  const races = await loadJson("races.json");
  await replaceSrdRows("races", races);

  const classes = await loadJson("classes.json");
  await replaceSrdRows("classes", classes);

  // Resolve subclasses' class_name -> class_id using the rows we just inserted.
  const { data: classRows, error: classErr } = await supabase
    .from("classes")
    .select("id, name")
    .eq("source", "srd");
  if (classErr) throw new Error(`fetching classes failed: ${classErr.message}`);
  const classIdByName = Object.fromEntries(classRows.map((c) => [c.name, c.id]));

  const subclassesRaw = await loadJson("subclasses.json");
  const subclasses = subclassesRaw.map(({ class_name, ...rest }) => ({
    ...rest,
    class_id: classIdByName[class_name],
  }));
  await replaceSrdRows("subclasses", subclasses);

  const feats = await loadJson("feats.json");
  await replaceSrdRows("feats", feats);

  const backgrounds = await loadJson("backgrounds.json");
  await replaceSrdRows("backgrounds", backgrounds);

  const items = await loadJson("items.json");
  await replaceSrdRows("items", items);

  const spells = await loadJson("spells.json");
  await replaceSrdRows("spells", spells);

  const monsters = await loadJson("monsters.json");
  await replaceSrdRows("monsters", monsters);

  console.log("Done. All SRD reference data loaded.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
