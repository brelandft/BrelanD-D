import React, { useState } from "react";
import { Trash2, Heart, ScrollText, Backpack, Sparkles, X, Plus } from "lucide-react";
import { T, fontDisplay, fontBody, fontMono, ABILITIES, SKILLS, mod, fmtMod, profBonusForLevel } from "../lib/gameData";
import { IconBtn, NumberField, TextField, SelectField, StaticField } from "./atoms";
import { COLOR_OPTIONS, TokenSprite, classImageFor, COLOR_HEX } from "../lib/sprites";
import {
  updateCharacter, addInventoryItem, updateInventoryRow, deleteInventoryRow,
} from "../lib/api";

function HPTracker({ character, onUpdate }) {
  const [amount, setAmount] = useState("");
  const hp = character.hp;

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
  function setTemp(v) { onUpdate({ hp: { ...hp, temp: Math.max(0, Number(v) || 0) } }); }
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
        <NumberField label="Max HP" value={hp.max} onChange={(v) => onUpdate({ hp: { ...hp, max: Number(v) || 0 } })} />
        <NumberField label="Temp HP" value={hp.temp} onChange={setTemp} />
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
            <NumberField value={character.hit_dice.current} onChange={(v) => onUpdate({ hit_dice: { ...character.hit_dice, current: Number(v) || 0 } })} small />
            <span style={{ color: T.parchmentDim, ...fontMono }}>/</span>
            <NumberField value={character.hit_dice.total} onChange={(v) => onUpdate({ hit_dice: { ...character.hit_dice, total: Number(v) || 0 } })} small />
            <input value={character.hit_dice.die} onChange={(e) => onUpdate({ hit_dice: { ...character.hit_dice, die: e.target.value } })}
              className="w-12 rounded px-1 py-1 text-center outline-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontMono }} />
          </div>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ ...fontBody, color: T.parchmentDim }}>Exhaustion</span>
          <NumberField value={character.exhaustion} onChange={(v) => onUpdate({ exhaustion: Math.max(0, Math.min(6, Number(v) || 0)) })} small />
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

export default function CharacterSheet({ character, referenceData, onChanged, onDelete, isDM = false }) {
  const profBonus = profBonusForLevel(character.level);
  const { races, classes, subclasses, backgrounds } = referenceData;
  const subraces = races.find((r) => r.id === character.race_id)?.subraces || [];
  const availableSubclasses = subclasses.filter((sc) => sc.class_id === character.class_id);

  async function patch(fields) {
    const updated = await updateCharacter(character.id, fields);
    onChanged(updated);
  }
  function setAbility(ab, value) {
    patch({ abilities: { ...character.abilities, [ab]: value === "" ? "" : Number(value) } });
  }
  function toggleSkill(skill) {
    const has = character.skill_proficiencies.includes(skill);
    patch({ skill_proficiencies: has ? character.skill_proficiencies.filter((s) => s !== skill) : [...character.skill_proficiencies, skill] });
  }

  async function addItem() {
    const row = await addInventoryItem(character.id, "");
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

  return (
    <div className="flex flex-col gap-4 p-4 max-w-3xl">
      <div className="rounded-lg p-4" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
        <div className="flex justify-between items-start mb-3">
          <input value={character.name} onChange={(e) => patch({ name: e.target.value })} className="bg-transparent outline-none w-full"
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
          {isDM ? (
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
              <NumberField label="Level" value={character.level} onChange={(v) => patch({ level: Number(v) || 1 })} small />
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
          {isDM ? (
            <>
              <NumberField label="Armor Class" value={character.ac} onChange={(v) => patch({ ac: Number(v) || 0 })} small />
              <NumberField label="Speed" value={character.speed} onChange={(v) => patch({ speed: Number(v) || 0 })} small />
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
        {!isDM && (
          <p className="text-xs mt-3" style={{ color: T.parchmentDim, ...fontBody }}>
            Race, class, level, and other core stats are set by your DM. Ask them to make changes.
          </p>
        )}
      </div>

      <HPTracker character={character} onUpdate={patch} />

      <div className="rounded-lg p-4" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
        <div className="text-xs uppercase tracking-widest mb-3" style={{ ...fontBody, color: T.gold }}>Ability Scores</div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ABILITIES.map((ab) => (
            <div key={ab} className="rounded p-2 text-center" style={{ background: T.void, border: `1px solid ${T.line}` }}>
              <div className="text-[10px] uppercase" style={{ ...fontBody, color: T.parchmentDim }}>{ab}</div>
              {isDM ? (
                <input type="number" value={character.abilities[ab]} onChange={(e) => setAbility(ab, e.target.value)}
                  className="w-full bg-transparent text-center outline-none" style={{ ...fontMono, color: T.parchment, fontSize: "20px" }} />
              ) : (
                <div style={{ ...fontMono, color: T.parchmentDim, fontSize: "20px" }}>{character.abilities[ab]}</div>
              )}
              <div style={{ ...fontMono, color: T.gold, fontSize: "13px" }}>{fmtMod(mod(character.abilities[ab]))}</div>
            </div>
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
                <button onClick={() => isDM && toggleSkill(name)} disabled={!isDM} className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{ background: proficient ? T.gold : T.void, border: `1px solid ${T.gold}`, cursor: isDM ? "pointer" : "default" }} />
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
            <Backpack size={15} color={T.gold} />
            <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Inventory</span>
          </div>
          <IconBtn onClick={addItem} title="Add item"><Plus size={14} /></IconBtn>
        </div>
        <div className="flex flex-col gap-1.5">
          {character.character_inventory.map((row) => (
            <div key={row.id} className="flex gap-1.5 items-center">
              <input value={row.notes || ""} onChange={(e) => patchItem(row.id, { notes: e.target.value })} placeholder="Item"
                className="flex-1 min-w-0 rounded px-2 py-1 text-sm outline-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
              <input type="number" value={row.quantity} onChange={(e) => patchItem(row.id, { quantity: Number(e.target.value) || 0 })}
                className="w-12 rounded px-1 py-1 text-center outline-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontMono }} />
              <IconBtn onClick={() => removeItem(row.id)} title="Remove" danger><X size={13} /></IconBtn>
            </div>
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
        <div className="text-xs uppercase tracking-widest mb-2" style={{ ...fontBody, color: T.gold }}>Features & Notes</div>
        <textarea value={character.features_notes || ""} onChange={(e) => patch({ features_notes: e.target.value })} rows={5}
          className="w-full rounded px-2 py-2 text-sm outline-none resize-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
      </div>
    </div>
  );
}
