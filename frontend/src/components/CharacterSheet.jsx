import React, { useState } from "react";
import { Trash2, Heart, ScrollText, Backpack, Sparkles, X, Plus, Star, BookOpen, Zap } from "lucide-react";
import { T, fontDisplay, fontBody, fontMono, ABILITIES, SKILLS, mod, fmtMod, profBonusForLevel } from "../lib/gameData";
import { IconBtn, NumberField, TextField, SelectField, StaticField } from "./atoms";
import { COLOR_OPTIONS, TokenSprite, classImageFor, COLOR_HEX } from "../lib/sprites";
import { useDebouncedField } from "../lib/hooks";
import {
  updateCharacter, addInventoryItem, updateInventoryRow, deleteInventoryRow,
} from "../lib/api";
import AddFeatForm from "./AddFeatForm";
import AddSpellForm from "./AddSpellForm";
import AddItemForm from "./AddItemForm";

const SLOT_LABELS = { armor: "Armor", shield: "Shield", main_hand: "Main Hand", off_hand: "Off Hand" };
function slotOptionsForItem(item) {
  if (!item) return [];
  if (item.item_type === "armor") return [{ id: "armor", name: "Armor" }];
  if (item.item_type === "shield") return [{ id: "shield", name: "Shield" }];
  if (item.item_type === "weapon") return [{ id: "main_hand", name: "Main Hand" }, { id: "off_hand", name: "Off Hand" }];
  return [];
}
function itemStatLine(item) {
  if (!item) return "";
  const parts = [];
  if (item.damage) parts.push(`${item.damage.dice} ${item.damage.type}`);
  if (item.armor_class) parts.push(`AC ${item.armor_class.base}${item.armor_class.dex_bonus ? " + Dex" : ""}`);
  if (item.properties && item.properties.length > 0) parts.push(item.properties.join(", "));
  return parts.join(" · ");
}

