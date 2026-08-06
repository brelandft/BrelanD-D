-- Migration: DM session notes / encounters
-- Additive — safe on an existing project with live data.
--
-- Campaign-scoped prep content: encounters, NPCs, locations, plot
-- threads, loot, and reminders, each with a category and a lightweight
-- planned/active/done status so the DM can run a session off this tab
-- without losing finished threads (they dim, not disappear).

create table campaign_notes (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  title       text not null,
  category    text not null check (category in ('encounter', 'npc', 'location', 'plot', 'loot', 'reminder')),
  status      text not null default 'planned' check (status in ('planned', 'active', 'done')),
  body        text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index idx_campaign_notes_campaign on campaign_notes(campaign_id);

alter table campaign_notes enable row level security;
create policy "anon full access" on campaign_notes for all using (true) with check (true);
