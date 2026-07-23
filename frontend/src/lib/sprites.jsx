import React from "react";

// Class sprites (real hand-shaded pixel art, generated from a reference style)
import fighter from "../assets/sprites/classes/fighter.png";
import paladin from "../assets/sprites/classes/paladin.png";
import cleric from "../assets/sprites/classes/cleric.png";
import ranger from "../assets/sprites/classes/ranger.png";
import wizard from "../assets/sprites/classes/wizard.png";
import druid from "../assets/sprites/classes/druid.png";
import monk from "../assets/sprites/classes/monk.png";
import rogue from "../assets/sprites/classes/rogue.png";
import barbarian from "../assets/sprites/classes/barbarian.png";
import sorcerer from "../assets/sprites/classes/sorcerer.png";
import warlock from "../assets/sprites/classes/warlock.png";
import bard from "../assets/sprites/classes/bard.png";

// Monster archetype sprites
import beast from "../assets/sprites/monsters/beast.png";
import humanoid from "../assets/sprites/monsters/humanoid.png";
import undead from "../assets/sprites/monsters/undead.png";
import dragon from "../assets/sprites/monsters/dragon.png";
import fiend from "../assets/sprites/monsters/fiend.png";
import ooze from "../assets/sprites/monsters/ooze.png";
import construct from "../assets/sprites/monsters/construct.png";
import monstrosity from "../assets/sprites/monsters/monstrosity.png";

export const CLASS_IMAGES = { fighter, paladin, cleric, ranger, wizard, druid, monk, rogue, barbarian, sorcerer, warlock, bard };
export const MONSTER_IMAGES = { beast, humanoid, undead, dragon, fiend, ooze, construct, monstrosity };

export const MONSTER_ICON_OPTIONS = Object.keys(MONSTER_IMAGES).map((key) => ({ id: key, name: key.charAt(0).toUpperCase() + key.slice(1) }));

export function classImageFor(className) {
  const key = (className || "").toLowerCase();
  return CLASS_IMAGES[key] || CLASS_IMAGES.fighter;
}
export function monsterImageFor(spriteKey) {
  return MONSTER_IMAGES[spriteKey] || MONSTER_IMAGES.beast;
}

export const COLOR_OPTIONS = [
  { key: "red", label: "Red", hex: "#a13d2e" },
  { key: "orange", label: "Orange", hex: "#c2703d" },
  { key: "yellow", label: "Yellow", hex: "#c2963d" },
  { key: "green", label: "Green", hex: "#5b7a5e" },
  { key: "blue", label: "Blue", hex: "#4a6d8b" },
  { key: "purple", label: "Purple", hex: "#7a5b8b" },
];
export const COLOR_HEX = Object.fromEntries(COLOR_OPTIONS.map((c) => [c.key, c.hex]));

// A token's full visual: the real art, with a colored ring around it marking
// whose token it is. We deliberately DON'T recolor the artwork itself — a
// CSS hue-rotate filter would shift every color in the image (skin, metal,
// wood, everything), not just the intended garment, which looks worse than
// no recoloring at all on full-detail art like this. The ring preserves the
// art exactly as generated while still giving each player a distinct marker.
export function TokenSprite({ image, ringColor, size = 40 }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {ringColor && (
        <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `3px solid ${ringColor}`, boxShadow: "0 0 0 1px rgba(0,0,0,0.4)" }} />
      )}
      <img src={image} alt="" draggable={false} style={{ width: size, height: size, objectFit: "contain", position: "relative" }} />
    </div>
  );
}
