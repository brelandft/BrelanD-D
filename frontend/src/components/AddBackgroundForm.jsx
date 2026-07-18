import React, { useState } from "react";
import { T, fontBody } from "../lib/gameData";
import { TextField, StringListField } from "./atoms";
import { createBackground } from "../lib/api";

const BLANK = {
  name: "", skill_proficiencies: [], tool_proficiencies: [], languages: [],
  starting_equipment: [], feature_name: "", feature_description: "", description: "",
};

export default function AddBackgroundForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  function set(patch) { setForm((f) => ({ ...f, ...patch })); }

  async function handleSubmit() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const created = await createBackground({
        ...form,
        name: form.name.trim(),
        skill_proficiencies: form.skill_proficiencies.filter(Boolean),
        tool_proficiencies: form.tool_proficiencies.filter(Boolean),
        languages: form.languages.filter(Boolean),
        starting_equipment: form.starting_equipment.filter(Boolean),
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
      <StringListField label="Skill Proficiencies" values={form.skill_proficiencies} onChange={(v) => set({ skill_proficiencies: v })} placeholder="e.g. Insight" />
      <StringListField label="Tool Proficiencies" values={form.tool_proficiencies} onChange={(v) => set({ tool_proficiencies: v })} />
      <StringListField label="Languages" values={form.languages} onChange={(v) => set({ languages: v })} />
      <StringListField label="Starting Equipment" values={form.starting_equipment} onChange={(v) => set({ starting_equipment: v })} />
      <div className="flex flex-wrap gap-2">
        <TextField label="Feature Name" value={form.feature_name} onChange={(v) => set({ feature_name: v })} />
      </div>
      <TextField label="Feature Description" value={form.feature_description} onChange={(v) => set({ feature_description: v })} wide />
      <TextField label="Flavor description" value={form.description} onChange={(v) => set({ description: v })} wide />
      <div className="flex gap-2 mt-1">
        <button onClick={handleSubmit} disabled={saving || !form.name.trim()} className="rounded px-3 py-1.5 text-sm"
          style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment, ...fontBody }}>
          {saving ? "Saving…" : "Add Background"}
        </button>
        <button onClick={onCancel} className="rounded px-3 py-1.5 text-sm" style={{ background: "transparent", border: `1px solid ${T.line}`, color: T.parchmentDim, ...fontBody }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
