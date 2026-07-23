import React, { useState } from "react";
import { Pencil } from "lucide-react";
import { T, fontDisplay, fontBody } from "../lib/gameData";
import { updateCampaign } from "../lib/api";

export default function CampaignSettings({ campaign, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateCampaign(campaign.id, { name: name.trim() || campaign.name, description });
      onChanged(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button onClick={() => { setName(campaign.name); setDescription(campaign.description || ""); setEditing(true); }}
        className="flex items-center gap-1 text-xs" style={{ color: T.parchmentDim, ...fontBody }}>
        <Pencil size={11} /> Edit campaign
      </button>
    );
  }

  return (
    <div className="rounded-lg p-3 flex flex-col gap-2 w-full max-w-md" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name"
        className="rounded px-2 py-1.5 text-sm outline-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontDisplay, fontSize: "15px" }} />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="A few sentences describing the setting…"
        className="rounded px-2 py-1.5 text-sm outline-none resize-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="rounded px-3 py-1 text-xs" style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment, ...fontBody }}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={() => setEditing(false)} className="rounded px-3 py-1 text-xs" style={{ color: T.parchmentDim, ...fontBody }}>Cancel</button>
      </div>
    </div>
  );
}
