import React, { useState } from "react";
import { BookOpen, Plus, ArrowLeft } from "lucide-react";
import { T, fontDisplay, fontBody } from "../lib/gameData";

export default function CampaignPicker({ campaigns, onSelect, onCreate, onBack }) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const campaign = await onCreate(newName.trim());
      setNewName("");
      onSelect(campaign.id);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col items-center pt-16 px-4">
      <BookOpen size={26} color={T.gold} />
      <h2 className="mt-3 mb-1" style={{ ...fontDisplay, color: T.parchment, fontSize: "26px", fontWeight: 700 }}>
        Which campaign?
      </h2>
      <p className="text-xs text-center max-w-xs mb-6" style={{ ...fontBody, color: T.parchmentDim }}>
        Characters and maps stay separate per campaign — homebrew monsters, items, and rules content are shared across all of them.
      </p>

      <div className="w-full max-w-sm flex flex-col gap-2">
        {campaigns.map((c) => (
          <button key={c.id} onClick={() => onSelect(c.id)} className="rounded-lg px-4 py-3 text-left transition-transform hover:-translate-y-0.5"
            style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
            <span style={{ ...fontDisplay, color: T.parchment, fontSize: "18px", fontWeight: 600 }}>{c.name}</span>
            {c.description && <p className="text-xs mt-1" style={{ color: T.parchmentDim, ...fontBody }}>{c.description}</p>}
          </button>
        ))}
        {campaigns.length === 0 && (
          <p className="text-xs text-center" style={{ color: T.parchmentDim, ...fontBody }}>No campaigns yet — create the first one below.</p>
        )}
      </div>

      <div className="flex gap-1.5 mt-4 w-full max-w-sm">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New campaign name"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          className="flex-1 min-w-0 rounded px-3 py-2 text-sm outline-none"
          style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
        <button onClick={handleCreate} disabled={creating || !newName.trim()} className="flex items-center gap-1 rounded px-3 py-2 text-sm"
          style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment, ...fontBody }}>
          <Plus size={14} /> Create
        </button>
      </div>

      <button onClick={onBack} className="flex items-center gap-1 text-xs mt-6" style={{ color: T.parchmentDim, ...fontBody }}>
        <ArrowLeft size={12} /> Back
      </button>
    </div>
  );
}
