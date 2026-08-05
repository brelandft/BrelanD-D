-- Migration: missing 2024 origin feats + backfill origin_feat_name
-- Safe to re-run; upserts on (name, source) for feats, updates by name for
-- backgrounds.
--
-- Context: only 4 of your 16 backgrounds (Acolyte, Criminal, Sage, Soldier)
-- come from the open SRD dataset the import pipeline uses. The other 12
-- were added as homebrew (the full 2024 PHB isn't released under an open
-- license, only a subset is), so they never got an origin_feat_name, and
-- 6 of the feats those backgrounds grant were never in the feats table at
-- all. The 6 feat descriptions below are an original plain-English
-- paraphrase, not official WotC text (which isn't part of the open SRD) —
-- verify exact wording/numbers against your Player's Handbook if it
-- matters at your table, and feel free to edit them via the Homebrew tab.

insert into feats (name, source, prerequisite, description, benefits) values (
  'Crafter', 'homebrew', null,
  'Approximate summary (not official text). You gain proficiency with three different Artisan''s Tools of your choice. When you buy goods made with tools you''re proficient in, you get a discount off market price; when you sell such goods, you get somewhat more than usual. Crafting an item with tools you''re proficient in takes less time than normal.',
  '["Approximate summary (not official text).", "Proficiency with three Artisan''s Tools of your choice.", "Discount when buying goods made with those tools; better price when selling them.", "Faster crafting time with those tools."]'::jsonb
) on conflict (name, source) do update set prerequisite = excluded.prerequisite, description = excluded.description, benefits = excluded.benefits;

insert into feats (name, source, prerequisite, description, benefits) values (
  'Musician', 'homebrew', null,
  'Approximate summary (not official text). You gain proficiency with three Musical Instruments of your choice. Once per short or long rest, you can spend a minute playing for nearby allies who can hear you, giving each a small bonus die they can add to one attack roll, ability check, or saving throw within the next hour.',
  '["Approximate summary (not official text).", "Proficiency with three Musical Instruments of your choice.", "Once per short/long rest: play for a minute to grant nearby allies a bonus die usable on one roll within the hour."]'::jsonb
) on conflict (name, source) do update set prerequisite = excluded.prerequisite, description = excluded.description, benefits = excluded.benefits;

insert into feats (name, source, prerequisite, description, benefits) values (
  'Tough', 'homebrew', null,
  'Approximate summary (not official text). Your hit point maximum increases, and increases again each time you gain a level.',
  '["Approximate summary (not official text).", "Increased hit point maximum now and at every level gained."]'::jsonb
) on conflict (name, source) do update set prerequisite = excluded.prerequisite, description = excluded.description, benefits = excluded.benefits;

insert into feats (name, source, prerequisite, description, benefits) values (
  'Healer', 'homebrew', null,
  'Approximate summary (not official text). When you use a Healer''s Kit to stabilize a dying creature, that creature also regains a small amount of HP. You can also spend a use of a Healer''s Kit as an action to heal a creature for a meaningful amount, scaling with your proficiency bonus and how rested the target is.',
  '["Approximate summary (not official text).", "Stabilizing with a Healer''s Kit also restores a little HP.", "Can spend a Healer''s Kit use to heal a creature a meaningful amount as an action."]'::jsonb
) on conflict (name, source) do update set prerequisite = excluded.prerequisite, description = excluded.description, benefits = excluded.benefits;

insert into feats (name, source, prerequisite, description, benefits) values (
  'Lucky', 'homebrew', null,
  'Approximate summary (not official text). You have a pool of Luck Points (refreshing on a long rest) you can spend to give yourself advantage on an attack roll, ability check, or saving throw before you roll, or to impose disadvantage on an attack roll against you after seeing the roll but before knowing whether it hits.',
  '["Approximate summary (not official text).", "Pool of Luck Points, refreshing on a long rest.", "Spend one for advantage on your own roll, or disadvantage on an incoming attack roll."]'::jsonb
) on conflict (name, source) do update set prerequisite = excluded.prerequisite, description = excluded.description, benefits = excluded.benefits;

insert into feats (name, source, prerequisite, description, benefits) values (
  'Tavern Brawler', 'homebrew', null,
  'Approximate summary (not official text). You''re proficient with unarmed strikes and hit harder with them than normal. When you hit a creature with an unarmed strike, you can also push it back or knock it prone as part of the same attack.',
  '["Approximate summary (not official text).", "Proficient with unarmed strikes; hit harder with them than normal.", "Hitting with an unarmed strike can also push the target back or knock it prone."]'::jsonb
) on conflict (name, source) do update set prerequisite = excluded.prerequisite, description = excluded.description, benefits = excluded.benefits;

-- Backfill origin_feat_name on the 12 homebrew backgrounds. "Guide" grants
-- Magic Initiate (Druid list recommended) — stored as just "Magic Initiate"
-- to match the feat's actual catalog name, same convention already used
-- for Acolyte/Sage (both grant Magic Initiate with a different recommended
-- list, and both are stored the same way).
update backgrounds set origin_feat_name = 'Crafter'        where name = 'Artisan'     and source = 'homebrew';
update backgrounds set origin_feat_name = 'Skilled'         where name = 'Charlatan'   and source = 'homebrew';
update backgrounds set origin_feat_name = 'Musician'        where name = 'Entertainer' and source = 'homebrew';
update backgrounds set origin_feat_name = 'Tough'           where name = 'Farmer'      and source = 'homebrew';
update backgrounds set origin_feat_name = 'Alert'           where name = 'Guard'       and source = 'homebrew';
update backgrounds set origin_feat_name = 'Magic Initiate'  where name = 'Guide'       and source = 'homebrew';
update backgrounds set origin_feat_name = 'Healer'          where name = 'Hermit'      and source = 'homebrew';
update backgrounds set origin_feat_name = 'Lucky'           where name = 'Merchant'    and source = 'homebrew';
update backgrounds set origin_feat_name = 'Skilled'         where name = 'Noble'       and source = 'homebrew';
update backgrounds set origin_feat_name = 'Tavern Brawler'  where name = 'Sailor'      and source = 'homebrew';
update backgrounds set origin_feat_name = 'Skilled'         where name = 'Scribe'      and source = 'homebrew';
update backgrounds set origin_feat_name = 'Lucky'           where name = 'Wayfarer'    and source = 'homebrew';
