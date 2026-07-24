-- Migration: character creation finalization
-- Additive — safe on an existing project with live data. Existing
-- characters default to finalized = true, so nothing that's already
-- being played suddenly becomes editable by players unexpectedly.
-- New characters are created with finalized = false (see api.js), so a
-- player can build their own level-1 character — race, class, subclass,
-- background, ability scores — before it locks to DM-only editing.

alter table characters add column finalized boolean default true;
update characters set finalized = true where finalized is null;
