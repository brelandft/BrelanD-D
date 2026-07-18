import React, { useState } from "react";
import { Plus, X, Pencil } from "lucide-react";
import { T, fontBody } from "../lib/gameData";

export default function MapTabs({ maps, activeMapId, onSelect, onCreate, onDelete, onRename }) {
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  function startRename(m) { setRenamingId(m.id); setRenameValue(m.name); }
  function commitRename() {
    if (renameValue.trim()) onRename(renamingId, renameValue.trim());
    setRenamingId(null);
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap px-4 pt-3">
      {maps.map((m) => (
        <div key={m.id} className="group relative flex items-center gap-1 rounded px-2.5 py-1.5 text-sm cursor-pointer"
          style={{
            background: m.id === activeMapId ? T.panel2 : "transparent",
            border: `1px solid ${m.id === activeMapId ? T.line : "transparent"}`,
            color: m.id === activeMapId ? T.parchment : T.parchmentDim, ...fontBody,
          }}
          onClick={() => onSelect(m.id)}>
          {renamingId === m.id ? (
            <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename} onKeyDown={(e) => e.key === "Enter" && commitRename()}
              onClick={(e) => e.stopPropagation()}
              className="w-24 bg-transparent outline-none border-b" style={{ borderColor: T.gold, color: T.parchment }} />
          ) : (
            <span>{m.name}</span>
          )}
          <button onClick={(e) => { e.stopPropagation(); startRename(m); }} className="opacity-0 group-hover:opacity-100" style={{ color: T.parchmentDim }}>
            <Pencil size={11} />
          </button>
          {maps.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(m.id); }} className="opacity-0 group-hover:opacity-100" style={{ color: T.blood }}>
              <X size={12} />
            </button>
          )}
        </div>
      ))}
      <button onClick={onCreate} className="flex items-center gap-1 rounded px-2.5 py-1.5 text-sm"
        style={{ background: "transparent", border: `1px dashed ${T.line}`, color: T.parchmentDim, ...fontBody }}>
        <Plus size={13} /> New Map
      </button>
    </div>
  );
}
