import React, { useEffect, useState } from "react";
import { Skull, Plus, MapPin } from "lucide-react";
import { T, fontDisplay, fontBody } from "../lib/gameData";
import { searchMonsters, deployMonster } from "../lib/api";
import AddMonsterForm from "./AddMonsterForm";

export default function MonsterPanel({ map, onTokensChanged }) {
  const [query, setQuery] = useState("");
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deployingId, setDeployingId] = useState(null);

  async function runSearch(q) {
    setLoading(true);
    const results = await searchMonsters(q);
    setMonsters(results);
    setLoading(false);
  }

  useEffect(() => { runSearch(""); }, []);

  function handleCreated(monster) {
    setMonsters((prev) => [monster, ...prev]);
    setShowForm(false);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skull size={16} color={T.gold} />
          <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Bestiary</span>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1 rounded px-3 py-1.5 text-sm"
            style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment, ...fontBody }}>
            <Plus size={14} /> Add Monster
          </button>
        )}
      </div>

      {showForm && <AddMonsterForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />}

      <input value={query} onChange={(e) => { setQuery(e.target.value); runSearch(e.target.value); }} placeholder="Search monsters…"
        className="w-full rounded px-2 py-1.5 text-sm outline-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />

      {loading && <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>Loading…</p>}
      <div className="flex flex-col gap-2">
        {monsters.map((m) => (
          <div key={m.id} className="rounded-lg p-3 flex items-start justify-between gap-3" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
            <div>
              <div className="flex items-baseline gap-2">
                <span style={{ ...fontDisplay, color: T.parchment, fontSize: "18px", fontWeight: 600 }}>{m.name}</span>
                {m.source === "homebrew" && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: T.mossDim, color: T.parchment, ...fontBody }}>homebrew</span>}
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
  );
}
