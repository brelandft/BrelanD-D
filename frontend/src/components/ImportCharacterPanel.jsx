import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { T, fontDisplay, fontBody } from "../lib/gameData";
import { loadCharacters, importCharacterToCampaign } from "../lib/api";

export default function ImportCharacterPanel({ campaigns, currentCampaignId, onImported, onClose }) {
  const otherCampaigns = campaigns.filter((c) => c.id !== currentCampaignId);
  const [sourceCampaignId, setSourceCampaignId] = useState(otherCampaigns[0]?.id ?? null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState(null);

  useEffect(() => {
    if (!sourceCampaignId) { setCharacters([]); return; }
    setLoading(true);
    loadCharacters(sourceCampaignId).then((chars) => { setCharacters(chars); setLoading(false); });
  }, [sourceCampaignId]);

  async function handleImport(characterId) {
    setImportingId(characterId);
    try {
      const cloned = await importCharacterToCampaign(characterId, currentCampaignId);
      onImported(cloned);
    } finally {
      setImportingId(null);
    }
  }

  return (
    <div className="rounded-lg p-3 mt-2 flex flex-col gap-2" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Import from another campaign</span>
        <button onClick={onClose} className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>Close</button>
      </div>
      {otherCampaigns.length === 0 ? (
        <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>No other campaigns to import from yet.</p>
      ) : (
        <>
          <select value={sourceCampaignId ?? ""} onChange={(e) => setSourceCampaignId(e.target.value)}
            className="rounded px-2 py-1.5 text-sm outline-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }}>
            {otherCampaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {loading && <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>Loading…</p>}
          <div className="flex flex-col gap-1.5">
            {characters.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded px-2.5 py-1.5" style={{ background: T.void, border: `1px solid ${T.line}` }}>
                <span style={{ ...fontDisplay, color: T.parchment, fontSize: "14px" }}>{c.name} <span style={{ color: T.parchmentDim, fontSize: "11px", ...fontBody }}>Lv {c.level}</span></span>
                <button onClick={() => handleImport(c.id)} disabled={importingId === c.id} className="flex items-center gap-1 rounded px-2 py-1 text-xs"
                  style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment, ...fontBody }}>
                  <Download size={11} /> {importingId === c.id ? "…" : "Import"}
                </button>
              </div>
            ))}
            {!loading && characters.length === 0 && <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>No characters in that campaign.</p>}
          </div>
        </>
      )}
    </div>
  );
}
