-- Migration: allow editing/deleting homebrew content, not just creating it
-- Safe on an existing project with live data — widens existing policies,
-- doesn't touch data.
--
-- Migration 005 only ever granted anon INSERT on backgrounds/feats/
-- subclasses/items/spells, so once a homebrew entry was created there was
-- no way to fix a typo or remove it — not through the app, not even
-- through a script using the anon key. Replaces those insert-only
-- policies with full access, matching the pattern already used for
-- characters/monsters/campaigns/etc.

drop policy if exists "anon insert" on backgrounds;
drop policy if exists "anon insert" on feats;
drop policy if exists "anon insert" on subclasses;
drop policy if exists "anon insert" on items;
drop policy if exists "anon insert" on spells;

create policy "anon full access" on backgrounds for all using (true) with check (true);
create policy "anon full access" on feats for all using (true) with check (true);
create policy "anon full access" on subclasses for all using (true) with check (true);
create policy "anon full access" on items for all using (true) with check (true);
create policy "anon full access" on spells for all using (true) with check (true);
