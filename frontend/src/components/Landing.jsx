import React from "react";
import { Lock, Users } from "lucide-react";
import { T, fontDisplay, fontBody } from "../lib/gameData";
import { BANNER_IMAGE } from "../lib/bannerImage";

function TitleRibbon() {
  return (
    <div
      className="pl-ribbon absolute left-1/2 top-3"
      style={{
        transform: "translateX(-50%)",
        background: "linear-gradient(180deg, #d4ac52, #a9782f)",
        clipPath: "polygon(4% 0%, 96% 0%, 100% 50%, 96% 100%, 4% 100%, 0% 50%)",
        padding: "8px 26px",
        boxShadow: "0 3px 0 rgba(0,0,0,0.35)",
        zIndex: 5,
      }}
    >
      <span style={{ ...fontDisplay, color: "#241a12", fontWeight: 700, fontSize: "22px", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
        Party Ledger
      </span>
    </div>
  );
}

function PartyHero() {
  const particles = Array.from({ length: 7 });
  return (
    <div className="relative overflow-hidden rounded-lg mx-4 mt-4" style={{ border: `1px solid ${T.line}` }}>
      <img src={BANNER_IMAGE} alt="The party: a wizard and three adventurers before a castle at dusk" className="w-full h-auto block" draggable={false} />

      <div className="pl-glow absolute rounded-full blur-md" style={{ width: 46, height: 46, left: "10.5%", top: "6.5%", background: "radial-gradient(circle, rgba(140,210,255,0.9), rgba(80,160,255,0.3) 60%, transparent 75%)" }} />
      {particles.map((_, i) => (
        <div key={i} className="pl-rise absolute rounded-full" style={{
          width: 3, height: 3, background: "#bfe6ff", left: `${11 + (i % 3)}%`, top: "7%",
          "--drift": `${(i % 2 === 0 ? -1 : 1) * (6 + (i % 3) * 4)}px`, animationDelay: `${i * 0.4}s`,
        }} />
      ))}

      <div className="pl-torch absolute rounded-full blur-sm" style={{ width: 5, height: 5, left: "6.2%", top: "34%", background: "#ffdf9a" }} />
      <div className="pl-torch absolute rounded-full blur-sm" style={{ width: 4, height: 4, left: "8.6%", top: "37%", background: "#ffdf9a", animationDelay: "0.8s" }} />

      <div className="pl-shimmer absolute" style={{
        left: "83.5%", top: "38%", width: 22, height: "34%",
        background: "repeating-linear-gradient(180deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.05) 8px, rgba(255,255,255,0.35) 16px)",
        opacity: 0.5, mixBlendMode: "screen",
      }} />

      <div className="pl-mist absolute inset-x-0" style={{ bottom: "18%", height: 40, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />

      <TitleRibbon />

      <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: "18%", background: `linear-gradient(180deg, transparent, ${T.void})` }} />
    </div>
  );
}

export default function Landing({ onChooseParty, onChooseDM, connectionStatus }) {
  return (
    <div className="flex flex-col items-center pb-10">
      <PartyHero />
      <div className="text-center mt-6 px-4">
        <p className="text-sm max-w-sm mx-auto" style={{ ...fontBody, color: T.parchmentDim }}>
          Gather 'round the table. Choose how you're joining tonight's session.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-md px-4">
        <button onClick={onChooseDM} className="flex-1 rounded-lg p-5 flex flex-col items-center gap-2 transition-transform hover:-translate-y-0.5"
          style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
          <Lock size={22} color={T.gold} />
          <span style={{ ...fontDisplay, color: T.parchment, fontSize: "20px", fontWeight: 700 }}>Dungeon Master</span>
          <span className="text-xs text-center" style={{ ...fontBody, color: T.parchmentDim }}>Monsters, maps, and behind-the-screen tools</span>
        </button>
        <button onClick={onChooseParty} className="flex-1 rounded-lg p-5 flex flex-col items-center gap-2 transition-transform hover:-translate-y-0.5"
          style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
          <Users size={22} color={T.gold} />
          <span style={{ ...fontDisplay, color: T.parchment, fontSize: "20px", fontWeight: 700 }}>Party Member</span>
          <span className="text-xs text-center" style={{ ...fontBody, color: T.parchmentDim }}>Create a character or open your sheet</span>
        </button>
      </div>
      {connectionStatus && (
        <p className="text-xs mt-6" style={{ ...fontBody, color: connectionStatus.ok ? "#7a9a6e" : T.blood }}>
          {connectionStatus.message}
        </p>
      )}
    </div>
  );
}
