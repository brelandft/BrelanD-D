-- =====================================================================
-- D&D Party App — Database Schema (Postgres / Supabase)
-- =====================================================================
-- Conventions:
--   - All primary keys are UUIDs (gen_random_uuid()).
--   - `source` distinguishes official SRD content from homebrew:
--        'srd'      = imported from open SRD dataset (5e-database etc.)
--        'homebrew' = authored by you / generated via the Claude proxy
--   - JSONB is used for nested, variable-shape data (ability scores,
--     stat blocks, features-by-level) rather than exploding everything
--     into join tables. Keeps this maintainable by two people.
--   - No initiative/turn-tracking tables — combat order stays on paper.
--   - No encounter-builder tables — monsters attach directly to a map
--     via monster_instances + tokens.
-- =====================================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ---------------------------------------------------------------------
-- Reference data: Races
-- ---------------------------------------------------------------------
create table races (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  source                text not null check (source in ('srd','homebrew')),
  size                  text,                          -- 'Small','Medium', etc.
  speed                 int,
  ability_score_bonuses jsonb default '{}',             -- e.g. {"dex": 2, "int": 1}
  traits                jsonb default '[]',             -- [{name, description}]
  languages             jsonb default '[]',             -- ["Common","Elvish"]
  darkvision_range      int default 0,
  subraces              jsonb default '[]',             -- [{name, ability_score_bonuses, traits}]
  description           text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Reference data: Classes + Subclasses
-- ---------------------------------------------------------------------
create table classes (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,
  source                    text not null check (source in ('srd','homebrew')),
  hit_die                   text,                       -- 'd8','d10', etc.
  primary_ability           jsonb default '[]',          -- ["str"] or ["str","dex"]
  saving_throw_proficiencies jsonb default '[]',         -- ["str","con"]
  armor_proficiencies       jsonb default '[]',
  weapon_proficiencies      jsonb default '[]',
  skill_choices             jsonb default '{}',          -- {"choose": 2, "from": ["Athletics",...]}
  features_by_level         jsonb default '{}',          -- {"1": [{name, description}], "2": [...]}
  spellcasting              jsonb,                        -- null if non-caster; else {ability, slots_by_level}
  description               text,
  created_at                timestamptz default now(),
  updated_at                timestamptz default now()
);

create table subclasses (
  id                 uuid primary key default gen_random_uuid(),
  class_id           uuid not null references classes(id) on delete cascade,
  name               text not null,
  source             text not null check (source in ('srd','homebrew')),
  unlocked_at_level  int default 3,
  features_by_level  jsonb default '{}',                 -- same shape as classes.features_by_level
  description        text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);
create index idx_subclasses_class on subclasses(class_id);

-- ---------------------------------------------------------------------
-- Reference data: Feats + Backgrounds
-- ---------------------------------------------------------------------
create table feats (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  source         text not null check (source in ('srd','homebrew')),
  prerequisite   text,
  description    text,
  benefits       jsonb default '[]',                     -- bullet list of effects
  created_at     timestamptz default now()
);

create table backgrounds (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  source                 text not null check (source in ('srd','homebrew')),
  skill_proficiencies    jsonb default '[]',
  tool_proficiencies     jsonb default '[]',
  languages              jsonb default '[]',
  starting_equipment     jsonb default '[]',
  feature_name           text,
  feature_description    text,
  description            text,
  created_at             timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Reference data: Items & Equipment
-- ---------------------------------------------------------------------
create table items (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  source        text not null check (source in ('srd','homebrew')),
  item_type     text not null check (item_type in
                  ('weapon','armor','shield','gear','tool','consumable','magic_item','treasure')),
  subtype       text,                                    -- 'martial melee', 'light armor', etc.
  cost_gp       numeric,
  weight_lb     numeric,
  damage        jsonb,                                   -- {"dice": "1d8", "type": "slashing"}
  armor_class   jsonb,                                    -- {"base": 11, "dex_bonus": true, "max_dex": 2}
  properties    jsonb default '[]',                       -- ["finesse","light","versatile (1d10)"]
  requires_attunement boolean default false,
  description   text,
  created_at    timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Reference data: Spells
-- ---------------------------------------------------------------------
create table spells (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  source         text not null check (source in ('srd','homebrew')),
  level          int not null check (level between 0 and 9), -- 0 = cantrip
  school         text,
  casting_time   text,
  range          text,
  components     jsonb default '[]',                     -- ["V","S","M"]
  material       text,
  duration       text,
  concentration  boolean default false,
  ritual         boolean default false,
  classes        jsonb default '[]',                      -- ["Wizard","Sorcerer"] (denormalized for filtering)
  description    text,
  higher_levels  text,
  created_at     timestamptz default now()
);
create index idx_spells_level on spells(level);

-- ---------------------------------------------------------------------
-- Sprites (shared by characters and monsters)
-- ---------------------------------------------------------------------
create table sprites (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  entity_type     text not null check (entity_type in ('character','monster','other')),
  image_url       text not null,                          -- Supabase Storage public URL
  frame_data      jsonb,                                   -- optional: {"frames": 4, "fps": 6} for idle animation
  created_at      timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Campaigns (progress — characters, maps, and deployed monsters all
-- belong to exactly one campaign; reference content like the bestiary,
-- items, spells, subclasses, backgrounds, and feats stays global and is
-- shared across every campaign, since re-adding your homebrew dragon
-- for each new game would be tedious for no benefit)
-- ---------------------------------------------------------------------
create table campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Characters (party members)
-- ---------------------------------------------------------------------
create table characters (
  id                 uuid primary key default gen_random_uuid(),
  campaign_id        uuid not null references campaigns(id) on delete cascade,
  owner_name         text,                                 -- which family member plays this character
  name               text not null,
  race_id            uuid references races(id),
  subrace_name       text,                                  -- matches an entry in races.subraces if applicable
  class_id           uuid references classes(id),
  subclass_id        uuid references subclasses(id),
  level              int not null default 1,
  background_id      uuid references backgrounds(id),
  sprite_color       text default 'blue',                   -- one of: red/orange/yellow/green/blue/purple
  alignment          text,
  abilities          jsonb not null default
                       '{"str":10,"dex":10,"con":10,"int":10,"wis":10,"cha":10}',
  skill_proficiencies jsonb default '[]',                   -- ["Perception","Stealth"]
  ac                 int default 10,
  speed              int default 30,
  hp                 jsonb not null default '{"current":10,"max":10,"temp":0}',
  hit_dice           jsonb default '{"total":1,"current":1,"die":"d8"}',
  death_saves        jsonb default '{"success":0,"fail":0}',
  exhaustion         int default 0,
  feat_ids           jsonb default '[]',                    -- array of feats.id
  spells_known       jsonb default '[]',                    -- [{"spell_id": "...", "prepared": true}]
  spell_slots        jsonb default '[]',                    -- [{"level":1,"total":4,"used":1}, ...]
  sprite_id          uuid references sprites(id),
  features_notes     text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);
create index idx_characters_class on characters(class_id);

-- Character inventory (join table: character <-> items, with instance data)
create table character_inventory (
  id           uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  item_id      uuid not null references items(id),
  quantity     int default 1,
  equipped     boolean default false,
  attuned      boolean default false,
  notes        text
);
create index idx_inventory_character on character_inventory(character_id);

-- ---------------------------------------------------------------------
-- Monsters (reusable stat blocks — includes Claude-generated ones)
-- ---------------------------------------------------------------------
create table monsters (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  source             text not null check (source in ('srd','homebrew')),
  generated_by_claude boolean default false,
  challenge_rating   numeric,
  size               text,
  type               text,                                  -- 'beast','undead','fiend', etc.
  alignment          text,
  sprite_key         text default 'beast',                   -- which pixel icon to use on the map
  ac                 int,
  hp_average         int,
  hp_dice            text,                                    -- '9d8+9'
  speed              jsonb default '{}',                       -- {"walk":30,"fly":60}
  abilities          jsonb not null default
                       '{"str":10,"dex":10,"con":10,"int":10,"wis":10,"cha":10}',
  saving_throws      jsonb default '{}',
  skills             jsonb default '{}',
  damage_resistances text,
  damage_immunities  text,
  condition_immunities text,
  senses             text,
  languages          text,
  traits             jsonb default '[]',                      -- [{name, description}]
  actions            jsonb default '[]',                      -- [{name, description}]
  legendary_actions  jsonb default '[]',
  sprite_id          uuid references sprites(id),
  description        text,
  created_at         timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Maps
-- ---------------------------------------------------------------------
create table maps (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references campaigns(id) on delete cascade,
  name         text not null,
  image_url    text not null,                                 -- Supabase Storage public URL
  grid         jsonb default '{"enabled": true, "cell_size": 50, "offset_x": 0, "offset_y": 0}',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- A specific monster placed into play (its own HP, separate from the template)
create table monster_instances (
  id            uuid primary key default gen_random_uuid(),
  monster_id    uuid not null references monsters(id),
  map_id        uuid references maps(id) on delete cascade,
  nickname      text,                                          -- 'Goblin #2'
  hp_current    int,
  hp_max        int,
  notes         text,
  created_at    timestamptz default now()
);
create index idx_monster_instances_map on monster_instances(map_id);

-- Tokens: position on a map. Polymorphic — points at a character OR a monster_instance.
create table tokens (
  id                  uuid primary key default gen_random_uuid(),
  map_id              uuid not null references maps(id) on delete cascade,
  entity_type         text not null check (entity_type in ('character','monster_instance')),
  entity_id           uuid not null,      -- references characters(id) or monster_instances(id)
                                            -- (no FK constraint possible across two tables;
                                            --  enforce in application code)
  x                   numeric not null default 0,
  y                   numeric not null default 0,
  color               text,               -- fallback token color if no sprite
  label               text,
  hp_current          int,                -- denormalized snapshot, refreshed on HP change
  hp_max              int,
  sprite_key          text,               -- which pixel icon to render
  sprite_color        text,               -- for character tokens; monster tokens use a fixed palette
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
create index idx_tokens_map on tokens(map_id);
create index idx_tokens_entity on tokens(entity_type, entity_id);

-- =====================================================================
-- Row Level Security — trusted-link model
-- =====================================================================
-- Since everyone using the app shares one link and there's no login
-- system, RLS here is about preventing *malformed/malicious external
-- requests* (e.g. a bot hitting the public Supabase REST endpoint),
-- not about separating users from each other. All authenticated-by-
-- anon-key requests get full read/write on gameplay tables.
-- =====================================================================
alter table characters enable row level security;
alter table character_inventory enable row level security;
alter table monsters enable row level security;
alter table monster_instances enable row level security;
alter table maps enable row level security;
alter table tokens enable row level security;
alter table campaigns enable row level security;

create policy "anon full access" on characters for all using (true) with check (true);
create policy "anon full access" on character_inventory for all using (true) with check (true);
create policy "anon full access" on monsters for all using (true) with check (true);
create policy "anon full access" on monster_instances for all using (true) with check (true);
create policy "anon full access" on maps for all using (true) with check (true);
create policy "anon full access" on tokens for all using (true) with check (true);
create policy "anon full access" on campaigns for all using (true) with check (true);

create index idx_characters_campaign on characters(campaign_id);
create index idx_maps_campaign on maps(campaign_id);

-- =====================================================================
-- Rate limiting for the Claude monster-generation proxy
-- =====================================================================
-- The Edge Function checks this table before calling the Anthropic API,
-- so a leaked endpoint URL can't run up API charges unattended.
create table generation_log (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  request_ip  text
);
alter table generation_log enable row level security;
-- No public policy at all: only the Edge Function (service role) touches
-- this table, so it's invisible even to the anon key.

-- =====================================================================
-- App settings (shared across all devices — e.g. the DM PIN)
-- =====================================================================
create table app_settings (
  key         text primary key,
  value       text,
  updated_at  timestamptz default now()
);
alter table app_settings enable row level security;
create policy "anon full access" on app_settings for all using (true) with check (true);

-- Reference tables (races/classes/feats/backgrounds/items/spells/sprites)
-- are read-only from the app's perspective day-to-day, so lock writes
-- to the service role (you, via a seed script) and leave reads open.
alter table races enable row level security;
alter table classes enable row level security;
alter table subclasses enable row level security;
alter table feats enable row level security;
alter table backgrounds enable row level security;
alter table items enable row level security;
alter table spells enable row level security;
alter table sprites enable row level security;

create policy "public read" on races for select using (true);
create policy "public read" on classes for select using (true);
create policy "public read" on subclasses for select using (true);
create policy "public read" on feats for select using (true);
create policy "public read" on backgrounds for select using (true);
create policy "public read" on items for select using (true);
create policy "public read" on spells for select using (true);
create policy "public read" on sprites for select using (true);
-- (homebrew additions to these tables go through the Claude proxy /
--  a small admin script using the service-role key, which bypasses RLS)
