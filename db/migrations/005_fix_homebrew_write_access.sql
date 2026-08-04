-- Migration: fix homebrew write access + inventory item_id
-- Additive/permissive — safe on an existing project with live data.
--
-- Two production bugs, found by exercising every homebrew form on the
-- live site directly:
--
-- 1. RLS on backgrounds/feats/subclasses/items/spells only ever granted
--    "select" to the anon key (see db/schema.sql) — no migration added a
--    write policy either. Every homebrew form for those five tables
--    (Add Subclass/Background/Feat/Spell/Item) has been failing silently
--    in production with a Postgres 42501 "new row violates row-level
--    security policy" error. Only the Monster form worked, since
--    `monsters` already had a "for all" policy. This adds the missing
--    insert policies, matching the pattern already used elsewhere.
--
-- 2. character_inventory.item_id is `not null`, but the free-text
--    inventory UI always inserts item_id: null (inventory is
--    intentionally not linked to the items catalog yet — see README).
--    Every "add item" click has been failing with a 23502 not-null
--    violation. Drops the constraint to match the actual design.

create policy "anon insert" on backgrounds for insert to anon with check (true);
create policy "anon insert" on feats for insert to anon with check (true);
create policy "anon insert" on subclasses for insert to anon with check (true);
create policy "anon insert" on items for insert to anon with check (true);
create policy "anon insert" on spells for insert to anon with check (true);

alter table character_inventory alter column item_id drop not null;
