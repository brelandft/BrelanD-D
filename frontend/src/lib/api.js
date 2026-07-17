import { supabase } from "./supabaseClient";

// ---------- reference data (SRD + homebrew, read-mostly) ----------

export async function loadReferenceData() {
  const [races, classes, subclasses, backgrounds, feats] = await Promise.all([
    supabase.from("races").select("*").order("name"),
    supabase.from("classes").select("*").order("name"),
    supabase.from("subclasses").select("*").order("name"),
    supabase.from("backgrounds").select("*").order("name"),
    supabase.from("feats").select("*").order("name"),
  ]);
  for (const r of [races, classes, subclasses, backgrounds, feats]) {
    if (r.error) throw r.error;
  }
  return {
    races: races.data,
    classes: classes.data,
    subclasses: subclasses.data,
    backgrounds: backgrounds.data,
    feats: feats.data,
  };
}

// ---------- characters ----------

export async function loadCharacters() {
  const { data, error } = await supabase
    .from("characters")
    .select("*, character_inventory(*)")
    .order("name");
  if (error) throw error;
  return data;
}

export function newCharacterDraft(name) {
  return {
    name: name || "New Adventurer",
    race_id: null,
    subrace_name: null,
    class_id: null,
    subclass_id: null,
    level: 1,
    background_id: null,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    skill_proficiencies: [],
    ac: 10,
    speed: 30,
    hp: { current: 10, max: 10, temp: 0 },
    hit_dice: { total: 1, current: 1, die: "d8" },
    death_saves: { success: 0, fail: 0 },
    exhaustion: 0,
    spell_slots: [],
    features_notes: "",
  };
}

export async function createCharacter(name) {
  const { data, error } = await supabase
    .from("characters")
    .insert(newCharacterDraft(name))
    .select("*, character_inventory(*)")
    .single();
  if (error) throw error;
  return data;
}

export async function updateCharacter(id, patch) {
  const { character_inventory, ...rest } = patch; // inventory saved separately
  const { data, error } = await supabase
    .from("characters")
    .update(rest)
    .eq("id", id)
    .select("*, character_inventory(*)")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCharacter(id) {
  const { error } = await supabase.from("characters").delete().eq("id", id);
  if (error) throw error;
}

export async function addInventoryItem(characterId, name) {
  const { data, error } = await supabase
    .from("character_inventory")
    .insert({ character_id: characterId, item_id: null, quantity: 1, notes: name })
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function updateInventoryRow(rowId, patch) {
  const { error } = await supabase.from("character_inventory").update(patch).eq("id", rowId);
  if (error) throw error;
}
export async function deleteInventoryRow(rowId) {
  const { error } = await supabase.from("character_inventory").delete().eq("id", rowId);
  if (error) throw error;
}

// ---------- maps & tokens ----------
// Single shared map for now (matches how the party actually plays — one
// battle map live at a time). Uploading a new image replaces it.

export async function loadOrCreateMap() {
  const { data: existing, error: fetchErr } = await supabase
    .from("maps")
    .select("*, tokens(*)")
    .order("created_at", { ascending: false })
    .limit(1);
  if (fetchErr) throw fetchErr;
  if (existing.length > 0) return existing[0];

  const { data: created, error: createErr } = await supabase
    .from("maps")
    .insert({ name: "Battle Map", image_url: "", grid: { enabled: false, cell_size: 50 } })
    .select("*, tokens(*)")
    .single();
  if (createErr) throw createErr;
  return created;
}

export async function setMapImage(mapId, imageUrl) {
  const { error } = await supabase.from("maps").update({ image_url: imageUrl }).eq("id", mapId);
  if (error) throw error;
}

export async function uploadMapImage(file) {
  const path = `maps/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("maps").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("maps").getPublicUrl(path);
  return data.publicUrl;
}

export async function addToken(mapId, { entityType, entityId, label, color, x = 50, y = 50 }) {
  const { data, error } = await supabase
    .from("tokens")
    .insert({ map_id: mapId, entity_type: entityType, entity_id: entityId, label, color, x, y })
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function moveToken(tokenId, x, y) {
  const { error } = await supabase.from("tokens").update({ x, y }).eq("id", tokenId);
  if (error) throw error;
}
export async function removeToken(tokenId) {
  const { error } = await supabase.from("tokens").delete().eq("id", tokenId);
  if (error) throw error;
}

// ---------- monsters ----------

export async function searchMonsters(query) {
  let q = supabase.from("monsters").select("*").order("name").limit(50);
  if (query) q = q.ilike("name", `%${query}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function deployMonster(mapId, monster) {
  const { data: instance, error: instErr } = await supabase
    .from("monster_instances")
    .insert({
      monster_id: monster.id,
      map_id: mapId,
      nickname: monster.name,
      hp_current: monster.hp_average,
      hp_max: monster.hp_average,
    })
    .select()
    .single();
  if (instErr) throw instErr;

  return addToken(mapId, {
    entityType: "monster_instance",
    entityId: instance.id,
    label: monster.name,
    color: "#a13d2e",
  });
}

export async function updateMonsterInstanceHp(instanceId, hpCurrent) {
  const { error } = await supabase
    .from("monster_instances")
    .update({ hp_current: hpCurrent })
    .eq("id", instanceId);
  if (error) throw error;
}

// Calls the Claude-powered Edge Function to draft a new monster and insert it.
// Requires VITE_SUPABASE_URL / VITE_APP_SHARED_SECRET in the frontend env.
export async function generateMonster(description) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-monster`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-secret": import.meta.env.VITE_APP_SHARED_SECRET,
    },
    body: JSON.stringify({ description }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Monster generation failed");
  return body.monster;
}

// ---------- app settings (shared DM PIN) ----------

export async function loadDmPin() {
  const { data, error } = await supabase.from("app_settings").select("value").eq("key", "dm_pin").maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}
export async function saveDmPin(pin) {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "dm_pin", value: pin, updated_at: new Date().toISOString() });
  if (error) throw error;
}
