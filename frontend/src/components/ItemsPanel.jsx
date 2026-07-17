import React, { useEffect, useState } from "react";
import { Backpack } from "lucide-react";
import { T, fontDisplay, fontBody } from "../lib/gameData";
import { supabase } from "../lib/supabaseClient";

export default function ItemsPanel() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      let q = supabase.from("items").select("*").order("name").limit(100);
      if (query) q = q.ilike("name", `%${query}%`);
      const { data } = await q;
      if (!cancelled) { setItems(data || []); setLoading(false); }
    }
    run();
    return () => { cancelled = true; };
  }, [query]);

  return (
    <div className="p-4 flex flex-col gap-3 max-w-2xl">
      <div className="flex items-center gap-2">
        <Backpack size={16} color={T.gold} />
        <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Items & Equipment</span>
      </div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items…"
        className="w-full rounded px-2 py-1.5 text-sm outline-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
      {loading && <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>Loading…</p>}
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg px-3 py-2 flex items-center justify-between" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
            <div>
              <span style={{ ...fontDisplay, color: T.parchment, fontSize: "15px", fontWeight: 600 }}>{item.name}</span>
              <span className="text-[11px] ml-2" style={{ ...fontBody, color: T.parchmentDim }}>{item.item_type}{item.subtype ? ` · ${item.subtype}` : ""}</span>
            </div>
            {item.cost_gp != null && <span className="text-xs" style={{ ...fontBody, color: T.gold }}>{item.cost_gp} gp</span>}
          </div>
        ))}
        {!loading && items.length === 0 && <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>No items found.</p>}
      </div>
    </div>
  );
}
