import React from "react";

export const COLOR_OPTIONS = [
  { key: "red", label: "Red", hex: "#a13d2e" },
  { key: "orange", label: "Orange", hex: "#c2703d" },
  { key: "yellow", label: "Yellow", hex: "#c2963d" },
  { key: "green", label: "Green", hex: "#5b7a5e" },
  { key: "blue", label: "Blue", hex: "#4a6d8b" },
  { key: "purple", label: "Purple", hex: "#7a5b8b" },
];
export const COLOR_HEX = Object.fromEntries(COLOR_OPTIONS.map((c) => [c.key, c.hex]));

// 7x7 bitmaps: '1' = draw, '0' = transparent.
const G = (rows) => rows;

export const CLASS_ICONS = {
  fighter: G(["0000010", "0000100", "0001000", "0010000", "0111100", "0001000", "0001000"]), // sword
  paladin: G(["0011100", "0111110", "1111111", "1111111", "0111110", "0011100", "0001000"]), // shield
  cleric: G(["0001000", "0001000", "0111110", "0001000", "0001000", "0001000", "0000000"]), // holy symbol
  ranger: G(["0011000", "0100100", "1000010", "1000010", "1000010", "0100100", "0011000"]), // bow
  wizard: G(["0001000", "0011100", "0001000", "0001000", "0001000", "0001000", "0001000"]), // staff + orb
  druid: G(["0001000", "0011100", "0111110", "1111111", "0111110", "0011100", "0001000"]), // leaf
  monk: G(["0000000", "0111100", "0111100", "0111100", "0111100", "0011000", "0000000"]), // fist
  rogue: G(["0111110", "1000001", "1011101", "1000001", "1000001", "0111110", "0000000"]), // mask
  barbarian: G(["0011100", "0111110", "1111111", "0011000", "0011000", "0011000", "0011000"]), // axe
  sorcerer: G(["0001000", "0011100", "0111110", "0111110", "0011100", "0001000", "0000000"]), // flame
  warlock: G(["0000000", "0111110", "1111111", "1011101", "1111111", "0111110", "0000000"]), // eye
  bard: G(["0001100", "0001100", "0001100", "0001100", "0111100", "1111100", "0111000"]), // musical note
};

export const MONSTER_ICONS = {
  beast: G(["0010100", "0010100", "0000000", "0111110", "1111111", "1111111", "0111110"]), // paw print
  humanoid: G(["0011000", "0011000", "0000000", "0111110", "0111110", "0111110", "0100010"]),
  undead: G(["0111110", "1111111", "1011101", "1111111", "0101010", "0010100", "0000000"]), // skull
  dragon: G(["0001000", "0011000", "0111100", "1111110", "1111111", "0111110", "0011100"]),
  fiend: G(["1000001", "1100011", "0110110", "0011100", "0001000", "0001000", "0000000"]), // horns
  ooze: G(["0000000", "0011100", "0111110", "1111111", "1111111", "0111110", "0011100"]), // blob
  construct: G(["0101010", "1111111", "0111110", "1111111", "0111110", "1111111", "0101010"]), // gear
  monstrosity: G(["1000001", "1000001", "1100011", "1111111", "0111110", "0011100", "0001000"]), // fangs
};

export const MONSTER_ICON_OPTIONS = Object.keys(MONSTER_ICONS).map((key) => ({ id: key, name: key.charAt(0).toUpperCase() + key.slice(1) }));

export function classIconFor(className) {
  const key = (className || "").toLowerCase();
  return CLASS_ICONS[key] || CLASS_ICONS.fighter;
}
export function monsterIconFor(spriteKey) {
  return MONSTER_ICONS[spriteKey] || MONSTER_ICONS.beast;
}

export function PixelGrid({ grid, color, size = 16 }) {
  return (
    <svg viewBox="0 0 7 7" width={size} height={size} style={{ imageRendering: "pixelated", display: "block" }}>
      {grid.flatMap((row, y) =>
        [...row].map((ch, x) => (ch === "1" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} /> : null))
      )}
    </svg>
  );
}

// A token's full visual: colored body circle + fixed-color pixel-icon badge on top.
export function TokenSprite({ bodyColor, grid, size = 32 }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: bodyColor, border: "2px solid rgba(0,0,0,0.45)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <PixelGrid grid={grid} color="#f4ead2" size={size * 0.62} />
      </div>
    </div>
  );
}
