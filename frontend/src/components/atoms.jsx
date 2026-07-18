import React from "react";
import { X } from "lucide-react";
import { T, fontBody, fontMono } from "../lib/gameData";

export function IconBtn({ onClick, children, title, danger }) {
  return (
    <button onClick={onClick} title={title} className="p-1.5 rounded transition-colors"
      style={{ color: danger ? T.blood : T.parchmentDim, border: `1px solid ${T.line}`, background: T.panel2 }}
      onMouseEnter={(e) => (e.currentTarget.style.color = danger ? "#d9534f" : T.parchment)}
      onMouseLeave={(e) => (e.currentTarget.style.color = danger ? T.blood : T.parchmentDim)}>
      {children}
    </button>
  );
}

export function NumberField({ label, value, onChange, small }) {
  return (
    <label className="flex flex-col gap-1" style={fontBody}>
      {label && <span className="text-[10px] uppercase tracking-wider" style={{ color: T.parchmentDim }}>{label}</span>}
      <input type="number" value={value} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className={`${small ? "w-14" : "w-20"} rounded px-2 py-1 text-center outline-none`}
        style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontMono }} />
    </label>
  );
}

export function TextField({ label, value, onChange, placeholder, wide }) {
  return (
    <label className="flex flex-col gap-1 flex-1" style={fontBody}>
      {label && <span className="text-[10px] uppercase tracking-wider" style={{ color: T.parchmentDim }}>{label}</span>}
      <input type="text" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className={`${wide ? "w-full" : ""} rounded px-2 py-1.5 outline-none`}
        style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}` }} />
    </label>
  );
}

export function SelectField({ label, value, onChange, options, small }) {
  return (
    <label className="flex flex-col gap-1" style={fontBody}>
      {label && <span className="text-[10px] uppercase tracking-wider" style={{ color: T.parchmentDim }}>{label}</span>}
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}
        className={`${small ? "w-32" : "w-full"} rounded px-2 py-1.5 outline-none`}
        style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}` }}>
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>{opt.name}</option>
        ))}
      </select>
    </label>
  );
}

// Editable list of plain strings — used for properties, languages, benefits, etc.
export function StringListField({ label, values, onChange, placeholder }) {
  function updateAt(i, v) { const next = [...values]; next[i] = v; onChange(next); }
  function removeAt(i) { onChange(values.filter((_, idx) => idx !== i)); }
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-[10px] uppercase tracking-wider" style={{ ...fontBody, color: T.parchmentDim }}>{label}</span>}
      {values.map((v, i) => (
        <div key={i} className="flex gap-1.5">
          <input value={v} onChange={(e) => updateAt(i, e.target.value)} placeholder={placeholder}
            className="flex-1 rounded px-2 py-1 text-sm outline-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
          <IconBtn onClick={() => removeAt(i)} title="Remove" danger><X size={13} /></IconBtn>
        </div>
      ))}
      <button onClick={() => onChange([...values, ""])} className="text-xs self-start rounded px-2 py-1"
        style={{ background: T.panel2, border: `1px solid ${T.line}`, color: T.parchmentDim, ...fontBody }}>+ Add</button>
    </div>
  );
}

// Editable list of {name, description} objects — used for traits, actions, features, benefits.
export function NamedListField({ label, values, onChange }) {
  function updateAt(i, patch) { onChange(values.map((v, idx) => (idx === i ? { ...v, ...patch } : v))); }
  function removeAt(i) { onChange(values.filter((_, idx) => idx !== i)); }
  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-[10px] uppercase tracking-wider" style={{ ...fontBody, color: T.parchmentDim }}>{label}</span>}
      {values.map((v, i) => (
        <div key={i} className="rounded p-2 flex flex-col gap-1" style={{ background: T.void, border: `1px solid ${T.line}` }}>
          <div className="flex gap-1.5">
            <input value={v.name || ""} onChange={(e) => updateAt(i, { name: e.target.value })} placeholder="Name"
              className="flex-1 rounded px-2 py-1 text-sm outline-none" style={{ background: T.panel2, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
            <IconBtn onClick={() => removeAt(i)} title="Remove" danger><X size={13} /></IconBtn>
          </div>
          <textarea value={v.description || ""} onChange={(e) => updateAt(i, { description: e.target.value })} placeholder="Description" rows={2}
            className="rounded px-2 py-1 text-sm outline-none resize-none" style={{ background: T.panel2, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
        </div>
      ))}
      <button onClick={() => onChange([...values, { name: "", description: "" }])} className="text-xs self-start rounded px-2 py-1"
        style={{ background: T.panel2, border: `1px solid ${T.line}`, color: T.parchmentDim, ...fontBody }}>+ Add</button>
    </div>
  );
}
