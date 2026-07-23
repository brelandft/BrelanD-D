import React, { useEffect, useState } from "react";
import { ArrowLeft, Users, Map as MapIcon, ScrollText, Skull, Backpack, Sparkles, BookOpen } from "lucide-react";
import { useFonts, GLOBAL_CSS, T, fontDisplay, fontBody } from "./lib/gameData";
import {
  loadReferenceData, loadCampaigns, createCampaign, updateCampaign,
  loadCharacters, createCharacter, deleteCharacter,
  loadMaps, createMap, deleteMap, renameMap, addToken, loadDmPin, syncTokenHp,
} from "./lib/api";
import "./styles.css";

import Landing from "./components/Landing";
import PinGate from "./components/PinGate";
import CampaignPicker from "./components/CampaignPicker";
import CampaignSettings from "./components/CampaignSettings";
import Roster from "./components/Roster";
import CharacterSheet from "./components/CharacterSheet";
import CombatMap from "./components/CombatMap";
import MapTabs from "./components/MapTabs";
import MonsterPanel from "./components/MonsterPanel";
import ItemsPanel from "./components/ItemsPanel";
import HomebrewPanel from "./components/HomebrewPanel";
import DmRosterPanel from "./components/DmRosterPanel";
import PartyReference from "./components/PartyReference";
import DmReference from "./components/DmReference";

function enrichCharacter(c, refData) {
  return {
    ...c,
    race_name: refData.races.find((r) => r.id === c.race_id)?.name,
    class_name: refData.classes.find((cl) => cl.id === c.class_id)?.name,
  };
}

