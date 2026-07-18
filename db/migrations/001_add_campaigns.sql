-- Migration: add campaigns
-- Run this in the Supabase SQL Editor on an EXISTING project (one that
-- already has data). It does not delete or overwrite anything — existing
-- characters and maps get backfilled into a "My First Campaign" so
-- nothing you've already built breaks.
--
-- For a brand-new project, just run db/schema.sql instead — it already
-- includes campaigns from the start.

create table campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz default now()
);
alter table campaigns enable row level security;
create policy "anon full access" on campaigns for all using (true) with check (true);

-- Give existing data somewhere to land
insert into campaigns (name) values ('My First Campaign');

-- Add the columns as nullable first, backfill, then lock them down
alter table characters add column campaign_id uuid references campaigns(id) on delete cascade;
alter table maps add column campaign_id uuid references campaigns(id) on delete cascade;

update characters set campaign_id = (select id from campaigns order by created_at asc limit 1) where campaign_id is null;
update maps set campaign_id = (select id from campaigns order by created_at asc limit 1) where campaign_id is null;

alter table characters alter column campaign_id set not null;
alter table maps alter column campaign_id set not null;

create index idx_characters_campaign on characters(campaign_id);
create index idx_maps_campaign on maps(campaign_id);
