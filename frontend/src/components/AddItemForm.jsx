import React, { useState } from "react";
import { T, fontBody } from "../lib/gameData";
import { NumberField, TextField, SelectField, StringListField } from "./atoms";
import { createItem } from "../lib/api";

const ITEM_TYPES = ["weapon", "armor", "shield", "gear", "tool", "consumable", "magic_item", "treasure"]
  .map((t) => ({ id: t, name: t }));

const BLANK = {
  name: "", item_type: "gear", subtype: "", cost_gp: "", weight_lb: "",
  damage_dice: "", damage_type: "", ac_base: "", requires_attunement: false,
  properties: [], description: "",
};

export default function AddItemForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  function set(patch) { setForm((f) => ({ ...f, ...patch })); }

  async function handleSubmit() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const created = await createItem({
        name: form.name.trim(),
        item_type: form.item_type,
        subtype: form.subtype || null,
        cost_gp: form.cost_gp === "" ? null : Number(form.cost_gp),
        weight_lb: form.weight_lb === "" ? null : Number(form.weight_lb),
        damage: form.damage_dice ? { dice: form.damage_dice, type: form.damage_type } : null,
        armor_class: form.ac_base ? { base: Number(form.ac_base), dex_bonus: true, max_dex: null } : null,
        properties: form.properties.filter(Boolean),
        requires_attunement: form.requires_attunement,
        description: form.description,
      });
      onCreated(created);
      setForm(BLANK);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
      <div className="flex flex-wrap gap-2">
        <TextField label="Name" value={form.name} onChange={(v) => set({ name: v })} wide />
      </div>
      <div className="flex flex-wrap gap-2">
        <SelectField label="Type" value={form.item_type} onChange={(v) => set({ item_type: v })} options={ITEM_TYPES} small />
        <TextField label="Subtype" value={form.subtype} onChange={(v) => set({ subtype: v })} placeholder="e.g. martial melee" />
        <NumberField label="Cost (gp)" value={form.cost_gp} onChange={(v) => set({ cost_gp: v })} small />
        <NumberField label="Weight (lb)" value={form.weight_lb} onChange={(v) => set({ weight_lb: v })} small />
      </div>
      {(form.item_type === "weapon") && (
        <div className="flex flex-wrap gap-2">
          <TextField label="Damage dice" value={form.damage_dice} onChange={(v) => set({ damage_dice: v })} placeholder="e.g. 1d8" />
          <TextField label="Damage type" value={form.damage_type} onChange={(v) => set({ damage_type: v })} placeholder="e.g. slashing" />
        </div>
      )}
      {(form.item_type === "armor" || form.item_type === "shield") && (
        <NumberField label="Base AC" value={form.ac_base} onChange={(v) => set({ ac_base: v })} small />
      )}
      <label className="flex items-center gap-2 text-sm" style={{ ...fontBody, color: T.parchmentDim }}>
        <input type="checkbox" checked={form.requires_attunement} onChange={(e) => set({ requires_attunement: e.target.checked })} />
        Requires attunement
      </label>
      <StringListField label="Properties" values={form.properties} onChange={(v) => set({ properties: v })} placeholder="e.g. finesse, light" />
      <TextField label="Description" value={form.description} onChange={(v) => set({ description: v })} wide />
      <div className="flex gap-2 mt-1">
        <button onClick={handleSubmit} disabled={saving || !form.name.trim()} className="rounded px-3 py-1.5 text-sm"
          style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment, ...fontBody }}>
          {saving ? "Saving…" : "Add Item"}
        </button>
        <button onClick={onCancel} className="rounded px-3 py-1.5 text-sm" style={{ background: "transparent", border: `1px solid ${T.line}`, color: T.parchmentDim, ...fontBody }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
