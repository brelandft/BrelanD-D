import React from "react";
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
