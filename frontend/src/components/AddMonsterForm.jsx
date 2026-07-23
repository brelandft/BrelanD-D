import React, { useState } from "react";
import { T, fontBody, ABILITIES, blankAbilities } from "../lib/gameData";
import { NumberField, TextField, SelectField, StringListField, NamedListField } from "./atoms";
import { createMonster } from "../lib/api";
import { MONSTER_ICON_OPTIONS, monsterImageFor } from "../lib/sprites";

const BLANK = {
  name: "", challenge_rating: "", size: "Medium", type: "", alignment: "",
  ac: 10, hp_average: 10, hp_dice: "", speed_walk: 30,
  abilities: blankAbilities(),
  senses: "", languages: "", description: "",
  traits: [], actions: [], legendary_actions: [],
  sprite_key: "beast",
};

export default function AddMonsterForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  function set(patch) { setForm((f) => ({ ...f, ...patch })); }

  async function handleSubmit() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const created = await createMonster({
        name: form.name.trim(),
        challenge_rating: form.challenge_rating === "" ? null : Number(form.challenge_rating),
        size: form.size, type: form.type, alignment: form.alignment,
        ac: Number(form.ac) || null,
        hp_average: Number(form.hp_average) || null,
        hp_dice: form.hp_dice,
        speed: { walk: Number(form.speed_walk) || 0 },
        abilities: form.abilities,
        senses: form.senses, languages: form.languages,
        description: form.description,
        traits: form.traits, actions: form.actions, legendary_actions: form.legendary_actions,
        sprite_key: form.sprite_key,
      });
      onCreated(created);
      setForm(BLANK);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
      <div className="flex flex-wrap gap-2 items-end">
        <TextField label="Name" value={form.name} onChange={(v) => set({ name: v })} wide />
      </div>
      <div>
        <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ ...fontBody, color: T.parchmentDim }}>Sprite</span>
        <div className="flex flex-wrap gap-2">
          {MONSTER_ICON_OPTIONS.map((opt) => (
            <button key={opt.id} onClick={() => set({ sprite_key: opt.id })} title={opt.name}
              className="rounded p-1.5 flex items-center justify-center"
              style={{ background: form.sprite_key === opt.id ? T.mossDim : T.void, border: `1px solid ${form.sprite_key === opt.id ? T.moss : T.line}` }}>
              <img src={monsterImageFor(opt.id)} alt={opt.name} style={{ width: 28, height: 28, objectFit: "contain" }} />
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <TextField label="Size" value={form.size} onChange={(v) => set({ size: v })} />
        <TextField label="Type" value={form.type} onChange={(v) => set({ type: v })} placeholder="e.g. beast, undead" />
        <TextField label="Alignment" value={form.alignment} onChange={(v) => set({ alignment: v })} />
        <NumberField label="Challenge Rating" value={form.challenge_rating} onChange={(v) => set({ challenge_rating: v })} small />
      </div>
      <div className="flex flex-wrap gap-2">
        <NumberField label="AC" value={form.ac} onChange={(v) => set({ ac: v })} small />
        <NumberField label="HP (average)" value={form.hp_average} onChange={(v) => set({ hp_average: v })} small />
        <TextField label="HP Dice" value={form.hp_dice} onChange={(v) => set({ hp_dice: v })} placeholder="e.g. 9d8+9" />
        <NumberField label="Walk Speed" value={form.speed_walk} onChange={(v) => set({ speed_walk: v })} small />
      </div>
      <div>
        <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ ...fontBody, color: T.parchmentDim }}>Ability Scores</span>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ABILITIES.map((ab) => (
            <NumberField key={ab} label={ab} value={form.abilities[ab]} onChange={(v) => set({ abilities: { ...form.abilities, [ab]: Number(v) || 0 } })} small />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <TextField label="Senses" value={form.senses} onChange={(v) => set({ senses: v })} placeholder="e.g. darkvision 60 ft." />
        <TextField label="Languages" value={form.languages} onChange={(v) => set({ languages: v })} />
      </div>
      <TextField label="Flavor description" value={form.description} onChange={(v) => set({ description: v })} wide />
      <NamedListField label="Traits" values={form.traits} onChange={(v) => set({ traits: v })} />
      <NamedListField label="Actions" values={form.actions} onChange={(v) => set({ actions: v })} />
      <NamedListField label="Legendary Actions" values={form.legendary_actions} onChange={(v) => set({ legendary_actions: v })} />
      <div className="flex gap-2 mt-1">
        <button onClick={handleSubmit} disabled={saving || !form.name.trim()} className="rounded px-3 py-1.5 text-sm"
          style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment, ...fontBody }}>
          {saving ? "Saving…" : "Add Monster"}
        </button>
        <button onClick={onCancel} className="rounded px-3 py-1.5 text-sm" style={{ background: "transparent", border: `1px solid ${T.line}`, color: T.parchmentDim, ...fontBody }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
