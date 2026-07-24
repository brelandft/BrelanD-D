import React, { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { T, fontBody, fontMono } from "../lib/gameData";
import { uploadMapImage, setMapImage, moveToken, removeToken as removeTokenApi, updateMonsterInstanceHp } from "../lib/api";
import { TokenSprite, classImageFor, monsterImageFor, COLOR_HEX } from "../lib/sprites";

function TokenHpEditor({ token, onApply, onClose }) {
  const [value, setValue] = useState(token.hp_current ?? 0);
  return (
    <div className="absolute z-10 rounded p-2 flex flex-col gap-1.5" style={{ left: `${token.x}%`, top: `${token.y}%`, transform: "translate(-50%, 12px)", background: T.panel, border: `1px solid ${T.line}` }}
      onPointerDown={(e) => e.stopPropagation()}>
      <span className="text-[10px]" style={{ color: T.parchmentDim, ...fontBody }}>{token.label} HP</span>
      <div className="flex gap-1">
        <input type="number" value={value} onChange={(e) => setValue(e.target.value)}
          className="w-14 rounded px-1 py-0.5 text-center outline-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontMono }} />
        <button onClick={() => onApply(Number(value) || 0)} className="rounded px-2 text-xs" style={{ background: T.mossDim, color: T.parchment, ...fontBody }}>Set</button>
        <button onClick={onClose} className="rounded px-2 text-xs" style={{ color: T.parchmentDim, ...fontBody }}>×</button>
      </div>
    </div>
  );
}

export default function CombatMap({ map, canEdit, onMapChanged, onTokensChanged }) {
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showGrid, setShowGrid] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingHpTokenId, setEditingHpTokenId] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file || !map) return;
    setUploading(true);
    try {
      const url = await uploadMapImage(file);
      await setMapImage(map.id, url);
      onMapChanged({ ...map, image_url: url });
    } finally {
      setUploading(false);
    }
  }

  function handlePointerMove(e) {
    if (!dragId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    onTokensChanged(map.tokens.map((t) => (t.id === dragId ? { ...t, x, y } : t)));
  }
  async function handlePointerUp() {
    if (dragId) {
      const t = map.tokens.find((t) => t.id === dragId);
      if (t) await moveToken(t.id, t.x, t.y);
    }
    setDragId(null);
  }
  async function handleRemoveToken(id) {
    await removeTokenApi(id);
    onTokensChanged(map.tokens.filter((t) => t.id !== id));
  }
  async function handleApplyHp(token, newHp) {
    await updateMonsterInstanceHp(token.entity_id, newHp, token.hp_max);
    onTokensChanged(map.tokens.map((t) => (t.id === token.id ? { ...t, hp_current: newHp } : t)));
    setEditingHpTokenId(null);
  }

  if (!map) return null;

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm"
          style={{ background: T.panel2, border: `1px solid ${T.line}`, color: T.parchment, ...fontBody }}>
          <Upload size={14} /> {uploading ? "Uploading…" : map.image_url ? "Replace map" : "Upload map"}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <button onClick={() => setShowGrid((g) => !g)} className="rounded px-3 py-1.5 text-sm"
          style={{ background: showGrid ? T.panel2 : "transparent", border: `1px solid ${T.line}`, color: T.parchment, ...fontBody }}>
          Grid {showGrid ? "on" : "off"}
        </button>
      </div>
      {!map.image_url ? (
        <div className="rounded-lg flex items-center justify-center h-64" style={{ background: T.panel2, border: `1px dashed ${T.line}` }}>
          <p className="text-sm" style={{ color: T.parchmentDim, ...fontBody }}>Upload a battle map image to get started.</p>
        </div>
      ) : (
        <div ref={containerRef} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
          className="relative rounded-lg overflow-hidden select-none" style={{ border: `1px solid ${T.line}`, touchAction: "none" }}>
          <img src={map.image_url} alt="battle map" className="w-full h-auto block" draggable={false} />
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: `linear-gradient(to right, rgba(232,220,192,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(232,220,192,0.25) 1px, transparent 1px)`,
              backgroundSize: "5% 5%",
            }} />
          )}
          {map.tokens.map((t) => {
            const isMonster = t.entity_type === "monster_instance";
            const image = isMonster ? monsterImageFor(t.sprite_key) : classImageFor(t.sprite_key);
            const backdropColor = isMonster ? T.blood : (COLOR_HEX[t.sprite_color] || T.blood);
            return (
              <div key={t.id}
                onPointerDown={(e) => { if (!canEdit) return; e.stopPropagation(); setDragId(t.id); }}
                onClick={(e) => { if (canEdit && isMonster) { e.stopPropagation(); setEditingHpTokenId(t.id); } }}
                className="absolute flex flex-col items-center group"
                style={{ left: `${t.x}%`, top: `${t.y}%`, transform: "translate(-50%, -50%)", cursor: canEdit ? "grab" : "default" }}>
                <TokenSprite image={image} backdropColor={backdropColor} size={34} />
                <span className="text-[10px] mt-0.5 px-1 rounded whitespace-nowrap" style={{ background: "rgba(22,20,15,0.85)", color: T.parchment, ...fontBody }}>{t.label}</span>
                {t.hp_current != null && (
                  <span className="text-[9px] px-1 rounded whitespace-nowrap" style={{ background: "rgba(22,20,15,0.85)", color: t.hp_current <= 0 ? T.blood : "#a8c9a3", ...fontMono }}>
                    {t.hp_current}/{t.hp_max ?? "?"}
                  </span>
                )}
                {canEdit && (
                  <button onClick={(e) => { e.stopPropagation(); handleRemoveToken(t.id); }}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full items-center justify-center hidden group-hover:flex" style={{ background: T.blood, color: "#fff" }}>
                    <X size={9} />
                  </button>
                )}
              </div>
            );
          })}
          {editingHpTokenId && (() => {
            const token = map.tokens.find((t) => t.id === editingHpTokenId);
            return token ? <TokenHpEditor token={token} onApply={(hp) => handleApplyHp(token, hp)} onClose={() => setEditingHpTokenId(null)} /> : null;
          })()}
        </div>
      )}
      <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>
        {canEdit ? "Drag tokens to reposition. Click a monster token to adjust its HP." : "The DM controls token positions and HP."} Map and tokens are shared with everyone using this link.
      </p>
    </div>
  );
}
