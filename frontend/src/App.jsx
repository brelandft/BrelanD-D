import React, { useEffect, useState } from "react";
import { ArrowLeft, Users, Map as MapIcon, ScrollText, Skull, Backpack } from "lucide-react";
import { useFonts, GLOBAL_CSS, T, fontDisplay, fontBody } from "./lib/gameData";
import {
  loadReferenceData, loadCharacters, createCharacter, deleteCharacter,
  loadOrCreateMap, addToken, loadDmPin,
} from "./lib/api";
import "./styles.css";

import Landing from "./components/Landing";
import PinGate from "./components/PinGate";
import Roster from "./components/Roster";
import CharacterSheet from "./components/CharacterSheet";
import CombatMap from "./components/CombatMap";
import MonsterPanel from "./components/MonsterPanel";
import ItemsPanel from "./components/ItemsPanel";

function enrichCharacter(c, refData) {
  return {
    ...c,
    race_name: refData.races.find((r) => r.id === c.race_id)?.name,
    class_name: refData.classes.find((cl) => cl.id === c.class_id)?.name,
  };
}

export default function App() {
  useFonts();
  const [view, setView] = useState("landing"); // landing | dm-gate | party | dm
  const [tab, setTab] = useState("roster");
  const [dmTab, setDmTab] = useState("monsters");

  const [refData, setRefData] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [map, setMap] = useState(null);
  const [dmPin, setDmPin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [rd, chars, m, pin] = await Promise.all([
          loadReferenceData(), loadCharacters(), loadOrCreateMap(), loadDmPin(),
        ]);
        setRefData(rd);
        setCharacters(chars.map((c) => enrichCharacter(c, rd)));
        setMap(m);
        setDmPin(pin);
        setConnectionStatus({
          ok: true,
          message: `Connected — ${rd.races.length} races, ${rd.classes.length} classes loaded.`,
        });
      } catch (err) {
        setConnectionStatus({ ok: false, message: `Couldn't reach Supabase: ${err.message}` });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleAddCharacter(name) {
    const created = await createCharacter(name);
    setCharacters((prev) => [...prev, enrichCharacter(created, refData)]);
    setSelectedId(created.id);
    setTab("sheet");
  }
  function handleCharacterChanged(updated) {
    const enriched = enrichCharacter(updated, refData);
    setCharacters((prev) => prev.map((c) => (c.id === enriched.id ? enriched : c)));
  }
  async function handleDeleteCharacter(id) {
    await deleteCharacter(id);
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  }
  async function handlePlaceOnMap(character) {
    if (!map) return;
    const token = await addToken(map.id, {
      entityType: "character",
      entityId: character.id,
      label: character.name,
      color: "#4a6d8b",
    });
    setMap({ ...map, tokens: [...map.tokens, token] });
  }

  const selected = characters.find((c) => c.id === selectedId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.void }}>
        <span style={{ color: T.parchmentDim, ...fontBody }}>Loading party…</span>
      </div>
    );
  }

  const PARTY_TABS = [
    { id: "roster", label: "Roster", icon: Users },
    { id: "sheet", label: "Character Sheet", icon: ScrollText },
    { id: "map", label: "Map", icon: MapIcon },
  ];
  const DM_TABS = [
    { id: "monsters", label: "Monsters", icon: Skull },
    { id: "map", label: "Map", icon: MapIcon },
    { id: "items", label: "Items", icon: Backpack },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: T.void }}>
      <style>{GLOBAL_CSS}</style>

      {view === "landing" && (
        <Landing
          onChooseParty={() => setView("party")}
          onChooseDM={() => setView("dm-gate")}
          connectionStatus={connectionStatus}
        />
      )}

      {view === "dm-gate" && (
        <PinGate hasPin={!!dmPin} onSuccess={async () => { setDmPin(await loadDmPin()); setView("dm"); }} onBack={() => setView("landing")} />
      )}

      {(view === "party" || view === "dm") && (
        <div className="flex items-center gap-1 px-4 py-2 flex-wrap" style={{ borderBottom: `1px solid ${T.line}`, background: T.panel }}>
          <button onClick={() => setView("landing")} className="flex items-center gap-1 px-2 py-1.5 rounded text-sm mr-2" style={{ color: T.parchmentDim, ...fontBody }}>
            <ArrowLeft size={14} /> Hall
          </button>
          <span style={{ ...fontDisplay, color: T.gold, fontSize: "20px", fontWeight: 700 }} className="mr-3">
            {view === "party" ? "Party Ledger" : "DM Screen"}
          </span>
          {(view === "party" ? PARTY_TABS : DM_TABS).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => (view === "party" ? setTab(id) : setDmTab(id))} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm"
              style={{
                background: (view === "party" ? tab : dmTab) === id ? T.panel2 : "transparent",
                color: (view === "party" ? tab : dmTab) === id ? T.parchment : T.parchmentDim,
                border: `1px solid ${(view === "party" ? tab : dmTab) === id ? T.line : "transparent"}`, ...fontBody,
              }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      )}

      {view === "party" && (
        <div className="flex flex-1 flex-col sm:flex-row">
          {(tab === "roster" || tab === "sheet") && (
            <div className="sm:w-72 w-full flex-shrink-0">
              <Roster characters={characters} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setTab("sheet"); }} onAdd={handleAddCharacter} onDelete={handleDeleteCharacter} />
            </div>
          )}
          <div className="flex-1 overflow-auto">
            {tab === "sheet" && (selected ? (
              <>
                <CharacterSheet character={selected} referenceData={refData} onChanged={handleCharacterChanged} onDelete={handleDeleteCharacter} />
                <div className="px-4 pb-6">
                  <button onClick={() => handlePlaceOnMap(selected)} className="text-xs rounded px-3 py-1.5" style={{ background: T.panel2, border: `1px solid ${T.line}`, color: T.parchmentDim, ...fontBody }}>
                    Place {selected.name} on the map
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8"><p style={{ color: T.parchmentDim, ...fontBody }}>Select or add a character from the party list.</p></div>
            ))}
            {tab === "roster" && (
              <div className="p-8 max-w-lg">
                <p style={{ ...fontDisplay, color: T.parchment, fontSize: "20px" }} className="mb-2">Welcome back, adventurer.</p>
                <p className="text-sm" style={{ color: T.parchmentDim, ...fontBody }}>Pick a character from the left to open their sheet, or add a new one.</p>
              </div>
            )}
            {tab === "map" && <CombatMap map={map} onMapChanged={setMap} onTokensChanged={(tokens) => setMap({ ...map, tokens })} />}
          </div>
        </div>
      )}

      {view === "dm" && (
        <div className="flex-1 overflow-auto">
          {dmTab === "monsters" && <MonsterPanel map={map} onTokensChanged={(tokens) => setMap({ ...map, tokens })} />}
          {dmTab === "map" && <CombatMap map={map} onMapChanged={setMap} onTokensChanged={(tokens) => setMap({ ...map, tokens })} />}
          {dmTab === "items" && <ItemsPanel />}
        </div>
      )}
    </div>
  );
}
