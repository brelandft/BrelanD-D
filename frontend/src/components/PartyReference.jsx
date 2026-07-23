import React from "react";
import { BookOpen } from "lucide-react";
import { T, fontDisplay, fontBody, fontMono } from "../lib/gameData";

function Card({ title, children }) {
  return (
    <div className="rounded-lg p-4" style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
      <div className="text-xs uppercase tracking-widest mb-2" style={{ ...fontBody, color: T.gold }}>{title}</div>
      <div className="text-sm" style={{ ...fontBody, color: T.parchment }}>{children}</div>
    </div>
  );
}

export default function PartyReference() {
  return (
    <div className="p-4 flex flex-col gap-3 max-w-2xl">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen size={16} color={T.gold} />
        <span className="text-xs uppercase tracking-widest" style={{ ...fontBody, color: T.gold }}>Quick Reference</span>
      </div>

      <Card title="On your turn">
        You get one <b>Action</b>, one <b>Movement</b> (up to your speed, split up however you like), and one <b>Bonus Action</b> if something you have grants one. You can also interact with one object for free (drawing a weapon, opening a door). <b>Reactions</b> can be used once between your turns, whenever the trigger for one comes up — like an opportunity attack.
      </Card>

      <Card title="Making a check">
        Roll a d20, add the relevant ability modifier, and add your proficiency bonus if you're proficient in that skill. Compare the total to the DC (difficulty) your DM sets.
        <div className="mt-2 text-xs" style={{ color: T.parchmentDim, ...fontMono }}>d20 + ability modifier + proficiency (if applicable) ≥ DC</div>
      </Card>

      <Card title="Attacking">
        Roll a d20, add your attack bonus (ability modifier + proficiency bonus for weapons/spells you're trained in). If the total meets or beats the target's AC, you hit — then roll damage.
      </Card>

      <Card title="Advantage & disadvantage">
        <b>Advantage:</b> roll two d20s, take the higher. <b>Disadvantage:</b> roll two, take the lower. They don't stack — if you have both, they cancel out and you roll normally.
      </Card>

      <Card title="Initiative">
        At the start of combat, everyone rolls a d20 and adds their Dexterity modifier. Highest total goes first, then it proceeds in descending order for the whole fight.
      </Card>

      <Card title="Death saving throws">
        At 0 HP you're unconscious. On your turn, roll a d20 with no modifiers: 10 or higher is a success, below 10 is a failure. Three successes stabilizes you; three failures and your character dies. A natural 20 immediately regains 1 HP; a natural 1 counts as two failures. Taking any damage while at 0 HP counts as a failure (or two, on a critical hit).
      </Card>

      <Card title="Resting">
        A <b>short rest</b> is at least 1 hour — you can spend Hit Dice to heal. A <b>long rest</b> is at least 8 hours — you regain all HP, half your total Hit Dice (rounded down, minimum 1), and all spent spell slots.
      </Card>
    </div>
  );
}
