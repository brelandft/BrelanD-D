import React, { useState } from "react";
import { T, fontBody } from "../lib/gameData";
import { NumberField, TextField, SelectField, NamedListField } from "./atoms";
import { createSubclass } from "../lib/api";

const BLANK_FEATURE = { level: 3, name: "", description: "" };

export default function AddSubclassForm({ classes, onCreated, onCancel }) {
  const [classId, setClassId] = useState(null);
  const [name, setName] = useState("");
  const [unlockedAt, setUnlockedAt] = useState(3);
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState([]);
  const [saving, setSaving] = useState(false);

  function updateFeature(i, patch) { setFeatures(features.map((f, idx) => (idx === i ? { ...f, ...patch } : f))); }
  function removeFeature(i) { setFeatures(features.filter((_, idx) => idx !== i)); }

  async function handleSubmit() {
    if (!name.trim() || !classId) return;
    setSaving(true);
    try {
      const featuresByLevel = {};
      for (const f of features) {
        const lvl = String(f.level || unlockedAt);
        if (!featuresByLevel[lvl]) featuresByLevel[lvl] = [];
        featuresByLevel[lvl].push({ name: f.name, description: f.description });
      }
      const created = await createSubclass({
        class_id: classId,
        name: name.trim(),
        unlocked_at_level: Number(unlockedAt) || 3,
        features_by_level: featuresByLevel,
        description,
      });
      onCreated(created);
      setName(""); setDescription(""); setFeatures([]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
      <div className="flex flex-wrap gap-2">
        <SelectField label="Class" value={classId} onChange={setClassId} options={classes} small />
        <NumberField label="Unlocked at level" value={unlockedAt} onChange={setUnlockedAt} small />
      </div>
      <TextField label="Subclass name" value={name} onChange={setName} wide />
      <TextField label="Flavor description" value={description} onChange={setDescription} wide />
      <div>
        <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ ...fontBody, color: T.parchmentDim }}>Features</span>
        <div className="flex flex-col gap-2">
          {features.map((f, i) => (
            <div key={i} className="rounded p-2 flex flex-col gap-1" style={{ background: T.void, border: `1px solid ${T.line}` }}>
              <div className="flex gap-1.5">
                <NumberField label="Level" value={f.level} onChange={(v) => updateFeature(i, { level: Number(v) || unlockedAt })} small />
                <TextField label="Name" value={f.name} onChange={(v) => updateFeature(i, { name: v })} wide />
              </div>
              <textarea value={f.description} onChange={(e) => updateFeature(i, { description: e.target.value })} placeholder="Description" rows={2}
                className="rounded px-2 py-1 text-sm outline-none resize-none" style={{ background: T.panel2, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
              <button onClick={() => removeFeature(i)} className="text-xs self-start" style={{ color: T.blood, ...fontBody }}>Remove</button>
            </div>
          ))}
          <button onClick={() => setFeatures([...features, { ...BLANK_FEATURE, level: unlockedAt }])} className="text-xs self-start rounded px-2 py-1"
            style={{ background: T.void, border: `1px solid ${T.line}`, color: T.parchmentDim, ...fontBody }}>+ Add feature</button>
        </div>
      </div>
      <div className="flex gap-2 mt-1">
        <button onClick={handleSubmit} disabled={saving || !name.trim() || !classId} className="rounded px-3 py-1.5 text-sm"
          style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment, ...fontBody }}>
          {saving ? "Saving…" : "Add Subclass"}
        </button>
        <button onClick={onCancel} className="rounded px-3 py-1.5 text-sm" style={{ background: "transparent", border: `1px solid ${T.line}`, color: T.parchmentDim, ...fontBody }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
