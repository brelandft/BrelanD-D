import React, { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { T, fontBody, fontMono } from "../lib/gameData";
import { uploadMapImage, setMapImage, moveToken, removeToken as removeTokenApi } from "../lib/api";

export default function CombatMap({ map, onMapChanged, onTokensChanged }) {
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showGrid, setShowGrid] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [uploading, setUploading] = useState(false);

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
          {map.tokens.map((t) => (
            <div key={t.id} onPointerDown={(e) => { e.stopPropagation(); setDragId(t.id); }}
              className="absolute flex flex-col items-center cursor-grab active:cursor-grabbing group"
              style={{ left: `${t.x}%`, top: `${t.y}%`, transform: "translate(-50%, -50%)" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg"
                style={{ background: t.color || T.blood, color: "#fff", border: "2px solid rgba(0,0,0,0.4)", ...fontMono }}>
                {(t.label || "?").slice(0, 2).toUpperCase()}
              </div>
              <span className="text-[10px] mt-0.5 px-1 rounded whitespace-nowrap" style={{ background: "rgba(22,20,15,0.85)", color: T.parchment, ...fontBody }}>{t.label}</span>
              <button onClick={(e) => { e.stopPropagation(); handleRemoveToken(t.id); }}
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full items-center justify-center hidden group-hover:flex" style={{ background: T.blood, color: "#fff" }}>
                <X size={9} />
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>Drag tokens to reposition. Map and tokens are shared with everyone using this link.</p>
    </div>
  );
}
