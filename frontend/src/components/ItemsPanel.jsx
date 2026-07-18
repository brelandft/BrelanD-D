import React, { useEffect, useState } from "react";
import { Backpack, Plus } from "lucide-react";
import { T, fontDisplay, fontBody } from "../lib/gameData";
import { supabase } from "../lib/supabaseClient";
import AddItemForm from "./AddItemForm";

export default function ItemsPanel() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function runSearch(q) {
    setLoading(true);
    let query_ = supabase.from("items").select("*").order("name").limit(100);
    if (q) query_ = query_.ilike("name", `%${q}%`);
    const { data } = await query_;
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => { runSearch(""); }, []);

  function handleCreated(item) {
    setItems((prev) => [item, ...prev]);
    setShowForm(false);
  }

  return (
    <div className="p-4 flex flex-col gap-3 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Backpack size={16} color={T.gold} />
          <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Items & Equipment</span>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1 rounded px-3 py-1.5 text-sm"
            style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment, ...fontBody }}>
            <Plus size={14} /> Add Item
          </button>
        )}
      </div>
      {showForm && <AddItemForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />}
      <input value={query} onChange={(e) => { setQuery(e.target.value); runSearch(e.target.value); }} placeholder="Search items…"
        className="w-full rounded px-2 py-1.5 text-sm outline-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
      {loading && <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>Loading…</p>}
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg px-3 py-2 flex items-center justify-between" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
            <div>
              <span style={{ ...fontDisplay, color: T.parchment, fontSize: "15px", fontWeight: 600 }}>{item.name}</span>
              <span className="text-[11px] ml-2" style={{ ...fontBody, color: T.parchmentDim }}>{item.item_type}{item.subtype ? ` · ${item.subtype}` : ""}</span>
              {item.source === "homebrew" && <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded" style={{ background: T.mossDim, color: T.parchment, ...fontBody }}>homebrew</span>}
            </div>
            {item.cost_gp != null && <span className="text-xs" style={{ ...fontBody, color: T.gold }}>{item.cost_gp} gp</span>}
          </div>
        ))}
        {!loading && items.length === 0 && <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>No items found.</p>}
      </div>
    </div>
  );
}