export default function App() {
  useFonts();
  const [view, setView] = useState("landing"); // landing | dm-gate | campaign-select | party | dm
  const [pendingRole, setPendingRole] = useState(null);
  const [tab, setTab] = useState("roster");
  const [dmTab, setDmTab] = useState("roster");

  const [refData, setRefData] = useState(null);
  const [dmPin, setDmPin] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignId, setCampaignId] = useState(null);

  const [characters, setCharacters] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [maps, setMaps] = useState([]);
  const [activeMapId, setActiveMapId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // Load global data once: reference content, campaign list, DM PIN.
  useEffect(() => {
    (async () => {
      try {
        const [rd, camps, pin] = await Promise.all([loadReferenceData(), loadCampaigns(), loadDmPin()]);
        setRefData(rd);
        setCampaigns(camps);
        setDmPin(pin);
        setConnectionStatus({ ok: true, message: `Connected — ${rd.races.length} races, ${rd.classes.length} classes loaded.` });
      } catch (err) {
        setConnectionStatus({ ok: false, message: `Couldn't reach Supabase: ${err.message}` });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function enterCampaign(id) {
    setCampaignId(id);
    setCampaignLoading(true);
    setSelectedId(null);
    try {
      const [chars, mapList] = await Promise.all([loadCharacters(id), loadMaps(id)]);
      setCharacters(chars.map((c) => enrichCharacter(c, refData)));
      let finalMaps = mapList;
      if (finalMaps.length === 0) {
        const created = await createMap(id, "Battle Map");
        finalMaps = [created];
      }
      setMaps(finalMaps);
      setActiveMapId(finalMaps[0].id);
    } finally {
      setCampaignLoading(false);
      setView(pendingRole);
    }
  }

  async function handleCreateCampaign(name) {
    const created = await createCampaign(name);
    setCampaigns((prev) => [created, ...prev]);
    return created;
  }

  function chooseRole(role) {
    setPendingRole(role);
    setView(role === "dm" ? "dm-gate" : "campaign-select");
  }
  function switchCampaign() {
    setCampaignId(null);
    setCharacters([]);
    setMaps([]);
    setActiveMapId(null);
    setView("campaign-select");
  }
  function backToHall() {
    setPendingRole(null);
    setCampaignId(null);
    setCharacters([]);
    setMaps([]);
    setActiveMapId(null);
    setView("landing");
  }

  async function handleAddCharacter(name) {
    const created = await createCharacter(name, campaignId);
    setCharacters((prev) => [...prev, enrichCharacter(created, refData)]);
    setSelectedId(created.id);
    setTab("sheet");
  }
  function handleCharacterChanged(updated) {
    const enriched = enrichCharacter(updated, refData);
    setCharacters((prev) => prev.map((c) => (c.id === enriched.id ? enriched : c)));
    if (updated.hp) {
      syncTokenHp("character", updated.id, updated.hp.current, updated.hp.max).catch(() => {});
      setMaps((prev) => prev.map((m) => ({
        ...m,
        tokens: m.tokens.map((t) => (t.entity_type === "character" && t.entity_id === updated.id ? { ...t, hp_current: updated.hp.current, hp_max: updated.hp.max } : t)),
      })));
    }
  }
  function handleCampaignChanged(updated) {
    setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }
  async function handleDeleteCharacter(id) {
    await deleteCharacter(id);
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  }
  function handleImportedCharacter(cloned) {
    setCharacters((prev) => [...prev, enrichCharacter(cloned, refData)]);
  }
  async function handlePlaceOnMap(character) {
    if (!activeMap) return;
    const token = await addToken(activeMap.id, {
      entityType: "character", entityId: character.id, label: character.name, color: "#4a6d8b",
      hpCurrent: character.hp.current, hpMax: character.hp.max,
      spriteKey: (character.class_name || "fighter").toLowerCase(),
      spriteColor: character.sprite_color || "blue",
    });
    updateMapTokens(activeMap.id, [...activeMap.tokens, token]);
  }
  function handleReferenceDataChanged(kind, item) {
    setRefData((prev) => ({ ...prev, [kind]: [...prev[kind], item].sort((a, b) => a.name.localeCompare(b.name)) }));
  }

  // ---------- map helpers ----------
  const activeMap = maps.find((m) => m.id === activeMapId) || null;
  function updateMapTokens(mapId, tokens) {
    setMaps((prev) => prev.map((m) => (m.id === mapId ? { ...m, tokens } : m)));
  }
  function updateMapFields(mapId, fields) {
    setMaps((prev) => prev.map((m) => (m.id === mapId ? { ...m, ...fields } : m)));
  }
  async function handleCreateMap() {
    const created = await createMap(campaignId, "New Map");
    setMaps((prev) => [...prev, created]);
    setActiveMapId(created.id);
  }
  async function handleDeleteMap(id) {
    await deleteMap(id);
    setMaps((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (activeMapId === id && next.length > 0) setActiveMapId(next[0].id);
      return next;
    });
  }
  async function handleRenameMap(id, name) {
    await renameMap(id, name);
    updateMapFields(id, { name });
  }

  const selected = characters.find((c) => c.id === selectedId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.void }}>
        <span style={{ color: T.parchmentDim, ...fontBody }}>Loading…</span>
      </div>
    );
  }

  const PARTY_TABS = [
    { id: "roster", label: "Roster", icon: Users },
    { id: "sheet", label: "Character Sheet", icon: ScrollText },
    { id: "map", label: "Map", icon: MapIcon },
    { id: "reference", label: "Reference", icon: BookOpen },
  ];
  const DM_TABS = [
    { id: "roster", label: "Roster", icon: Users },
    { id: "monsters", label: "Monsters", icon: Skull },
    { id: "map", label: "Map", icon: MapIcon },
    { id: "items", label: "Items", icon: Backpack },
    { id: "homebrew", label: "Homebrew", icon: Sparkles },
    { id: "reference", label: "Reference", icon: BookOpen },
  ];
  const currentCampaign = campaigns.find((c) => c.id === campaignId);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: T.void }}>
      <style>{GLOBAL_CSS}</style>

      {view === "landing" && (
        <Landing onChooseParty={() => chooseRole("party")} onChooseDM={() => chooseRole("dm")} connectionStatus={connectionStatus} />
      )}

      {view === "dm-gate" && (
        <PinGate hasPin={!!dmPin} onSuccess={async () => { setDmPin(await loadDmPin()); setView("campaign-select"); }} onBack={() => setView("landing")} />
      )}

      {view === "campaign-select" && (
        <CampaignPicker campaigns={campaigns} onSelect={enterCampaign} onCreate={handleCreateCampaign} onBack={backToHall} />
      )}

      {campaignLoading && (
        <div className="flex-1 flex items-center justify-center"><span style={{ color: T.parchmentDim, ...fontBody }}>Loading campaign…</span></div>
      )}

      {!campaignLoading && (view === "party" || view === "dm") && (
        <>
          <div className="flex items-center gap-1 px-4 py-2 flex-wrap" style={{ borderBottom: `1px solid ${T.line}`, background: T.panel }}>
            <button onClick={backToHall} className="flex items-center gap-1 px-2 py-1.5 rounded text-sm mr-2" style={{ color: T.parchmentDim, ...fontBody }}>
              <ArrowLeft size={14} /> Hall
            </button>
            <span style={{ ...fontDisplay, color: T.gold, fontSize: "20px", fontWeight: 700 }} className="mr-1">
              {view === "party" ? "Party Ledger" : "DM Screen"}
            </span>
            <button onClick={switchCampaign} className="text-xs mr-3 underline" style={{ color: T.parchmentDim, ...fontBody }}>
              {currentCampaign?.name} (switch)
            </button>
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

          {view === "dm" && currentCampaign && (
            <div className="px-4 py-2" style={{ borderBottom: `1px solid ${T.line}`, background: T.panel }}>
              <CampaignSettings campaign={currentCampaign} onChanged={handleCampaignChanged} />
            </div>
          )}

          {view === "party" && (
            <div className="flex flex-1 flex-col sm:flex-row">
              {(tab === "roster" || tab === "sheet") && (
                <div className="sm:w-72 w-full flex-shrink-0">
                  <Roster
                    characters={characters} selectedId={selectedId}
                    onSelect={(id) => { setSelectedId(id); setTab("sheet"); }}
                    onAdd={handleAddCharacter}
                    campaigns={campaigns} currentCampaignId={campaignId} onImported={handleImportedCharacter}
                  />
                </div>
              )}
              <div className="flex-1 overflow-auto">
                {tab === "sheet" && (selected ? (
                  <CharacterSheet character={selected} referenceData={refData} onChanged={handleCharacterChanged} />
                ) : (
                  <div className="p-8"><p style={{ color: T.parchmentDim, ...fontBody }}>Select or add a character from the party list.</p></div>
                ))}
                {tab === "roster" && (
                  <div className="p-8 max-w-lg">
                    <p style={{ ...fontDisplay, color: T.parchment, fontSize: "20px" }} className="mb-2">Welcome back, adventurer.</p>
                    {currentCampaign?.description && (
                      <p className="text-sm mb-3 italic" style={{ color: T.parchmentDim, ...fontBody }}>{currentCampaign.description}</p>
                    )}
                    <p className="text-sm" style={{ color: T.parchmentDim, ...fontBody }}>Pick a character from the left to open their sheet, or add a new one.</p>
                  </div>
                )}
                {tab === "map" && (
                  <>
                    <MapTabs maps={maps} activeMapId={activeMapId} onSelect={setActiveMapId} onCreate={handleCreateMap} onDelete={handleDeleteMap} onRename={handleRenameMap} />
                    <CombatMap map={activeMap} canEdit={view === "dm"} onMapChanged={(m) => updateMapFields(m.id, m)} onTokensChanged={(tokens) => updateMapTokens(activeMap.id, tokens)} />
                  </>
                )}
                {tab === "reference" && <PartyReference />}
              </div>
            </div>
          )}

          {view === "dm" && (
            <div className="flex-1 overflow-auto">
              {dmTab === "roster" && (
                <DmRosterPanel
                  characters={characters} referenceData={refData}
                  onChanged={handleCharacterChanged} onDelete={handleDeleteCharacter}
                  onPlaceOnMap={handlePlaceOnMap} canPlaceOnMap={!!activeMap}
                />
              )}
              {dmTab === "monsters" && <MonsterPanel map={activeMap} onTokensChanged={(tokens) => updateMapTokens(activeMap.id, tokens)} />}
              {dmTab === "map" && (
                <>
                  <MapTabs maps={maps} activeMapId={activeMapId} onSelect={setActiveMapId} onCreate={handleCreateMap} onDelete={handleDeleteMap} onRename={handleRenameMap} />
                  <CombatMap map={activeMap} canEdit={view === "dm"} onMapChanged={(m) => updateMapFields(m.id, m)} onTokensChanged={(tokens) => updateMapTokens(activeMap.id, tokens)} />
                </>
              )}
              {dmTab === "items" && <ItemsPanel />}
              {dmTab === "homebrew" && <HomebrewPanel referenceData={refData} onReferenceDataChanged={handleReferenceDataChanged} />}
              {dmTab === "reference" && <DmReference />}
            </div>
          )}
        </>
      )}
    </div>
  );
}
