import React, { useState } from "react";
import { StickyNote, Plus, X, Swords, User, MapPin, Milestone, Gem, Bell, ChevronDown, ChevronRight } from "lucide-react";
import { T, fontDisplay, fontBody } from "../lib/gameData";
import { SelectField } from "./atoms";
import { useDebouncedField } from "../lib/hooks";

const CATEGORIES = [
  { id: "encounter", name: "Encounter", icon: Swords, color: T.blood },
  { id: "npc", name: "NPC", icon: User, color: T.gold },
  { id: "location", name: "Location", icon: MapPin, color: T.moss },
  { id: "plot", name: "Plot", icon: Milestone, color: T.gold },
  { id: "loot", name: "Loot", icon: Gem, color: T.moss },
  { id: "reminder", name: "Reminder", icon: Bell, color: T.blood },
];
const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

const STATUS_ORDER = ["planned", "active", "done"];
const STATUS_LABELS = { planned: "Planned", active: "Active", done: "Done" };
const STATUS_COLORS = { planned: T.parchmentDim, active: T.gold, done: T.moss };
function nextStatus(status) {
  const idx = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}

function AddNoteForm({ onCreate, onCancel }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("encounter");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onCreate({ title: title.trim(), category, body, status: "planned" });
      setTitle("");
      setBody("");
      onCancel();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg p-4 flex flex-col gap-3 max-w-2xl" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
      <div className="flex flex-wrap gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
          className="flex-1 min-w-[160px] rounded px-2 py-1.5 text-sm outline-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
        <SelectField value={category} onChange={setCategory} options={CATEGORIES} small />
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Notes…" rows={3}
        className="rounded px-2 py-1.5 text-sm outline-none resize-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={saving || !title.trim()} className="rounded px-3 py-1.5 text-sm"
          style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment, ...fontBody }}>
          {saving ? "Saving…" : "Add Note"}
        </button>
        <button onClick={onCancel} className="rounded px-3 py-1.5 text-sm" style={{ background: "transparent", border: `1px solid ${T.line}`, color: T.parchmentDim, ...fontBody }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function NoteCard({ note, onChanged, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle, flushTitle] = useDebouncedField(note.title, (v) => onChanged(note.id, { title: v }));
  const [body, setBody, flushBody] = useDebouncedField(note.body || "", (v) => onChanged(note.id, { body: v }));
  const cat = CATEGORY_BY_ID[note.category];
  const Icon = cat.icon;
  const done = note.status === "done";

  return (
    <div className="rounded-lg p-3" style={{ background: T.panel2, border: `1px solid ${T.line}`, opacity: done ? 0.55 : 1 }}>
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpanded((e) => !e)}>
        {expanded ? <ChevronDown size={14} color={T.parchmentDim} /> : <ChevronRight size={14} color={T.parchmentDim} />}
        <Icon size={14} color={cat.color} />
        <span className="flex-1 min-w-0 truncate" style={{ ...fontDisplay, color: T.parchment, fontSize: "16px", fontWeight: 600 }}>{note.title}</span>
        <button onClick={(e) => { e.stopPropagation(); onChanged(note.id, { status: nextStatus(note.status) }); }}
          className="text-[10px] px-2 py-0.5 rounded flex-shrink-0" style={{ background: T.void, border: `1px solid ${STATUS_COLORS[note.status]}`, color: STATUS_COLORS[note.status], ...fontBody }}>
          {STATUS_LABELS[note.status]}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} style={{ color: T.parchmentDim }}><X size={14} /></button>
      </div>
      {expanded && (
        <div className="mt-3 flex flex-col gap-2 pl-6">
          <div className="flex flex-wrap gap-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={flushTitle}
              className="flex-1 min-w-[160px] rounded px-2 py-1 text-sm outline-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
            <SelectField value={note.category} onChange={(v) => onChanged(note.id, { category: v })} options={CATEGORIES} small />
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} onBlur={flushBody} placeholder="Notes…" rows={4}
            className="rounded px-2 py-1.5 text-sm outline-none resize-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontBody }} />
        </div>
      )}
    </div>
  );
}

export default function SessionNotesPanel({ notes, onCreate, onChanged, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const visible = filter === "all" ? notes : notes.filter((n) => n.category === filter);

  return (
    <div className="p-4 flex flex-col gap-3 max-w-7xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote size={16} color={T.gold} />
          <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Session Notes</span>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1 rounded px-3 py-1.5 text-sm"
            style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment, ...fontBody }}>
            <Plus size={14} /> Add Note
          </button>
        )}
      </div>

      {showForm && <AddNoteForm onCreate={onCreate} onCancel={() => setShowForm(false)} />}

      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilter("all")} className="rounded px-2.5 py-1 text-xs"
          style={{ background: filter === "all" ? T.panel2 : "transparent", border: `1px solid ${filter === "all" ? T.line : "transparent"}`, color: filter === "all" ? T.parchment : T.parchmentDim, ...fontBody }}>
          All
        </button>
        {CATEGORIES.map(({ id, name, icon: Icon, color }) => (
          <button key={id} onClick={() => setFilter(id)} className="flex items-center gap-1 rounded px-2.5 py-1 text-xs"
            style={{ background: filter === id ? T.panel2 : "transparent", border: `1px solid ${filter === id ? T.line : "transparent"}`, color: filter === id ? T.parchment : T.parchmentDim, ...fontBody }}>
            <Icon size={11} color={color} /> {name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 items-start">
        {visible.map((note) => (
          <NoteCard key={note.id} note={note} onChanged={onChanged} onDelete={onDelete} />
        ))}
        {visible.length === 0 && <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>No notes yet.</p>}
      </div>
    </div>
  );
}
