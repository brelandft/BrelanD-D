// Shared constants and pure helpers — no Supabase calls here.

export const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];

export const SKILLS = [
  ["Acrobatics", "dex"], ["Animal Handling", "wis"], ["Arcana", "int"], ["Athletics", "str"],
  ["Deception", "cha"], ["History", "int"], ["Insight", "wis"], ["Intimidation", "cha"],
  ["Investigation", "int"], ["Medicine", "wis"], ["Nature", "int"], ["Perception", "wis"],
  ["Performance", "cha"], ["Persuasion", "cha"], ["Religion", "int"], ["Sleight of Hand", "dex"],
  ["Stealth", "dex"], ["Survival", "wis"],
];

export const TOKEN_COLORS = ["#a13d2e", "#5b7a5e", "#c2963d", "#4a6d8b", "#7a5b8b", "#8b7a5b"];

export function mod(score) {
  return Math.floor((Number(score) - 10) / 2);
}
export function fmtMod(m) {
  return m >= 0 ? `+${m}` : `${m}`;
}
export function profBonusForLevel(level) {
  return Math.floor((Number(level) - 1) / 4) + 2;
}

export function blankAbilities() {
  return { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
}

// ---------- theme tokens (ported verbatim) ----------
export const T = {
  void: "#16140f", panel: "#211d16", panel2: "#2a251c", line: "#3a3226",
  parchment: "#e8dcc0", parchmentDim: "#a89a7d",
  blood: "#a13d2e", bloodDim: "#6e2c22", moss: "#5b7a5e", mossDim: "#3f5641", gold: "#c2963d",
};
export const fontDisplay = { fontFamily: "'Cormorant Garamond', serif" };
export const fontMono = { fontFamily: "'IBM Plex Mono', monospace" };
export const fontBody = { fontFamily: "'Inter', sans-serif" };

export const GLOBAL_CSS = `
@keyframes pl-flicker { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.9; } }
@keyframes pl-glow { 0%, 100% { opacity: 0.55; transform: scale(0.92); } 50% { opacity: 1; transform: scale(1.18); } }
@keyframes pl-rise { 0% { transform: translateY(0) translateX(0); opacity: 0; } 20% { opacity: 0.9; } 100% { transform: translateY(-60px) translateX(var(--drift, 8px)); opacity: 0; } }
@keyframes pl-shimmer { 0% { background-position: 0 0; } 100% { background-position: 0 60px; } }
@keyframes pl-ribbon { 0%, 100% { transform: translateX(-50%) rotate(-0.6deg); } 50% { transform: translateX(-50%) rotate(0.6deg); } }
@keyframes pl-mist { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(14px); } }
.pl-torch { animation: pl-flicker 2.2s ease-in-out infinite; }
.pl-glow { animation: pl-glow 2.4s ease-in-out infinite; }
.pl-rise { animation: pl-rise 2.6s ease-in infinite; }
.pl-shimmer { animation: pl-shimmer 1.4s linear infinite; }
.pl-ribbon { animation: pl-ribbon 5s ease-in-out infinite; }
.pl-mist { animation: pl-mist 10s ease-in-out infinite; }
`;

export function useFonts() {
  if (typeof document === "undefined") return;
  if (document.getElementById("party-ledger-fonts")) return;
  const link = document.createElement("link");
  link.id = "party-ledger-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap";
  document.head.appendChild(link);
}
