-- Migration: equipped-gear slots
-- Additive — safe on an existing project with live data.
--
-- Adds a display-only equipped-slot concept to character_inventory so the
-- DM/players can see at a glance what's actually equipped (vs just
-- carried) when a character has multiple weapons/armor pieces. This does
-- NOT drive any AC/attack-roll calculation — combat and derived stats
-- stay on paper, this is purely for visibility.

alter table character_inventory
  add column slot text check (slot in ('armor', 'shield', 'main_hand', 'off_hand'));
