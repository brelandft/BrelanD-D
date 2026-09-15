import { supabase } from "./supabaseClient";

// ---------- campaigns ----------

export async function loadCampaigns() {
  const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createCampaign(name) {
  const { data, error } = await supabase.from("campaigns").insert({ name }).select().single();
  if (error) throw error;
  return data;
}

export async function updateCampaign(id, patch) {
  const { data, error } = await supabase.from("campaigns").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

// Cascades to that campaign's characters, maps, tokens, and monster
// instances via the existing foreign-key constraints (on delete cascade) —
// reference content (races/classes/feats/spells/items/etc.) is untouched
// since it's shared across all campaigns, not owned by any one of them.
export async function deleteCampaign(id) {
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) throw error;
}

// ---------- reference data (SRD + homebrew, read-mostly) ----------

export async function loadReferenceData() {
  const [races, classes, subclasses, backgrounds, feats, spells, items] = await Promise.all([
    supabase.from("races").select("*").order("name"),
    supabase.from("classes").select("*").order("name"),
    supabase.from("subclasses").select("*").order("name"),
    supabase.from("backgrounds").select("*").order("name"),
    supabase.from("feats").select("*").order("name"),
    supabase.from("spells").select("*").order("name"),
    supabase.from("items").select("*").order("name"),
  ]);
  for (const r of [races, classes, subclasses, backgrounds, feats, spells, items]) {
    if (r.error) throw r.error;
  }
  return {
    races: races.data,
    classes: classes.data,
    subclasses: subclasses.data,
    backgrounds: backgrounds.data,
    feats: feats.data,
    spells: spells.data,
    items: items.data,
  };
}

// ---------- characters ----------

export async function loadCharacters(campaignId) {
  const { data, error } = await supabase
    .from("characters")
    .select("*, character_inventory(*)")
    .eq("campaign_id", campaignId)
    .order("name");
  if (error) throw error;
  return data;
}

export function newCharacterDraft(name, campaignId) {
  return {
    name: name || "New Adventurer",
    campaign_id: campaignId,
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
    finalized: false,
  };
}

export async function createCharacter(name, campaignId) {
  const { data, error } = await supabase
    .from("characters")
    .insert(newCharacterDraft(name, campaignId))
    .select("*, character_inventory(*)")
    .single();
  if (error) throw error;
  return data;
}

// Clones a character's current state into a different campaign as a new,
// independent row — future progress in either campaign never affects the
// other. This is deliberately a copy, not a shared link: characters are
// meant to be campaign-scoped, but starting a new game with "the same
// character" shouldn't mean retyping the whole sheet.
export async function importCharacterToCampaign(sourceCharacterId, targetCampaignId) {
  const { data: source, error: fetchErr } = await supabase
    .from("characters")
    .select("*, character_inventory(*)")
    .eq("id", sourceCharacterId)
    .single();
  if (fetchErr) throw fetchErr;

  const { id, campaign_id, created_at, updated_at, character_inventory, ...rest } = source;
  const { data: cloned, error: insertErr } = await supabase
    .from("characters")
    .insert({ ...rest, campaign_id: targetCampaignId })
    .select()
    .single();
  if (insertErr) throw insertErr;

  let clonedInventory = [];
  if (character_inventory.length > 0) {
    const rows = character_inventory.map(({ id, character_id, ...itemRest }) => ({
      ...itemRest,
      character_id: cloned.id,
    }));
    const { data: insertedRows, error: invErr } = await supabase
      .from("character_inventory")
      .insert(rows)
      .select();
    if (invErr) throw invErr;
    clonedInventory = insertedRows;
  }

  return { ...cloned, character_inventory: clonedInventory };
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

export async function addInventoryItem(characterId, { itemId = null, notes = "" } = {}) {
  const { data, error } = await supabase
    .from("character_inventory")
    .insert({ character_id: characterId, item_id: itemId, quantity: 1, notes })
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
// A campaign can have several pre-loaded maps (for pre-planning multiple
// battles); one is "active" at a time — that's the one players see.

export async function loadMaps(campaignId) {
  const { data, error } = await supabase
    .from("maps")
    .select("*, tokens(*)")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createMap(campaignId, name) {
  const { data, error } = await supabase
    .from("maps")
    .insert({ campaign_id: campaignId, name: name || "New Map", image_url: "", grid: { enabled: false, cell_size: 50 } })
    .select("*, tokens(*)")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMap(mapId) {
  const { error } = await supabase.from("maps").delete().eq("id", mapId);
  if (error) throw error;
}

export async function renameMap(mapId, name) {
  const { error } = await supabase.from("maps").update({ name }).eq("id", mapId);
  if (error) throw error;
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

// ---------- session notes / encounters ----------

export async function loadCampaignNotes(campaignId) {
  const { data, error } = await supabase
    .from("campaign_notes")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createCampaignNote(campaignId, fields) {
  const { data, error } = await supabase
    .from("campaign_notes")
    .insert({ campaign_id: campaignId, ...fields })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCampaignNote(id, patch) {
  const { data, error } = await supabase.from("campaign_notes").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCampaignNote(id) {
  const { error } = await supabase.from("campaign_notes").delete().eq("id", id);
  if (error) throw error;
}

export async function addToken(mapId, { entityType, entityId, label, color, x = 50, y = 50, hpCurrent = null, hpMax = null, spriteKey = null, spriteColor = null }) {
  const { data, error } = await supabase
    .from("tokens")
    .insert({ map_id: mapId, entity_type: entityType, entity_id: entityId, label, color, x, y, hp_current: hpCurrent, hp_max: hpMax, sprite_key: spriteKey, sprite_color: spriteColor })
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
    hpCurrent: monster.hp_average,
    hpMax: monster.hp_average,
    spriteKey: monster.sprite_key || "beast",
  });
}

export async function updateMonsterInstanceHp(instanceId, hpCurrent, hpMax) {
  const { error } = await supabase
    .from("monster_instances")
    .update({ hp_current: hpCurrent })
    .eq("id", instanceId);
  if (error) throw error;
  await syncTokenHp("monster_instance", instanceId, hpCurrent, hpMax);
}

// Same idea for character tokens — only touches hp.current, preserving
// hp.max/hp.temp already on the sheet.
export async function updateCharacterHp(characterId, hpCurrent) {
  const { data: current, error: fetchErr } = await supabase.from("characters").select("hp").eq("id", characterId).single();
  if (fetchErr) throw fetchErr;
  const hp = { ...(current?.hp || {}), current: hpCurrent };
  const { error } = await supabase.from("characters").update({ hp }).eq("id", characterId);
  if (error) throw error;
  await syncTokenHp("character", characterId, hpCurrent, hp.max);
  return hp;
}

// Quick-reference combat stats (AC + main-hand attack) for whatever tokens
// are currently on the map — fetched live so it always matches the sheet,
// rather than denormalizing onto the token row.
export async function loadCombatStats(tokens) {
  const stats = {};
  const charIds = tokens.filter((t) => t.entity_type === "character").map((t) => t.entity_id);
  const instanceIds = tokens.filter((t) => t.entity_type === "monster_instance").map((t) => t.entity_id);

  if (charIds.length) {
    const { data: chars, error: e1 } = await supabase.from("characters").select("id, ac").in("id", charIds);
    if (e1) throw e1;
    for (const c of chars || []) stats[c.id] = { ac: c.ac };

    const { data: inv, error: e2 } = await supabase
      .from("character_inventory")
      .select("character_id, items(name, damage)")
      .in("character_id", charIds)
      .eq("slot", "main_hand");
    if (e2) throw e2;
    for (const row of inv || []) {
      if (!row.items) continue;
      stats[row.character_id] = {
        ...(stats[row.character_id] || {}),
        mainAttackName: row.items.name,
        mainAttackDamage: row.items.damage ? `${row.items.damage.dice} ${row.items.damage.type}` : null,
      };
    }
  }

  if (instanceIds.length) {
    const { data: instances, error: e3 } = await supabase
      .from("monster_instances")
      .select("id, monsters(ac, actions)")
      .in("id", instanceIds);
    if (e3) throw e3;
    for (const inst of instances || []) {
      if (!inst.monsters) continue;
      const firstAction = (inst.monsters.actions || [])[0];
      stats[inst.id] = {
        ac: inst.monsters.ac,
        mainAttackName: firstAction?.name || null,
        mainAttackDamage: firstAction?.description || null,
      };
    }
  }

  return stats;
}

// Keeps a token's denormalized HP display in sync after the underlying
// character/monster's HP changes. There's no live cross-screen sync yet
// (see README), so this only updates the database row — the local map
// state in App.jsx is updated separately for whoever's screen triggered it.
export async function syncTokenHp(entityType, entityId, hpCurrent, hpMax) {
  const { error } = await supabase
    .from("tokens")
    .update({ hp_current: hpCurrent, hp_max: hpMax })
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);
  if (error) throw error;
}

// ---------- homebrew content (all write directly to Supabase — no API key, no server needed) ----------

export async function createMonster(monster) {
  const { data, error } = await supabase
    .from("monsters")
    .insert({ ...monster, source: "homebrew" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createItem(item) {
  const { data, error } = await supabase
    .from("items")
    .insert({ ...item, source: "homebrew" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createSpell(spell) {
  const { data, error } = await supabase
    .from("spells")
    .insert({ ...spell, source: "homebrew" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createBackground(background) {
  const { data, error } = await supabase
    .from("backgrounds")
    .insert({ ...background, source: "homebrew" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createFeat(feat) {
  const { data, error } = await supabase
    .from("feats")
    .insert({ ...feat, source: "homebrew" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createSubclass(subclass) {
  const { data, error } = await supabase
    .from("subclasses")
    .insert({ ...subclass, source: "homebrew" })
    .select()
    .single();
  if (error) throw error;
  return data;
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
