import React, { useState } from "react";
import { T, fontBody } from "../lib/gameData";
import { NumberField, TextField, StringListField } from "./atoms";
import { createSpell } from "../lib/api";

const BLANK = {
  name: "", level: 0, school: "", casting_time: "1 action", range: "",
  components: [], material: "", duration: "", concentration: false, ritual: false,
  classes: [], description: "", higher_levels: "",
};

export default function AddSpellForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  function set(patch) { setForm((f) => ({ ...f, ...patch })); }

  async function handleSubmit() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const created = await createSpell({
        ...form,
        name: form.name.trim(),
        level: Number(form.level) || 0,
        components: form.components.filter(Boolean),
        classes: form.classes.filter(Boolean),
      });
      onCreated(created);
      setForm(BLANK);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
      <TextField label="Name" value={form.name} onChange={(v) => set({ name: v })} wide />
      <div className="flex flex-wrap gap-2">
        <NumberField label="Level (0 = cantrip)" value={form.level} onChange={(v) => set({ level: v })} small />
        <TextField label="School" value={form.school} onChange={(v) => set({ school: v })} placeholder="e.g. Evocation" />
        <TextField label="Casting Time" value={form.casting_time} onChange={(v) => set({ casting_time: v })} />
        <TextField label="Range" value={form.range} onChange={(v) => set({ range: v })} />
        <TextField label="Duration" value={form.duration} onChange={(v) => set({ duration: v })} />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm" style={{ ...fontBody, color: T.parchmentDim }}>
          <input type="checkbox" checked={form.concentration} onChange={(e) => set({ concentration: e.target.checked })} /> Concentration
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ ...fontBody, color: T.parchmentDim }}>
          <input type="checkbox" checked={form.ritual} onChange={(e) => set({ ritual: e.target.checked })} /> Ritual
        </label>
      </div>
      <StringListField label="Components (V, S, M)" values={form.components} onChange={(v) => set({ components: v })} placeholder="e.g. V" />
      <TextField label="Material component" value={form.material} onChange={(v) => set({ material: v })} wide />
      <StringListField label="Classes that can learn this" values={form.classes} onChange={(v) => set({ classes: v })} placeholder="e.g. Wizard" />
      <TextField label="Description" value={form.description} onChange={(v) => set({ description: v })} wide />
      <TextField label="At higher levels" value={form.higher_levels} onChange={(v) => set({ higher_levels: v })} wide />
      <div className="flex gap-2 mt-1">
        <button onClick={handleSubmit} disabled={saving || !form.name.trim()} className="rounded px-3 py-1.5 text-sm"
          style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment, ...fontBody }}>
          {saving ? "Saving…" : "Add Spell"}
        </button>
        <button onClick={onCancel} className="rounded px-3 py-1.5 text-sm" style={{ background: "transparent", border: `1px solid ${T.line}`, color: T.parchmentDim, ...fontBody }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
