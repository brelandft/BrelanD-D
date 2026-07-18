import React, { useState } from "react";
import { T, fontBody } from "../lib/gameData";
import { TextField, StringListField } from "./atoms";
import { createFeat } from "../lib/api";

const BLANK = { name: "", prerequisite: "", description: "", benefits: [] };

export default function AddFeatForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  function set(patch) { setForm((f) => ({ ...f, ...patch })); }

  async function handleSubmit() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const created = await createFeat({
        ...form,
        name: form.name.trim(),
        benefits: form.benefits.filter(Boolean),
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
      <TextField label="Prerequisite" value={form.prerequisite} onChange={(v) => set({ prerequisite: v })} placeholder="optional" />
      <TextField label="Description" value={form.description} onChange={(v) => set({ description: v })} wide />
      <StringListField label="Benefits" values={form.benefits} onChange={(v) => set({ benefits: v })} />
      <div className="flex gap-2 mt-1">
        <button onClick={handleSubmit} disabled={saving || !form.name.trim()} className="rounded px-3 py-1.5 text-sm"
          style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment, ...fontBody }}>
          {saving ? "Saving…" : "Add Feat"}
        </button>
        <button onClick={onCancel} className="rounded px-3 py-1.5 text-sm" style={{ background: "transparent", border: `1px solid ${T.line}`, color: T.parchmentDim, ...fontBody }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
