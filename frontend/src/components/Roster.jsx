import React, { useState } from "react";
import { Users, Plus, Download } from "lucide-react";
import { T, fontDisplay, fontBody, fontMono } from "../lib/gameData";
import ImportCharacterPanel from "./ImportCharacterPanel";

export default function Roster({ characters, selectedId, onSelect, onAdd, campaigns, currentCampaignId, onImported }) {
  const [newName, setNewName] = useState("");
  const [showImport, setShowImport] = useState(false);

  return (
    <div className="flex flex-col gap-2 p-3" style={{ background: T.panel, borderRight: `1px solid ${T.line}` }}>
      <div className="flex items-center gap-2 px-1 pb-2" style={{ borderBottom: `1px solid ${T.line}` }}>
        <Users size={16} color={T.gold} />
        <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Party</span>
      </div>
      {characters.length === 0 && (
        <p className="text-xs px-1" style={{ ...fontBody, color: T.parchmentDim }}>No adventurers yet. Add one below.</p>
      )}
      <div className="flex flex-col gap-1.5">
        {characters.map((c) => {
          const pct = c.hp.max > 0 ? Math.max(0, Math.min(100, (c.hp.current / c.hp.max) * 100)) : 0;
          const active = c.id === selectedId;
          return (
            <div key={c.id} onClick={() => onSelect(c.id)} className="relative cursor-pointer rounded px-3 py-2"
              style={{ background: active ? T.panel2 : "transparent", border: `1px solid ${active ? T.gold : T.line}` }}>
              <div className="flex items-center justify-between">
                <span style={{ ...fontDisplay, color: T.parchment, fontSize: "17px", fontWeight: 600 }}>{c.name}</span>
              </div>
              <div className="text-[11px] mb-1" style={{ ...fontBody, color: T.parchmentDim }}>
                {c.race_name || "—"} {c.class_name || ""} {c.class_name ? `· Lv ${c.level}` : ""}
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.void }}>
                <div className="h-full" style={{ width: `${pct}%`, background: pct > 50 ? T.moss : pct > 20 ? T.gold : T.blood }} />
              </div>
              <div className="text-[10px] mt-0.5" style={{ ...fontMono, color: T.parchmentDim }}>
                {c.hp.current}/{c.hp.max} HP{c.hp.temp > 0 ? ` (+${c.hp.temp})` : ""}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Character name"
          onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) { onAdd(newName.trim()); setNewName(""); } }}
          className="flex-1 min-w-0 rounded px-2 py-1.5 text-sm outline-none"
          style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
        <button onClick={() => { if (newName.trim()) { onAdd(newName.trim()); setNewName(""); } }}
          className="rounded px-2 flex items-center justify-center" style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment }}>
          <Plus size={16} />
        </button>
      </div>
      {!showImport ? (
        <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 text-xs mt-1 self-start" style={{ color: T.parchmentDim, ...fontBody }}>
          <Download size={12} /> Import from another campaign
        </button>
      ) : (
        <ImportCharacterPanel
          campaigns={campaigns}
          currentCampaignId={currentCampaignId}
          onImported={(cloned) => { onImported(cloned); setShowImport(false); }}
          onClose={() => setShowImport(false)}
        />
      )}
      <p className="text-xs mt-1" style={{ color: T.parchmentDim, ...fontBody }}>
        Need a character removed? Ask your DM — that's handled from their screen.
      </p>
    </div>
  );
}
