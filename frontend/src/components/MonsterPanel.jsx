import React, { useEffect, useState } from "react";
import { Skull, Sparkles, MapPin } from "lucide-react";
import { T, fontDisplay, fontBody, fontMono } from "../lib/gameData";
import { searchMonsters, generateMonster, deployMonster } from "../lib/api";

export default function MonsterPanel({ map, onTokensChanged }) {
  const [query, setQuery] = useState("");
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [deployingId, setDeployingId] = useState(null);

  async function runSearch(q) {
    setLoading(true);
    const results = await searchMonsters(q);
    setMonsters(results);
    setLoading(false);
  }

  useEffect(() => { runSearch(""); }, []);

  async function handleGenerate() {
    if (!description.trim()) return;
    setGenerating(true);
    setGenError("");
    try {
      const monster = await generateMonster(description.trim());
      setMonsters((prev) => [monster, ...prev]);
      setDescription("");
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeploy(monster) {
    if (!map) return;
    setDeployingId(monster.id);
    const token = await deployMonster(map.id, monster);
    onTokensChanged([...map.tokens, token]);
    setDeployingId(null);
  }

  return (
    <div className="p-4 flex flex-col gap-4 max-w-2xl">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={15} color={T.gold} />
          <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Generate a Monster</span>
        </div>
        <div className="flex gap-1.5">
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. a swamp troll that hoards shiny coins"
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            className="flex-1 rounded px-2 py-1.5 text-sm outline-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
          <button onClick={handleGenerate} disabled={generating} className="rounded px-3 py-1.5 text-sm"
            style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment, ...fontBody }}>
            {generating ? "Conjuring…" : "Generate"}
          </button>
        </div>
        {genError && <p className="text-xs mt-1" style={{ color: T.blood, ...fontBody }}>{genError}</p>}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Skull size={16} color={T.gold} />
          <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Bestiary</span>
        </div>
        <input value={query} onChange={(e) => { setQuery(e.target.value); runSearch(e.target.value); }} placeholder="Search monsters…"
          className="w-full rounded px-2 py-1.5 text-sm outline-none mb-2" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />

        {loading && <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>Loading…</p>}
        <div className="flex flex-col gap-2">
          {monsters.map((m) => (
            <div key={m.id} className="rounded-lg p-3 flex items-start justify-between gap-3" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
              <div>
                <div className="flex items-baseline gap-2">
                  <span style={{ ...fontDisplay, color: T.parchment, fontSize: "18px", fontWeight: 600 }}>{m.name}</span>
                  {m.generated_by_claude && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: T.mossDim, color: T.parchment, ...fontBody }}>homebrew</span>}
                </div>
                <div className="text-[11px]" style={{ ...fontBody, color: T.parchmentDim }}>
                  {m.size} {m.type} · CR {m.challenge_rating ?? "?"} · AC {m.ac ?? "?"} · HP {m.hp_average ?? "?"}
                </div>
              </div>
              <button onClick={() => handleDeploy(m)} disabled={!map || deployingId === m.id}
                className="flex items-center gap-1 rounded px-2.5 py-1.5 text-xs flex-shrink-0"
                style={{ background: T.bloodDim, border: `1px solid ${T.blood}`, color: T.parchment, ...fontBody }}>
                <MapPin size={12} /> {deployingId === m.id ? "…" : "Deploy"}
              </button>
            </div>
          ))}
          {!loading && monsters.length === 0 && <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>No monsters found.</p>}
        </div>
      </div>
    </div>
  );
}
