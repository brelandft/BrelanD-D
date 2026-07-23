-- Migration: campaign descriptions + sprites
-- Additive — safe to run on an existing project with live data.

alter table campaigns add column description text;

alter table characters add column sprite_color text default 'blue';
alter table monsters add column sprite_key text default 'beast';

-- Tokens carry a denormalized snapshot of HP and sprite info, refreshed
-- whenever the underlying character/monster changes. This avoids needing
-- a join against two different possible tables (characters or
-- monster_instances) just to render the map, at the cost of the token's
-- displayed HP being "as of last update" rather than fully live — matches
-- the app's existing no-realtime-sync design.
alter table tokens add column hp_current int;
alter table tokens add column hp_max int;
alter table tokens add column sprite_key text;
alter table tokens add column sprite_color text;
