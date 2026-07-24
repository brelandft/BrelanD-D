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
//   - Safe to re-run: upserts on the (name, source) unique constraint
//     (see db/migrations/004_stable_reimports.sql), so existing rows are
//     UPDATED in place rather than deleted and reinserted. This matters
//     once real gameplay data exists — a character's race_id, a deployed
//     monster's monster_id, etc. all point at specific row IDs, and a
//     delete-then-reinsert approach would break those foreign keys the
//     moment anything real referenced this data. Upserting keeps IDs
//     stable across re-imports.
//   - Homebrew rows (source = 'homebrew') are never touched by this
//     script — it only touches rows where source = 'srd'.
//   - Requires migration 004 to have been run first (adds the unique
//     constraints this script upserts against). Without it, this will
//     fail with a "no unique or exclusion constraint" error.

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

async function upsertRows(table, rows, { chunkSize = 200 } = {}) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: "name,source" });
    if (error) {
      if (error.message?.includes("no unique or exclusion constraint")) {
        throw new Error(
          `${table} upsert failed: the (name, source) unique constraint is missing. ` +
          `Run db/migrations/004_stable_reimports.sql first. Original error: ${error.message}`
        );
      }
      throw new Error(`${table} upsert failed at row ${i}: ${error.message}`);
    }
  }
  console.log(`${table}: upserted ${rows.length} rows`);
}

async function main() {
  // Order matters: classes before subclasses (FK dependency).
  const races = await loadJson("races.json");
  await upsertRows("races", races);

  const classes = await loadJson("classes.json");
  await upsertRows("classes", classes);

  // Resolve subclasses' class_name -> class_id using the rows we just upserted.
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
  await upsertRows("subclasses", subclasses);

  const feats = await loadJson("feats.json");
  await upsertRows("feats", feats);

  const backgrounds = await loadJson("backgrounds.json");
  await upsertRows("backgrounds", backgrounds);

  const items = await loadJson("items.json");
  await upsertRows("items", items);

  const spells = await loadJson("spells.json");
  await upsertRows("spells", spells);

  const monsters = await loadJson("monsters.json");
  await upsertRows("monsters", monsters);

  console.log("Done. All SRD reference data loaded.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
