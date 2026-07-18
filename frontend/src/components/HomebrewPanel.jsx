import React, { useState } from "react";
import { Sparkles, ScrollText, Star, Shapes } from "lucide-react";
import { T, fontBody } from "../lib/gameData";
import AddSpellForm from "./AddSpellForm";
import AddBackgroundForm from "./AddBackgroundForm";
import AddFeatForm from "./AddFeatForm";
import AddSubclassForm from "./AddSubclassForm";

const SECTIONS = [
  { id: "subclasses", label: "Subclasses", icon: Shapes },
  { id: "backgrounds", label: "Backgrounds", icon: ScrollText },
  { id: "feats", label: "Feats", icon: Star },
  { id: "spells", label: "Spells", icon: Sparkles },
];

export default function HomebrewPanel({ referenceData, onReferenceDataChanged }) {
  const [section, setSection] = useState("subclasses");
  const [justAdded, setJustAdded] = useState(null);

  function handleCreated(kind, item) {
    onReferenceDataChanged(kind, item);
    setJustAdded(`${item.name} added.`);
    setTimeout(() => setJustAdded(null), 3000);
  }

  return (
    <div className="p-4 flex flex-col gap-4 max-w-2xl">
      <div className="flex gap-1.5 flex-wrap">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setSection(id)} className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm"
            style={{
              background: section === id ? T.panel2 : "transparent",
              border: `1px solid ${section === id ? T.line : "transparent"}`,
              color: section === id ? T.parchment : T.parchmentDim, ...fontBody,
            }}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {justAdded && <p className="text-xs" style={{ color: "#7a9a6e", ...fontBody }}>{justAdded}</p>}

      {section === "subclasses" && (
        <AddSubclassForm classes={referenceData.classes} onCreated={(item) => handleCreated("subclasses", item)} onCancel={() => {}} />
      )}
      {section === "backgrounds" && (
        <AddBackgroundForm onCreated={(item) => handleCreated("backgrounds", item)} onCancel={() => {}} />
      )}
      {section === "feats" && (
        <AddFeatForm onCreated={(item) => handleCreated("feats", item)} onCancel={() => {}} />
      )}
      {section === "spells" && (
        <AddSpellForm onCreated={(item) => handleCreated("spells", item)} onCancel={() => {}} />
      )}

      <p className="text-xs" style={{ color: T.parchmentDim, ...fontBody }}>
        Anything added here shows up immediately in character creation dropdowns — no rebuild needed.
      </p>
    </div>
  );
}
