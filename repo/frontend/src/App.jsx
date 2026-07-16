import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import "./styles.css";

const DM_PIN_KEY = "dnd-app-dm-pin";

function useSrdCounts() {
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function check() {
      const tables = ["races", "classes", "monsters", "spells", "items"];
      const results = {};
      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });
        if (error) {
          setError(error.message);
          return;
        }
        results[table] = count;
      }
      setCounts(results);
    }
    check();
  }, []);

  return { counts, error };
}

function ConnectionStatus() {
  const { counts, error } = useSrdCounts();

  if (error) {
    return (
      <p className="status status-error">
        Couldn't reach Supabase yet: {error}. Check frontend/.env (local) or
        the GitHub Actions secrets (deployed) — see README.md.
      </p>
    );
  }
  if (!counts) return <p className="status">Checking Supabase connection…</p>;

  return (
    <p className="status status-ok">
      Connected — {counts.races} races, {counts.classes} classes,{" "}
      {counts.spells} spells, {counts.items} items, {counts.monsters} monsters
      loaded.
    </p>
  );
}

function Landing({ onChooseRole }) {
  return (
    <div className="landing">
      <h1 className="title">The Party</h1>
      <p className="subtitle">Choose how you're entering tonight's session.</p>
      <div className="role-buttons">
        <button className="btn" onClick={() => onChooseRole("party")}>
          Party Member
        </button>
        <button className="btn btn-dm" onClick={() => onChooseRole("dm")}>
          Dungeon Master
        </button>
      </div>
      <ConnectionStatus />
    </div>
  );
}

function DmPinGate({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const storedPin = localStorage.getItem(DM_PIN_KEY);

  function handleSubmit(e) {
    e.preventDefault();
    if (!storedPin) {
      localStorage.setItem(DM_PIN_KEY, pin);
      onUnlock();
      return;
    }
    if (pin === storedPin) {
      onUnlock();
    } else {
      setError("Wrong PIN.");
    }
  }

  return (
    <div className="pin-gate">
      <h2>{storedPin ? "Enter DM PIN" : "Set a DM PIN"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
          autoFocus
        />
        <button className="btn" type="submit">
          {storedPin ? "Unlock" : "Set PIN"}
        </button>
      </form>
      {error && <p className="status status-error">{error}</p>}
      <p className="hint">
        This is a friendly gate to keep curious hands out, not real security —
        anyone with dev tools could bypass it.
      </p>
    </div>
  );
}

function TabbedView({ tabs, role, onExit }) {
  const [active, setActive] = useState(tabs[0].id);
  const ActiveComponent = tabs.find((t) => t.id === active).Component;

  return (
    <div className="app-shell">
      <div className="topbar">
        <button className="link" onClick={onExit}>
          ← Hall
        </button>
        <div className="tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`tab ${active === t.id ? "tab-active" : ""}`}
              onClick={() => setActive(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="content">
        <ActiveComponent />
      </div>
    </div>
  );
}

function Placeholder({ name }) {
  return (
    <div className="placeholder">
      <p>{name} — built in the next phase.</p>
    </div>
  );
}

const PARTY_TABS = [
  { id: "roster", label: "Roster", Component: () => <Placeholder name="Character roster + creation" /> },
  { id: "sheet", label: "Character Sheet", Component: () => <Placeholder name="Character sheet" /> },
  { id: "map", label: "Map", Component: () => <Placeholder name="Combat map" /> },
];

const DM_TABS = [
  { id: "monsters", label: "Monsters", Component: () => <Placeholder name="Monster browser + Claude generator" /> },
  { id: "map", label: "Map", Component: () => <Placeholder name="Combat map + token deployment" /> },
  { id: "items", label: "Items", Component: () => <Placeholder name="Item/equipment browser" /> },
];

export default function App() {
  const [view, setView] = useState("landing"); // landing | party | dm-gate | dm
  const [error, setError] = useState(null);

  function chooseRole(role) {
    if (role === "party") setView("party");
    if (role === "dm") setView("dm-gate");
  }

  return (
    <div className="app-root">
      {view === "landing" && <Landing onChooseRole={chooseRole} />}
      {view === "dm-gate" && (
        <DmPinGate onUnlock={() => setView("dm")} />
      )}
      {view === "party" && (
        <TabbedView tabs={PARTY_TABS} role="party" onExit={() => setView("landing")} />
      )}
      {view === "dm" && (
        <TabbedView tabs={DM_TABS} role="dm" onExit={() => setView("landing")} />
      )}
    </div>
  );
}