function HPTracker({ character, onUpdate }) {
  const [amount, setAmount] = useState("");
  const hp = character.hp;

  const [maxHp, setMaxHp, flushMaxHp] = useDebouncedField(hp.max, (v) => onUpdate({ hp: { ...hp, max: Number(v) || 0 } }));
  const [tempHp, setTempHp, flushTempHp] = useDebouncedField(hp.temp, (v) => onUpdate({ hp: { ...hp, temp: Math.max(0, Number(v) || 0) } }));
  const [hdCurrent, setHdCurrent, flushHdCurrent] = useDebouncedField(character.hit_dice.current, (v) => onUpdate({ hit_dice: { ...character.hit_dice, current: Number(v) || 0 } }));
  const [hdTotal, setHdTotal, flushHdTotal] = useDebouncedField(character.hit_dice.total, (v) => onUpdate({ hit_dice: { ...character.hit_dice, total: Number(v) || 0 } }));
  const [hdDie, setHdDie, flushHdDie] = useDebouncedField(character.hit_dice.die, (v) => onUpdate({ hit_dice: { ...character.hit_dice, die: v } }));
  const [exhaustion, setExhaustion, flushExhaustion] = useDebouncedField(character.exhaustion, (v) => onUpdate({ exhaustion: Math.max(0, Math.min(6, Number(v) || 0)) }));

  function applyDamage() {
    const dmg = Number(amount) || 0;
    if (dmg <= 0) return;
    let temp = hp.temp, remaining = dmg;
    if (temp > 0) { if (temp >= remaining) { temp -= remaining; remaining = 0; } else { remaining -= temp; temp = 0; } }
    const current = Math.max(0, hp.current - remaining);
    onUpdate({ hp: { ...hp, current, temp } });
    setAmount("");
  }
  function applyHeal() {
    const heal = Number(amount) || 0;
    if (heal <= 0) return;
    const current = Math.min(hp.max, hp.current + heal);
    const deathSaves = current > 0 ? { success: 0, fail: 0 } : character.death_saves;
    onUpdate({ hp: { ...hp, current }, death_saves: deathSaves });
    setAmount("");
  }
  function setDeathSave(kind, n) { onUpdate({ death_saves: { ...character.death_saves, [kind]: n } }); }

  const pct = hp.max > 0 ? Math.max(0, Math.min(100, (hp.current / hp.max) * 100)) : 0;

  return (
    <div className="rounded-lg p-4" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
      <div className="flex items-center gap-2 mb-3">
        <Heart size={16} color={T.blood} />
        <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Hit Points</span>
      </div>
      <div className="flex items-end gap-4 mb-3 flex-wrap">
        <div>
          <div style={{ ...fontMono, fontSize: "36px", color: T.parchment, lineHeight: 1 }}>
            {hp.current}<span style={{ color: T.parchmentDim, fontSize: "20px" }}> / {hp.max}</span>
          </div>
          {hp.temp > 0 && <div className="text-xs mt-1" style={{ ...fontMono, color: T.gold }}>+{hp.temp} temp</div>}
        </div>
        <div className="flex-1 min-w-[120px]">
          <div className="h-3 rounded-full overflow-hidden" style={{ background: T.void, border: `1px solid ${T.line}` }}>
            <div className="h-full transition-all" style={{ width: `${pct}%`, background: pct > 50 ? T.moss : pct > 20 ? T.gold : T.blood }} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-2 mb-3">
        <NumberField label="Max HP" value={maxHp} onChange={setMaxHp} onBlur={flushMaxHp} />
        <NumberField label="Temp HP" value={tempHp} onChange={setTempHp} onBlur={flushTempHp} />
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider" style={{ ...fontBody, color: T.parchmentDim }}>Apply</span>
          <div className="flex gap-1">
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
              className="w-16 rounded px-2 py-1 text-center outline-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontMono }} />
            <button onClick={applyDamage} className="rounded px-2 py-1 text-xs" style={{ background: T.bloodDim, border: `1px solid ${T.blood}`, color: T.parchment, ...fontBody }}>Damage</button>
            <button onClick={applyHeal} className="rounded px-2 py-1 text-xs" style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment, ...fontBody }}>Heal</button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ ...fontBody, color: T.parchmentDim }}>Hit Dice</span>
          <div className="flex gap-1 items-center">
            <NumberField value={hdCurrent} onChange={setHdCurrent} onBlur={flushHdCurrent} small />
            <span style={{ color: T.parchmentDim, ...fontMono }}>/</span>
            <NumberField value={hdTotal} onChange={setHdTotal} onBlur={flushHdTotal} small />
            <input value={hdDie} onChange={(e) => setHdDie(e.target.value)} onBlur={flushHdDie}
              className="w-12 rounded px-1 py-1 text-center outline-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontMono }} />
          </div>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ ...fontBody, color: T.parchmentDim }}>Exhaustion</span>
          <NumberField value={exhaustion} onChange={setExhaustion} onBlur={flushExhaustion} small />
        </div>
        {hp.current === 0 && (
          <div>
            <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ ...fontBody, color: T.blood }}>Death Saves</span>
            <div className="flex gap-3">
              <div className="flex gap-1 items-center">
                <span className="text-[10px]" style={{ color: T.parchmentDim, ...fontBody }}>S</span>
                {[1, 2, 3].map((n) => (
                  <button key={n} onClick={() => setDeathSave("success", character.death_saves.success >= n ? n - 1 : n)}
                    className="w-4 h-4 rounded-full" style={{ background: character.death_saves.success >= n ? T.moss : T.void, border: `1px solid ${T.moss}` }} />
                ))}
              </div>
              <div className="flex gap-1 items-center">
                <span className="text-[10px]" style={{ color: T.parchmentDim, ...fontBody }}>F</span>
                {[1, 2, 3].map((n) => (
                  <button key={n} onClick={() => setDeathSave("fail", character.death_saves.fail >= n ? n - 1 : n)}
                    className="w-4 h-4 rounded-full" style={{ background: character.death_saves.fail >= n ? T.blood : T.void, border: `1px solid ${T.blood}` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AbilityScoreBox({ ab, value, onCommit, editable }) {
  const [local, setLocal, flush] = useDebouncedField(value, onCommit);
  return (
    <div className="rounded p-2 text-center" style={{ background: T.void, border: `1px solid ${T.line}` }}>
      <div className="text-[10px] uppercase" style={{ ...fontBody, color: T.parchmentDim }}>{ab}</div>
      {editable ? (
        <input type="number" value={local} onChange={(e) => setLocal(e.target.value)} onBlur={flush}
          className="w-full bg-transparent text-center outline-none" style={{ ...fontMono, color: T.parchment, fontSize: "20px" }} />
      ) : (
        <div style={{ ...fontMono, color: T.parchmentDim, fontSize: "20px" }}>{value}</div>
      )}
      <div style={{ ...fontMono, color: T.gold, fontSize: "13px" }}>{fmtMod(mod(value))}</div>
    </div>
  );
}

function InventoryRow({ row, item, onPatch, onSetSlot, onRemove }) {
  const [notes, setNotes, flushNotes] = useDebouncedField(row.notes || "", (v) => onPatch(row.id, { notes: v }));
  const [qty, setQty, flushQty] = useDebouncedField(row.quantity, (v) => onPatch(row.id, { quantity: Number(v) || 0 }));
  const slotOptions = slotOptionsForItem(item);

  return (
    <div className="rounded p-2 flex flex-col gap-1.5" style={{ background: T.void, border: `1px solid ${T.line}` }}>
      <div className="flex gap-1.5 items-center">
        {item ? (
          <span className="flex-1 min-w-0 text-sm truncate" style={{ color: T.parchment, ...fontBody }}>
            {item.name}
            {item.source === "homebrew" && <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded" style={{ background: T.panel2, color: T.parchmentDim, ...fontBody }}>homebrew</span>}
          </span>
        ) : (
          <input value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={flushNotes} placeholder="Item"
            className="flex-1 min-w-0 rounded px-2 py-1 text-sm outline-none" style={{ background: T.panel2, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
        )}
        <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} onBlur={flushQty}
          className="w-12 rounded px-1 py-1 text-center outline-none" style={{ background: T.panel2, color: T.parchment, border: `1px solid ${T.line}`, ...fontMono }} />
        <IconBtn onClick={() => onRemove(row.id)} title="Remove" danger><X size={13} /></IconBtn>
      </div>
      {item && (
        <>
          {itemStatLine(item) && <div className="text-[11px]" style={{ color: T.parchmentDim, ...fontBody }}>{itemStatLine(item)}</div>}
          {item.description && <div className="text-[11px]" style={{ color: T.parchmentDim, ...fontBody }}>{item.description}</div>}
          <div className="flex gap-3 items-center flex-wrap">
            {slotOptions.length > 0 && (
              <SelectField label="Slot" value={row.slot || ""} onChange={(v) => onSetSlot(row.id, v)} options={slotOptions} small />
            )}
            <label className="flex items-center gap-1 text-[11px]" style={{ color: T.parchmentDim, ...fontBody }}>
              <input type="checkbox" checked={!!row.equipped} onChange={(e) => onPatch(row.id, { equipped: e.target.checked })} /> Worn/in use
            </label>
            {item.requires_attunement && (
              <label className="flex items-center gap-1 text-[11px]" style={{ color: T.parchmentDim, ...fontBody }}>
                <input type="checkbox" checked={!!row.attuned} onChange={(e) => onPatch(row.id, { attuned: e.target.checked })} /> Attuned
              </label>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AbilityRow({ ability, idx, onUpdate, onRemove }) {
  const [name, setName, flushName] = useDebouncedField(ability.name, (v) => onUpdate(idx, { name: v }));
  const [description, setDescription, flushDescription] = useDebouncedField(ability.description, (v) => onUpdate(idx, { description: v }));
  const [usesCurrent, setUsesCurrent, flushUsesCurrent] = useDebouncedField(ability.uses_current, (v) => onUpdate(idx, { uses_current: Number(v) || 0 }));
  const [usesMax, setUsesMax, flushUsesMax] = useDebouncedField(ability.uses_max, (v) => onUpdate(idx, { uses_max: Number(v) || 0 }));
  const [recharge, setRecharge, flushRecharge] = useDebouncedField(ability.recharge, (v) => onUpdate(idx, { recharge: v }));

  return (
    <div className="rounded p-2 flex flex-col gap-1.5" style={{ background: T.void, border: `1px solid ${T.line}` }}>
      <div className="flex gap-1.5">
        <input value={name} onChange={(e) => setName(e.target.value)} onBlur={flushName} placeholder="Ability name"
          className="flex-1 rounded px-2 py-1 text-sm outline-none" style={{ background: T.panel2, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
        <IconBtn onClick={() => onRemove(idx)} title="Remove" danger><X size={13} /></IconBtn>
      </div>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} onBlur={flushDescription} placeholder="Description" rows={2}
        className="rounded px-2 py-1 text-sm outline-none resize-none" style={{ background: T.panel2, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: T.parchmentDim, ...fontBody }}>Uses</span>
        <NumberField value={usesCurrent} onChange={setUsesCurrent} onBlur={flushUsesCurrent} small />
        <span style={{ color: T.parchmentDim, ...fontMono }}>/</span>
        <NumberField value={usesMax} onChange={setUsesMax} onBlur={flushUsesMax} small />
        <TextField label="Recharge" value={recharge} onChange={setRecharge} onBlur={flushRecharge} placeholder="e.g. Short Rest" />
      </div>
    </div>
  );
}

export default function CharacterSheet({ character, referenceData, onChanged, onDelete, onReferenceDataChanged, isDM = false }) {
  const profBonus = profBonusForLevel(character.level);
  const canEditStats = isDM || !character.finalized;
  const { races, classes, subclasses, backgrounds, feats, spells, items } = referenceData;
  const subraces = races.find((r) => r.id === character.race_id)?.subraces || [];
  const availableSubclasses = subclasses.filter((sc) => sc.class_id === character.class_id);
  const currentClass = classes.find((c) => c.id === character.class_id);
  const currentSubclass = subclasses.find((s) => s.id === character.subclass_id);
  const originFeatName = backgrounds.find((b) => b.id === character.background_id)?.origin_feat_name;

  async function patch(fields) {
    const updated = await updateCharacter(character.id, fields);
    onChanged(updated);
  }
  const [nameLocal, setNameLocal, flushName] = useDebouncedField(character.name, (v) => patch({ name: v }));
  const [acLocal, setAcLocal, flushAc] = useDebouncedField(character.ac, (v) => patch({ ac: Number(v) || 0 }));
  const [speedLocal, setSpeedLocal, flushSpeed] = useDebouncedField(character.speed, (v) => patch({ speed: Number(v) || 0 }));
  const [levelLocal, setLevelLocal, flushLevel] = useDebouncedField(character.level, (v) => patch({ level: Number(v) || 1 }));
  const [notesLocal, setNotesLocal, flushNotesField] = useDebouncedField(character.features_notes || "", (v) => patch({ features_notes: v }));

  function setAbility(ab, value) {
    patch({ abilities: { ...character.abilities, [ab]: value === "" ? "" : Number(value) } });
  }
  function toggleSkill(skill) {
    const has = character.skill_proficiencies.includes(skill);
    patch({ skill_proficiencies: has ? character.skill_proficiencies.filter((s) => s !== skill) : [...character.skill_proficiencies, skill] });
  }

  async function addItem() {
    const row = await addInventoryItem(character.id, {});
    onChanged({ ...character, character_inventory: [...character.character_inventory, row] });
  }
  async function addCatalogItem(itemId) {
    if (!itemId) return;
    const row = await addInventoryItem(character.id, { itemId });
    onChanged({ ...character, character_inventory: [...character.character_inventory, row] });
  }
  async function patchItem(rowId, fields) {
    await updateInventoryRow(rowId, fields);
    onChanged({ ...character, character_inventory: character.character_inventory.map((r) => (r.id === rowId ? { ...r, ...fields } : r)) });
  }
  async function removeItem(rowId) {
    await deleteInventoryRow(rowId);
    onChanged({ ...character, character_inventory: character.character_inventory.filter((r) => r.id !== rowId) });
  }
  async function setSlot(rowId, slot) {
    const occupant = slot ? character.character_inventory.find((r) => r.slot === slot && r.id !== rowId) : null;
    if (occupant) await updateInventoryRow(occupant.id, { slot: null });
    await updateInventoryRow(rowId, { slot });
    onChanged({
      ...character,
      character_inventory: character.character_inventory.map((r) => {
        if (r.id === rowId) return { ...r, slot };
        if (occupant && r.id === occupant.id) return { ...r, slot: null };
        return r;
      }),
    });
  }
  function itemFor(row) {
    return row.item_id ? items.find((i) => i.id === row.item_id) : null;
  }
  const [showItemForm, setShowItemForm] = useState(false);
  function handleItemCreated(item) {
    onReferenceDataChanged?.("items", item);
    addCatalogItem(item.id);
    setShowItemForm(false);
  }

  function updateSlot(idx, fields) {
    const slots = character.spell_slots.map((s, i) => (i === idx ? { ...s, ...fields } : s));
    patch({ spell_slots: slots });
  }
  function addSlot() {
    patch({ spell_slots: [...character.spell_slots, { level: character.spell_slots.length + 1, total: 1, used: 0 }] });
  }
  function removeSlot(idx) {
    patch({ spell_slots: character.spell_slots.filter((_, i) => i !== idx) });
  }

  // ---------- feats ----------
  const [showFeatForm, setShowFeatForm] = useState(false);
  const characterFeats = (character.feat_ids || []).map((id) => feats.find((f) => f.id === id)).filter(Boolean);
  const availableFeats = feats.filter((f) => !(character.feat_ids || []).includes(f.id));
  function addFeat(id) {
    if (!id || (character.feat_ids || []).includes(id)) return;
    patch({ feat_ids: [...(character.feat_ids || []), id] });
  }
  function removeFeat(id) {
    patch({ feat_ids: (character.feat_ids || []).filter((fid) => fid !== id) });
  }
  function handleFeatCreated(item) {
    onReferenceDataChanged?.("feats", item);
    addFeat(item.id);
    setShowFeatForm(false);
  }

  // ---------- known spells ----------
  const [showSpellForm, setShowSpellForm] = useState(false);
  const [showAllClassSpells, setShowAllClassSpells] = useState(false);
  const knownSpells = (character.spells_known || [])
    .map((ks) => ({ ...ks, spell: spells.find((s) => s.id === ks.spell_id) }))
    .filter((row) => row.spell);
  const availableSpells = spells.filter((s) => {
    if ((character.spells_known || []).some((ks) => ks.spell_id === s.id)) return false;
    if (showAllClassSpells || !currentClass) return true;
    return (s.classes || []).some((cn) => cn.toLowerCase() === currentClass.name.toLowerCase());
  });
  function addSpell(id) {
    if (!id || (character.spells_known || []).some((ks) => ks.spell_id === id)) return;
    patch({ spells_known: [...(character.spells_known || []), { spell_id: id, prepared: false }] });
  }
  function removeSpell(id) {
    patch({ spells_known: (character.spells_known || []).filter((ks) => ks.spell_id !== id) });
  }
  function toggleSpellPrepared(id) {
    patch({ spells_known: (character.spells_known || []).map((ks) => (ks.spell_id === id ? { ...ks, prepared: !ks.prepared } : ks)) });
  }
  function handleSpellCreated(item) {
    onReferenceDataChanged?.("spells", item);
    addSpell(item.id);
    setShowSpellForm(false);
  }

  // ---------- tracked abilities ----------
  function updateAbility(idx, fields) {
    patch({ abilities_known: (character.abilities_known || []).map((a, i) => (i === idx ? { ...a, ...fields } : a)) });
  }
  function addAbility() {
    patch({ abilities_known: [...(character.abilities_known || []), { name: "", description: "", uses_max: 0, uses_current: 0, recharge: "" }] });
  }
  function removeAbility(idx) {
    patch({ abilities_known: (character.abilities_known || []).filter((_, i) => i !== idx) });
  }
  function featuresUpToLevel(entity) {
    if (!entity?.features_by_level) return [];
    return Object.entries(entity.features_by_level)
      .filter(([lvl]) => Number(lvl) <= character.level)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .flatMap(([lvl, list]) => list.map((f) => ({ ...f, level: Number(lvl) })));
  }
  const referenceFeatures = [...featuresUpToLevel(currentClass), ...featuresUpToLevel(currentSubclass)];

  return (
    <div className="flex flex-col gap-4 p-4 max-w-5xl">
      <div className="rounded-lg p-4" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
        <div className="flex justify-between items-start mb-3">
          <input value={nameLocal} onChange={(e) => setNameLocal(e.target.value)} onBlur={flushName} className="bg-transparent outline-none w-full"
            style={{ ...fontDisplay, color: T.parchment, fontSize: "32px", fontWeight: 700 }} />
          {isDM && <IconBtn onClick={() => onDelete(character.id)} title="Delete character" danger><Trash2 size={15} /></IconBtn>}
        </div>
        <div className="flex items-center gap-3 mb-3">
          <TokenSprite image={classImageFor(character.class_name)} backdropColor={COLOR_HEX[character.sprite_color] || COLOR_HEX.blue} size={56} />
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider" style={{ ...fontBody, color: T.parchmentDim }}>Token Color</span>
            {COLOR_OPTIONS.map((c) => (
              <button key={c.key} onClick={() => patch({ sprite_color: c.key })} title={c.label}
                className="w-5 h-5 rounded-full"
                style={{ background: c.hex, border: character.sprite_color === c.key ? `2px solid ${T.parchment}` : "2px solid transparent" }} />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEditStats ? (
            <>
              <SelectField label="Race" value={character.race_id} onChange={(v) => patch({ race_id: v, subrace_name: null })} options={races} small />
              {subraces.length > 0 && (
                <SelectField label="Subrace" value={character.subrace_name} onChange={(v) => patch({ subrace_name: v })}
                  options={subraces.map((sr) => ({ id: sr.name, name: sr.name }))} small />
              )}
              <SelectField label="Class" value={character.class_id} onChange={(v) => patch({ class_id: v, subclass_id: null })} options={classes} small />
              {availableSubclasses.length > 0 && (
                <SelectField label="Subclass" value={character.subclass_id} onChange={(v) => patch({ subclass_id: v })} options={availableSubclasses} small />
              )}
              <NumberField label="Level" value={levelLocal} onChange={setLevelLocal} onBlur={flushLevel} small />
              <SelectField label="Background" value={character.background_id} onChange={(v) => patch({ background_id: v })} options={backgrounds} small />
            </>
          ) : (
            <>
              <StaticField label="Race" value={races.find((r) => r.id === character.race_id)?.name} small />
              {character.subrace_name && <StaticField label="Subrace" value={character.subrace_name} small />}
              <StaticField label="Class" value={classes.find((c) => c.id === character.class_id)?.name} small />
              {character.subclass_id && <StaticField label="Subclass" value={subclasses.find((s) => s.id === character.subclass_id)?.name} small />}
              <StaticField label="Level" value={character.level} small />
              <StaticField label="Background" value={backgrounds.find((b) => b.id === character.background_id)?.name} small />
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {canEditStats ? (
            <>
              <NumberField label="Armor Class" value={acLocal} onChange={setAcLocal} onBlur={flushAc} small />
              <NumberField label="Speed" value={speedLocal} onChange={setSpeedLocal} onBlur={flushSpeed} small />
            </>
          ) : (
            <>
              <StaticField label="Armor Class" value={character.ac} small />
              <StaticField label="Speed" value={character.speed} small />
            </>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ ...fontBody, color: T.parchmentDim }}>Prof. Bonus</span>
            <div className="w-14 rounded px-2 py-1 text-center" style={{ ...fontMono, color: T.gold, border: `1px solid ${T.line}` }}>{fmtMod(profBonus)}</div>
          </div>
        </div>
        {!character.finalized ? (
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span className="text-xs px-2 py-1 rounded" style={{ background: T.mossDim, color: T.parchment, ...fontBody }}>Draft — still being built</span>
            <button onClick={() => patch({ finalized: true })} className="text-xs rounded px-3 py-1.5"
              style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment, ...fontBody }}>
              Complete Character Creation
            </button>
            <span className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>Locks race, class, level, background, and ability scores to DM-only edits.</span>
          </div>
        ) : (
          <>
            {!isDM && (
              <p className="text-xs mt-3" style={{ color: T.parchmentDim, ...fontBody }}>
                Race, class, level, and other core stats are set by your DM. Ask them to make changes.
              </p>
            )}
            {isDM && (
              <button onClick={() => patch({ finalized: false })} className="text-xs mt-3" style={{ color: T.parchmentDim, ...fontBody }}>
                Reopen for character creation editing
              </button>
            )}
          </>
        )}
      </div>

      <HPTracker character={character} onUpdate={patch} />

      <div className="rounded-lg p-4" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
        <div className="text-xs uppercase tracking-widest mb-3" style={{ ...fontBody, color: T.gold }}>Ability Scores</div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ABILITIES.map((ab) => (
            <AbilityScoreBox key={ab} ab={ab} value={character.abilities[ab]} editable={canEditStats}
              onCommit={(v) => setAbility(ab, v)} />
          ))}
        </div>
      </div>

      <div className="rounded-lg p-4" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
        <div className="flex items-center gap-2 mb-3">
          <ScrollText size={15} color={T.gold} />
          <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Skills</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
          {SKILLS.map(([name, ab]) => {
            const proficient = character.skill_proficiencies.includes(name);
            const bonus = mod(character.abilities[ab]) + (proficient ? profBonus : 0);
            return (
              <div key={name} className="flex items-center gap-2 py-0.5">
                <button onClick={() => canEditStats && toggleSkill(name)} disabled={!canEditStats} className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{ background: proficient ? T.gold : T.void, border: `1px solid ${T.gold}`, cursor: canEditStats ? "pointer" : "default" }} />
                <span className="text-sm flex-1" style={{ ...fontBody, color: T.parchment }}>{name} <span style={{ color: T.parchmentDim, fontSize: "11px" }}>({ab})</span></span>
                <span style={{ ...fontMono, color: T.parchmentDim, fontSize: "13px", width: "28px", textAlign: "right" }}>{fmtMod(bonus)}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-xs" style={{ ...fontBody, color: T.parchmentDim }}>
          Passive Perception: <span style={{ ...fontMono, color: T.gold }}>{10 + mod(character.abilities.wis) + (character.skill_proficiencies.includes("Perception") ? profBonus : 0)}</span>
        </div>
      </div>

      <div className="rounded-lg p-4" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star size={15} color={T.gold} />
            <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Feats</span>
          </div>
          {!showFeatForm && (
            <button onClick={() => setShowFeatForm(true)} className="text-xs rounded px-2 py-1"
              style={{ background: T.panel2, border: `1px solid ${T.line}`, color: T.parchmentDim, ...fontBody }}>
              + Add custom feat
            </button>
          )}
        </div>
        {showFeatForm && <div className="mb-3"><AddFeatForm onCreated={handleFeatCreated} onCancel={() => setShowFeatForm(false)} /></div>}
        <SelectField label="Add a feat" value="" onChange={addFeat} options={availableFeats} />
        <div className="flex flex-col gap-1.5 mt-3">
          {characterFeats.map((f) => {
            const isOriginFeat = originFeatName && f.name.toLowerCase() === originFeatName.toLowerCase();
            return (
              <div key={f.id} className="rounded p-2 flex items-start justify-between gap-2" style={{ background: T.void, border: `1px solid ${T.line}` }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span style={{ ...fontBody, color: T.parchment, fontSize: "13px", fontWeight: 600 }}>{f.name}</span>
                    {isOriginFeat && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: T.mossDim, color: T.parchment, ...fontBody }}>
                        Origin feat for {backgrounds.find((b) => b.id === character.background_id)?.name}
                      </span>
                    )}
                    {f.source === "homebrew" && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: T.panel2, color: T.parchmentDim, ...fontBody }}>homebrew</span>}
                  </div>
                  {f.prerequisite && <div className="text-[11px]" style={{ color: T.parchmentDim, ...fontBody }}>Prerequisite: {f.prerequisite}</div>}
                  {f.description && <div className="text-[11px] mt-0.5" style={{ color: T.parchmentDim, ...fontBody }}>{f.description}</div>}
                </div>
                <IconBtn onClick={() => removeFeat(f.id)} title="Remove" danger><X size={13} /></IconBtn>
              </div>
            );
          })}
          {characterFeats.length === 0 && <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>No feats yet.</p>}
        </div>
      </div>

      <div className="rounded-lg p-4" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Backpack size={15} color={T.gold} />
            <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Inventory</span>
          </div>
          <div className="flex items-center gap-2">
            {!showItemForm && (
              <button onClick={() => setShowItemForm(true)} className="text-xs rounded px-2 py-1"
                style={{ background: T.panel2, border: `1px solid ${T.line}`, color: T.parchmentDim, ...fontBody }}>
                + Add custom item
              </button>
            )}
            <IconBtn onClick={addItem} title="Quick add (free text)"><Plus size={14} /></IconBtn>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {Object.keys(SLOT_LABELS).map((slotKey) => {
            const row = character.character_inventory.find((r) => r.slot === slotKey);
            const item = row ? itemFor(row) : null;
            return (
              <div key={slotKey} className="rounded p-2" style={{ background: T.void, border: `1px solid ${T.line}` }}>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: T.parchmentDim, ...fontBody }}>{SLOT_LABELS[slotKey]}</div>
                {item ? (
                  <>
                    <div className="text-sm truncate" style={{ color: T.parchment, ...fontBody }}>{item.name}</div>
                    <div className="text-[11px]" style={{ color: T.parchmentDim, ...fontBody }}>{itemStatLine(item)}</div>
                  </>
                ) : (
                  <div className="text-sm" style={{ color: T.parchmentDim, ...fontBody }}>empty</div>
                )}
              </div>
            );
          })}
        </div>

        {showItemForm && <div className="mb-3"><AddItemForm onCreated={handleItemCreated} onCancel={() => setShowItemForm(false)} /></div>}
        <SelectField label="Add from catalog" value="" onChange={addCatalogItem} options={items} />

        <div className="flex flex-col gap-1.5 mt-3">
          {character.character_inventory.map((row) => (
            <InventoryRow key={row.id} row={row} item={itemFor(row)} onPatch={patchItem} onSetSlot={setSlot} onRemove={removeItem} />
          ))}
          {character.character_inventory.length === 0 && <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>No items yet.</p>}
        </div>
      </div>

      <div className="rounded-lg p-4" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={15} color={T.gold} />
            <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Spell Slots</span>
          </div>
          <IconBtn onClick={addSlot} title="Add slot level"><Plus size={14} /></IconBtn>
        </div>
        <div className="flex flex-col gap-1.5">
          {character.spell_slots.map((slot, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-xs w-14" style={{ color: T.parchmentDim, ...fontBody }}>Level {slot.level}</span>
              <NumberField value={slot.used} onChange={(v) => updateSlot(idx, { used: Number(v) || 0 })} small />
              <span style={{ color: T.parchmentDim, ...fontMono }}>/</span>
              <NumberField value={slot.total} onChange={(v) => updateSlot(idx, { total: Number(v) || 0 })} small />
              <span className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>used</span>
              <IconBtn onClick={() => removeSlot(idx)} title="Remove" danger><X size={13} /></IconBtn>
            </div>
          ))}
          {character.spell_slots.length === 0 && <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>No spell slots tracked.</p>}
        </div>
      </div>

      <div className="rounded-lg p-4" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={15} color={T.gold} />
            <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Known Spells</span>
          </div>
          {!showSpellForm && (
            <button onClick={() => setShowSpellForm(true)} className="text-xs rounded px-2 py-1"
              style={{ background: T.panel2, border: `1px solid ${T.line}`, color: T.parchmentDim, ...fontBody }}>
              + Add custom spell
            </button>
          )}
        </div>
        {showSpellForm && <div className="mb-3"><AddSpellForm onCreated={handleSpellCreated} onCancel={() => setShowSpellForm(false)} /></div>}
        <div className="flex items-end gap-3 flex-wrap">
          <SelectField label={`Add a spell${currentClass ? ` (${currentClass.name})` : ""}`} value="" onChange={addSpell}
            options={availableSpells.map((s) => ({ id: s.id, name: `${s.name}${s.level === 0 ? " (cantrip)" : ` (lvl ${s.level})`}` }))} />
          <label className="flex items-center gap-1.5 text-xs pb-1.5" style={{ color: T.parchmentDim, ...fontBody }}>
            <input type="checkbox" checked={showAllClassSpells} onChange={(e) => setShowAllClassSpells(e.target.checked)} /> Show all classes
          </label>
        </div>
        <div className="flex flex-col gap-1.5 mt-3">
          {knownSpells.map(({ spell, prepared }) => (
            <div key={spell.id} className="rounded p-2 flex items-start justify-between gap-2" style={{ background: T.void, border: `1px solid ${T.line}` }}>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span style={{ ...fontBody, color: T.parchment, fontSize: "13px", fontWeight: 600 }}>{spell.name}</span>
                  {spell.source === "homebrew" && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: T.panel2, color: T.parchmentDim, ...fontBody }}>homebrew</span>}
                </div>
                <div className="text-[11px]" style={{ color: T.parchmentDim, ...fontBody }}>
                  {spell.level === 0 ? "Cantrip" : `Level ${spell.level}`}{spell.school ? ` · ${spell.school}` : ""}{spell.concentration ? " · Concentration" : ""}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="flex items-center gap-1 text-[11px]" style={{ color: T.parchmentDim, ...fontBody }}>
                  <input type="checkbox" checked={!!prepared} onChange={() => toggleSpellPrepared(spell.id)} /> Prepared
                </label>
                <IconBtn onClick={() => removeSpell(spell.id)} title="Remove" danger><X size={13} /></IconBtn>
              </div>
            </div>
          ))}
          {knownSpells.length === 0 && <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>No spells known yet.</p>}
        </div>
      </div>

      <div className="rounded-lg p-4" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={15} color={T.gold} />
            <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Abilities</span>
          </div>
          <IconBtn onClick={addAbility} title="Add ability"><Plus size={14} /></IconBtn>
        </div>
        <div className="flex flex-col gap-2">
          {(character.abilities_known || []).map((a, idx) => (
            <AbilityRow key={idx} ability={a} idx={idx} onUpdate={updateAbility} onRemove={removeAbility} />
          ))}
          {(character.abilities_known || []).length === 0 && <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>No abilities tracked yet.</p>}
        </div>
        {referenceFeatures.length > 0 && (
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${T.line}` }}>
            <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: T.parchmentDim, ...fontBody }}>
              Class features for reference — add any you want tracked above
            </p>
            <div className="flex flex-col gap-1">
              {referenceFeatures.map((f, i) => (
                <div key={i} className="text-[11px]" style={{ color: T.parchmentDim, ...fontBody }}>
                  <span style={{ color: T.gold }}>Lvl {f.level}</span> — <span style={{ color: T.parchment }}>{f.name}</span>
                  {f.description ? `: ${f.description}` : ""}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg p-4" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
        <div className="text-xs uppercase tracking-widest mb-2" style={{ ...fontBody, color: T.gold }}>Features & Notes</div>
        <textarea value={notesLocal} onChange={(e) => setNotesLocal(e.target.value)} onBlur={flushNotesField} rows={5}
          className="w-full rounded px-2 py-2 text-sm outline-none resize-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
      </div>
    </div>
  );
}
