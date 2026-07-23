import React from "react";
import { BookOpen } from "lucide-react";
import { T, fontBody, fontMono, SKILLS } from "../lib/gameData";

function Section({ title, children }) {
  return (
    <div className="rounded-lg p-4" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
      <div className="text-xs uppercase tracking-widest mb-2" style={{ ...fontBody, color: T.gold }}>{title}</div>
      {children}
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div className="flex justify-between py-0.5 text-sm" style={{ ...fontBody, color: T.parchment }}>
      <span>{label}</span>
      <span style={{ ...fontMono, color: T.parchmentDim }}>{value}</span>
    </div>
  );
}

const DCS = [
  ["Very easy", "5"], ["Easy", "10"], ["Medium", "15"], ["Hard", "20"], ["Very hard", "25"], ["Nearly impossible", "30"],
];

const CONDITIONS = [
  ["Blinded", "Can't see; auto-fails sight checks; attacks against you have advantage, yours have disadvantage."],
  ["Charmed", "Can't attack the charmer; charmer has advantage on social checks against you."],
  ["Deafened", "Can't hear; auto-fails hearing checks."],
  ["Frightened", "Disadvantage on checks/attacks while the source is in sight; can't move closer to it."],
  ["Grappled", "Speed becomes 0; ends if the grappler is incapacitated."],
  ["Incapacitated", "Can't take actions or reactions."],
  ["Invisible", "Impossible to see without special means; attacks against you have disadvantage, yours have advantage."],
  ["Paralyzed", "Incapacitated, can't move/speak; auto-fails Str/Dex saves; attacks have advantage; melee hits within 5ft are automatic crits."],
  ["Petrified", "Transformed to stone; incapacitated; resistance to all damage; auto-fails Str/Dex saves."],
  ["Poisoned", "Disadvantage on attack rolls and ability checks."],
  ["Prone", "Disadvantage on attacks; melee attacks against you have advantage, ranged have disadvantage; costs half your movement to stand."],
  ["Restrained", "Speed 0; disadvantage on attacks and Dex saves; attacks against you have advantage."],
  ["Stunned", "Incapacitated, can't move, can speak falteringly; auto-fails Str/Dex saves; attacks have advantage."],
  ["Unconscious", "Incapacitated, can't move/speak, unaware of surroundings; drops what it's holding, falls prone; auto-fails Str/Dex saves; attacks have advantage; melee hits within 5ft are automatic crits."],
];

const EXHAUSTION = [
  ["1", "Disadvantage on ability checks"],
  ["2", "Speed halved"],
  ["3", "Disadvantage on attack rolls and saving throws"],
  ["4", "Hit point maximum halved"],
  ["5", "Speed reduced to 0"],
  ["6", "Death"],
];

const ACTIONS = [
  "Attack", "Cast a spell", "Dash (double speed)", "Disengage (no opportunity attacks)",
  "Dodge (attacks against you have disadvantage)", "Help (give advantage to an ally)",
  "Hide (attempt a Stealth check)", "Ready (prepare an action for a trigger)",
  "Search", "Use an object",
];

export default function DmReference() {
  return (
    <div className="p-4 flex flex-col gap-3 max-w-2xl">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen size={16} color={T.gold} />
        <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>DM Cheat Sheet</span>
      </div>

      <Section title="Difficulty classes">
        {DCS.map(([label, dc]) => <Row key={label} label={label} value={`DC ${dc}`} />)}
      </Section>

      <Section title="Action economy">
        <p className="text-sm mb-2" style={{ ...fontBody, color: T.parchment }}>Each turn: one Action, one Movement, one Bonus Action (if available), one free object interaction. Reactions trigger between turns.</p>
        <div className="flex flex-wrap gap-1.5">
          {ACTIONS.map((a) => (
            <span key={a} className="text-xs px-2 py-1 rounded" style={{ background: T.void, border: `1px solid ${T.line}`, color: T.parchmentDim, ...fontBody }}>{a}</span>
          ))}
        </div>
      </Section>

      <Section title="Cover">
        <Row label="Half cover" value="+2 AC, +2 Dex saves" />
        <Row label="Three-quarters cover" value="+5 AC, +5 Dex saves" />
        <Row label="Total cover" value="Can't be targeted directly" />
      </Section>

      <Section title="Conditions">
        <div className="flex flex-col gap-1.5">
          {CONDITIONS.map(([name, effect]) => (
            <div key={name} className="text-sm" style={{ ...fontBody, color: T.parchment }}>
              <span style={{ color: T.gold }}>{name}.</span> <span style={{ color: T.parchmentDim }}>{effect}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Exhaustion">
        {EXHAUSTION.map(([level, effect]) => <Row key={level} label={`Level ${level}`} value={effect} />)}
        <p className="text-xs mt-2" style={{ color: T.parchmentDim, ...fontBody }}>Each level's effects are on top of all previous levels' effects. A long rest removes one level (with food and drink).</p>
      </Section>

      <Section title="Skills by ability">
        <div className="grid sm:grid-cols-2 gap-x-4">
          {SKILLS.map(([name, ab]) => <Row key={name} label={name} value={ab.toUpperCase()} />)}
        </div>
      </Section>

      <Section title="Passive perception">
        <div className="text-sm" style={{ ...fontMono, color: T.parchmentDim }}>10 + Wisdom modifier (+ proficiency bonus, if proficient)</div>
      </Section>

      <Section title="Resting">
        <Row label="Short rest" value="≥ 1 hour — spend Hit Dice to heal" />
        <Row label="Long rest" value="≥ 8 hours — full HP, half Hit Dice, all spell slots" />
      </Section>
    </div>
  );
}
