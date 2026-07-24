import React, { useState } from "react";
import { Users, MapPin, Trash2 } from "lucide-react";
import { T, fontDisplay, fontBody, fontMono } from "../lib/gameData";
import { TokenSprite, classImageFor, COLOR_HEX } from "../lib/sprites";
import CharacterSheet from "./CharacterSheet";

export default function DmRosterPanel({ characters, referenceData, onChanged, onDelete, onPlaceOnMap, canPlaceOnMap }) {
  const [selectedId, setSelectedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const selected = characters.find((c) => c.id === selectedId);

  function requestDelete(e, id) {
    e.stopPropagation();
    setConfirmDeleteId(id);
  }
  function confirmDelete(e, id) {
    e.stopPropagation();
    onDelete(id);
    if (selectedId === id) setSelectedId(null);
    setConfirmDeleteId(null);
  }

  return (
    <div className="flex flex-1 flex-col sm:flex-row">
      <div className="sm:w-72 w-full flex-shrink-0 flex flex-col gap-2 p-3" style={{ background: T.panel, borderRight: `1px solid ${T.line}` }}>
        <div className="flex items-center gap-2 px-1 pb-2" style={{ borderBottom: `1px solid ${T.line}` }}>
          <Users size={16} color={T.gold} />
          <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Full Roster</span>
        </div>
        {characters.length === 0 && <p className="text-xs px-1" style={{ ...fontBody, color: T.parchmentDim }}>No characters in this campaign yet.</p>}
        <div className="flex flex-col gap-1.5">
          {characters.map((c) => {
            const confirming = confirmDeleteId === c.id;
            return (
              <div key={c.id} onClick={() => setSelectedId(c.id)} className="rounded px-3 py-2 cursor-pointer flex items-center gap-2"
                style={{ background: selectedId === c.id ? T.panel2 : "transparent", border: `1px solid ${selectedId === c.id ? T.gold : T.line}` }}>
                <TokenSprite image={classImageFor(c.class_name)} backdropColor={COLOR_HEX[c.sprite_color] || COLOR_HEX.blue} size={30} />
                <div className="flex-1 min-w-0">
                  <div style={{ ...fontDisplay, color: T.parchment, fontSize: "15px", fontWeight: 600 }}>{c.name}</div>
                  <div className="text-[10px]" style={{ ...fontMono, color: T.parchmentDim }}>
                    {c.hp.current}/{c.hp.max} HP
                    {!c.finalized && <span className="ml-1 px-1 rounded" style={{ background: T.mossDim, color: T.parchment, fontSize: "9px" }}>DRAFT</span>}
                  </div>
                </div>
                {confirming ? (
                  <div className="flex flex-col gap-1">
                    <button onClick={(e) => confirmDelete(e, c.id)} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: T.bloodDim, color: T.parchment, ...fontBody }}>Confirm</button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }} className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: T.parchmentDim, ...fontBody }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={(e) => requestDelete(e, c.id)} style={{ color: T.blood }}><Trash2 size={13} /></button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {selected ? (
          <>
            <CharacterSheet character={selected} referenceData={referenceData} onChanged={onChanged} onDelete={onDelete} isDM />
            {canPlaceOnMap && (
              <div className="px-4 pb-6">
                <button onClick={() => onPlaceOnMap(selected)} className="flex items-center gap-1.5 text-xs rounded px-3 py-1.5"
                  style={{ background: T.panel2, border: `1px solid ${T.line}`, color: T.parchmentDim, ...fontBody }}>
                  <MapPin size={12} /> Place {selected.name} on the map
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-8"><p style={{ color: T.parchmentDim, ...fontBody }}>Select a character to view or edit their full sheet.</p></div>
        )}
      </div>
    </div>
  );
}
